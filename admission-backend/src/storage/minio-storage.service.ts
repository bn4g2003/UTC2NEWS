import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as Minio from 'minio';

export interface StorageResult {
  fileKey: string;
  bucket: string;
  url: string;
  size: number;
}

@Injectable()
export class MinioStorageService implements OnModuleInit {
  private readonly logger = new Logger(MinioStorageService.name);
  private minioClient: Minio.Client;
  private readonly bucketName: string;

  constructor() {
    this.bucketName = process.env.MINIO_BUCKET_NAME || 'admission-files';

    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });
  }

  async onModuleInit() {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`Bucket ${this.bucketName} created successfully`);
      } else {
        this.logger.log(`Bucket ${this.bucketName} already exists`);
      }
    } catch (error) {
      this.logger.error(`Error initializing MinIO bucket: ${error.message}`);
      this.logger.warn('MinIO storage will not be available. Please check your MinIO configuration and credentials.');
      // Don't throw error to prevent app from crashing
      // The app can still run without MinIO, but file uploads will fail
    }
  }

  async uploadFile(
    file: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<StorageResult> {
    try {
      const fileKey = `${Date.now()}-${filename}`;
      const metadata = {
        'Content-Type': mimeType,
      };

      await this.minioClient.putObject(
        this.bucketName,
        fileKey,
        file,
        file.length,
        metadata,
      );

      const url = await this.generatePresignedUrl(fileKey, 7 * 24 * 60 * 60); // 7 days

      this.logger.log(`File uploaded successfully: ${fileKey}`);

      return {
        fileKey,
        bucket: this.bucketName,
        url,
        size: file.length,
      };
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`, error.stack);
      throw error;
    }
  }

  async downloadFile(fileKey: string): Promise<Buffer> {
    try {
      const dataStream = await this.minioClient.getObject(this.bucketName, fileKey);
      const chunks: Buffer[] = [];

      return new Promise((resolve, reject) => {
        dataStream.on('data', (chunk) => chunks.push(chunk));
        dataStream.on('end', () => resolve(Buffer.concat(chunks)));
        dataStream.on('error', reject);
      });
    } catch (error) {
      this.logger.error(`Error downloading file: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteFile(fileKey: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, fileKey);
      this.logger.log(`File deleted successfully: ${fileKey}`);
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`, error.stack);
      throw error;
    }
  }

  async generatePresignedUrl(fileKey: string, expirySeconds: number): Promise<string> {
    try {
      const url = await this.minioClient.presignedGetObject(
        this.bucketName,
        fileKey,
        expirySeconds,
      );
      return url;
    } catch (error) {
      this.logger.error(`Error generating presigned URL: ${error.message}`, error.stack);
      throw error;
    }
  }
}
