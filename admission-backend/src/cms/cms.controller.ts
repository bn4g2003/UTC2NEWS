import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { CmsService } from './cms.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';

@ApiTags('CMS')
@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  // Category endpoints
  @Post('categories')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('categories:create')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create category', description: 'Create a new content category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires categories:create permission' })
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return await this.cmsService.createCategory(createCategoryDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories', description: 'Retrieve all content categories (public)' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async findAllCategories() {
    return await this.cmsService.findAllCategories();
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by ID', description: 'Retrieve a specific category (public)' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findCategoryById(@Param('id') id: string) {
    return await this.cmsService.findCategoryById(id);
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('categories:update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update category', description: 'Update an existing category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires categories:update permission' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return await this.cmsService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('categories:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete category', description: 'Delete a category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires categories:delete permission' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async deleteCategory(@Param('id') id: string) {
    return await this.cmsService.deleteCategory(id);
  }

  // Post endpoints
  @Post('posts')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('posts:create')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create post', description: 'Create a new content post' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires posts:create permission' })
  async createPost(@Body() createPostDto: CreatePostDto, @Request() req) {
    // Optionally set authorId from authenticated user
    if (!createPostDto.authorId && req.user) {
      createPostDto.authorId = req.user.userId;
    }
    return await this.cmsService.createPost(createPostDto);
  }

  @Get('posts')
  @ApiOperation({ summary: 'Get all posts', description: 'Retrieve all posts, optionally filter by published status (public)' })
  @ApiQuery({ name: 'published', required: false, description: 'Filter by published status (true/false)' })
  @ApiResponse({ status: 200, description: 'Posts retrieved successfully' })
  async findAllPosts(@Query('published') published?: string) {
    const includePublishedOnly = published === 'true';
    return await this.cmsService.findAllPosts(includePublishedOnly);
  }

  @Get('posts/:id')
  @ApiOperation({ summary: 'Get post by ID', description: 'Retrieve a specific post (public)' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async findPostById(@Param('id') id: string) {
    return await this.cmsService.findPostById(id);
  }

  @Put('posts/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('posts:update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update post', description: 'Update an existing post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires posts:update permission' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async updatePost(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return await this.cmsService.updatePost(id, updatePostDto);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('posts:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete post', description: 'Delete a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires posts:delete permission' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async deletePost(@Param('id') id: string) {
    return await this.cmsService.deletePost(id);
  }

  // FAQ endpoints
  @Post('faqs')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('faqs:create')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create FAQ', description: 'Create a new FAQ entry' })
  @ApiResponse({ status: 201, description: 'FAQ created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires faqs:create permission' })
  async createFaq(@Body() createFaqDto: CreateFaqDto) {
    return await this.cmsService.createFaq(createFaqDto);
  }

  @Get('faqs')
  @ApiOperation({ summary: 'Get all FAQs', description: 'Retrieve all FAQs, optionally filter by active status (public)' })
  @ApiQuery({ name: 'active', required: false, description: 'Filter by active status (true/false)' })
  @ApiResponse({ status: 200, description: 'FAQs retrieved successfully' })
  async findAllFaqs(@Query('active') active?: string) {
    const activeOnly = active === 'true';
    return await this.cmsService.findAllFaqs(activeOnly);
  }

  @Get('faqs/:id')
  @ApiOperation({ summary: 'Get FAQ by ID', description: 'Retrieve a specific FAQ (public)' })
  @ApiParam({ name: 'id', description: 'FAQ ID' })
  @ApiResponse({ status: 200, description: 'FAQ retrieved successfully' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  async findFaqById(@Param('id') id: string) {
    return await this.cmsService.findFaqById(id);
  }

  @Put('faqs/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('faqs:update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update FAQ', description: 'Update an existing FAQ' })
  @ApiParam({ name: 'id', description: 'FAQ ID' })
  @ApiResponse({ status: 200, description: 'FAQ updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires faqs:update permission' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  async updateFaq(
    @Param('id') id: string,
    @Body() updateFaqDto: UpdateFaqDto,
  ) {
    return await this.cmsService.updateFaq(id, updateFaqDto);
  }

  @Delete('faqs/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('faqs:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete FAQ', description: 'Delete an FAQ' })
  @ApiParam({ name: 'id', description: 'FAQ ID' })
  @ApiResponse({ status: 200, description: 'FAQ deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires faqs:delete permission' })
  async deleteFaq(@Param('id') id: string) {
    return await this.cmsService.deleteFaq(id);
  }

  // Media upload endpoint
  @Post('media')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('media:upload')
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload media file', description: 'Upload an image or PDF file (max 10MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Media file uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires media:upload permission' })
  async uploadMedia(
    @UploadedFile()
    file: Express.Multer.File,
    @Request() req: any,
  ) {
    // Manual validation with better error messages
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf'
    ];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`);
    }

    const uploadedBy = req.user?.userId;
    return await this.cmsService.uploadMediaFile(file, uploadedBy);
  }

  @Get('media')
  @ApiOperation({ summary: 'Get all media files', description: 'Retrieve all uploaded media files (public)' })
  @ApiResponse({ status: 200, description: 'Media files retrieved successfully' })
  async findAllMediaFiles() {
    return await this.cmsService.findAllMediaFiles();
  }

  @Get('media/:id')
  @ApiOperation({ summary: 'Get media file by ID', description: 'Retrieve a specific media file (public)' })
  @ApiParam({ name: 'id', description: 'Media file ID' })
  @ApiResponse({ status: 200, description: 'Media file retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Media file not found' })
  async findMediaFileById(@Param('id') id: string) {
    return await this.cmsService.findMediaFileById(id);
  }

  @Delete('media/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('media:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete media file', description: 'Delete a media file' })
  @ApiParam({ name: 'id', description: 'Media file ID' })
  @ApiResponse({ status: 200, description: 'Media file deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires media:delete permission' })
  @ApiResponse({ status: 404, description: 'Media file not found' })
  async deleteMediaFile(@Param('id') id: string) {
    return await this.cmsService.deleteMediaFile(id);
  }
}
