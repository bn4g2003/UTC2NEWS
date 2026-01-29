import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioStorageService } from '../storage/minio-storage.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { PostStatus } from '@prisma/client';
import { SearchService } from './search.service';

@Injectable()
export class CmsService {
  private readonly logger = new Logger(CmsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: MinioStorageService,
    private readonly searchService: SearchService,
  ) { }

  // Category CRUD methods
  async createCategory(data: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Category with this slug already exists');
      }
      this.logger.error(`Error creating category: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAllCategories() {
    return await this.prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCategoryById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        posts: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async updateCategory(id: string, data: UpdateCategoryDto) {
    try {
      return await this.prisma.category.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Category with this slug already exists');
      }
      this.logger.error(`Error updating category: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteCategory(id: string) {
    try {
      return await this.prisma.category.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      this.logger.error(`Error deleting category: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Post CRUD methods
  async searchPosts(query: string, limit = 5, useHybrid = true, useChunks = true) {
    // Sử dụng hybrid search với chunks mặc định để có kết quả tốt nhất
    if (useHybrid && useChunks) {
      return await this.searchService.hybridSearchWithChunks(query, limit);
    }

    if (useChunks) {
      return await this.searchService.searchWithChunks(query, limit);
    }

    if (useHybrid) {
      return await this.searchService.hybridSearch(query, limit);
    }

    return await this.searchService.search(query, limit);
  }

  async createPost(data: CreatePostDto) {
    try {
      const postData: any = {
        title: data.title,
        slug: data.slug,
        content: data.content,
        status: data.status,
      };

      if (data.categoryId) {
        postData.categoryId = data.categoryId;
      }

      if (data.authorId) {
        postData.authorId = data.authorId;
      }

      if (data.status === PostStatus.published) {
        postData.publishedAt = new Date();
      }

      // Add missing fields
      if (data.excerpt) {
        postData.excerpt = data.excerpt;
      }
      if (data.featuredImage) {
        postData.featuredImage = data.featuredImage;
      }

      const post = await this.prisma.post.create({
        data: postData,
        include: {
          category: true,
          author: true,
        },
      });

      // Index post for vector search (don't fail creation if indexing fails)
      try {
        await this.searchService.indexPostWithChunks(post.id, post.title, post.content);
      } catch (e) {
        this.logger.warn(`Failed to index post ${post.id}: ${e.message}`);
      }

      return post;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Post with this slug already exists');
      }
      if (error.code === 'P2003') {
        throw new NotFoundException('Category or author not found');
      }
      this.logger.error(`Error creating post: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAllPosts(includePublishedOnly = false) {
    const where = includePublishedOnly ? { status: PostStatus.published } : {};

    return await this.prisma.post.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        category: true,
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPostById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async updatePost(id: string, data: UpdatePostDto) {
    try {
      const updateData: any = { ...data };

      // If status is being changed to published and publishedAt is not set, set it now
      if (updateData.status === PostStatus.published) {
        const existingPost = await this.prisma.post.findUnique({
          where: { id },
          select: { publishedAt: true },
        });

        if (existingPost && !existingPost.publishedAt) {
          updateData.publishedAt = new Date();
        }
      }

      const post = await this.prisma.post.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          author: true,
        },
      });

      // Update vector index
      if (data.title || data.content) {
        try {
          await this.searchService.indexPostWithChunks(post.id, post.title, post.content);
        } catch (e) {
          this.logger.warn(`Failed to update index for post ${post.id}: ${e.message}`);
        }
      }

      return post;
    } catch (error) {
      // ... catch block

      if (error.code === 'P2025') {
        throw new NotFoundException(`Post with ID ${id} not found`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Post with this slug already exists');
      }
      if (error.code === 'P2003') {
        throw new NotFoundException('Category or author not found');
      }
      this.logger.error(`Error updating post: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deletePost(id: string) {
    try {
      return await this.prisma.post.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Post with ID ${id} not found`);
      }
      this.logger.error(`Error deleting post: ${error.message}`, error.stack);
      throw error;
    }
  }

  // FAQ CRUD methods
  async createFaq(data: CreateFaqDto) {
    return await this.prisma.fAQ.create({
      data: {
        question: data.question,
        answer: data.answer,
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  async findAllFaqs(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {};

    return await this.prisma.fAQ.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findFaqById(id: string) {
    const faq = await this.prisma.fAQ.findUnique({
      where: { id },
    });

    if (!faq) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }

    return faq;
  }

  async updateFaq(id: string, data: UpdateFaqDto) {
    try {
      return await this.prisma.fAQ.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`FAQ with ID ${id} not found`);
      }
      this.logger.error(`Error updating FAQ: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteFaq(id: string) {
    try {
      return await this.prisma.fAQ.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`FAQ with ID ${id} not found`);
      }
      this.logger.error(`Error deleting FAQ: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Media file upload
  async uploadMediaFile(
    file: Express.Multer.File,
    uploadedBy?: string,
  ) {
    try {
      // Upload to MinIO
      const storageResult = await this.storageService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
      );

      // Save metadata to database
      const mediaFile = await this.prisma.mediaFile.create({
        data: {
          filename: storageResult.fileKey,
          originalName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: storageResult.size,
          storagePath: storageResult.url,
          uploadedBy,
        },
        include: {
          uploader: uploadedBy
            ? {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            }
            : false,
        },
      });

      return mediaFile;
    } catch (error) {
      this.logger.error(`Error uploading media file: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAllMediaFiles() {
    return await this.prisma.mediaFile.findMany({
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMediaFileById(id: string) {
    const mediaFile = await this.prisma.mediaFile.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    if (!mediaFile) {
      throw new NotFoundException(`Media file with ID ${id} not found`);
    }

    return mediaFile;
  }

  async deleteMediaFile(id: string) {
    try {
      const mediaFile = await this.prisma.mediaFile.findUnique({
        where: { id },
      });

      if (!mediaFile) {
        throw new NotFoundException(`Media file with ID ${id} not found`);
      }

      // Delete from MinIO
      await this.storageService.deleteFile(mediaFile.filename);

      // Delete from database
      return await this.prisma.mediaFile.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Media file with ID ${id} not found`);
      }
      this.logger.error(`Error deleting media file: ${error.message}`, error.stack);
      throw error;
    }
  }
}
