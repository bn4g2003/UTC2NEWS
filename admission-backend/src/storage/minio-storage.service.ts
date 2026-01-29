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
  private readonly publicEndpoint: string;

  constructor() {
    this.bucketName = process.env.MINIO_BUCKET_NAME || 'admission-files';
    // Public endpoint for browser access (defaults to localhost for development)
    this.publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT || 'localhost:9000';

    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
    });
  }

  async onModuleInit() {
    const maxRetries = 3;
    let delay = 2000;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
        const port = process.env.MINIO_PORT || '9000';
        this.logger.log(`Connecting to MinIO at ${endpoint}:${port} (Attempt ${i + 1}/${maxRetries})...`);

        const bucketExists = await this.minioClient.bucketExists(this.bucketName);
        if (!bucketExists) {
          await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
          this.logger.log(`Bucket ${this.bucketName} created successfully`);
        } else {
          this.logger.log(`Bucket ${this.bucketName} already exists`);
        }

        // Set bucket policy to allow public read access
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };

        await this.minioClient.setBucketPolicy(
          this.bucketName,
          JSON.stringify(policy),
        );
        this.logger.log(`Bucket policy set to allow public read access`);

        this.logger.log(`MinIO storage initialized successfully (${endpoint}:${port})`);
        return; // Success, exit the loop
      } catch (error) {
        this.logger.error(`Error initializing MinIO bucket (Attempt ${i + 1}/${maxRetries}): ${error.message || 'Unknown error'}`);
        if (i === maxRetries - 1) {
          this.logger.error(error);
          this.logger.warn('MinIO storage will not be available. Please check your MinIO configuration and credentials.');
        } else {
          this.logger.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
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

      // Generate public URL instead of presigned URL
      const useSSL = process.env.MINIO_USE_SSL === 'true';
      const protocol = useSSL ? 'https' : 'http';
      const url = `${protocol}://${this.publicEndpoint}/${this.bucketName}/${fileKey}`;

      this.logger.log(`File uploaded successfully: ${fileKey}`);
      this.logger.log(`Public URL: ${url}`);

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
      
      this.logger.log(`Original MinIO URL: ${url}`);
      
      // Replace internal Docker hostname with public endpoint for browser access
      const useSSL = process.env.MINIO_USE_SSL === 'true';
      const protocol = useSSL ? 'https' : 'http';
      const internalEndpoint = process.env.MINIO_ENDPOINT || 'localhost';
      const internalPort = process.env.MINIO_PORT || '9000';
      
      // Try multiple replacement patterns to handle different URL formats
      let publicUrl = url;
      
      // Pattern 1: http://minio:9000/...
      publicUrl = publicUrl.replace(
        `${protocol}://${internalEndpoint}:${internalPort}`,
        `${protocol}://${this.publicEndpoint}`
      );
      
      // Pattern 2: minio:9000/... (missing protocol)
      publicUrl = publicUrl.replace(
        `${internalEndpoint}:${internalPort}`,
        this.publicEndpoint
      );
      
      // Pattern 3: minio9000/... (missing colon)
      publicUrl = publicUrl.replace(
        `${internalEndpoint}${internalPort}`,
        this.publicEndpoint
      );
      
      // Ensure URL has protocol
      if (!publicUrl.startsWith('http://') && !publicUrl.startsWith('https://')) {
        publicUrl = `${protocol}://${publicUrl}`;
      }
      
      this.logger.log(`Public URL: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      this.logger.error(`Error generating presigned URL: ${error.message}`, error.stack);
      throw error;
    }
  }
}
