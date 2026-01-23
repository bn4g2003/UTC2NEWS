import { IsString, IsOptional, IsEnum, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PostStatus } from '@prisma/client';

export class CreatePostDto {
  @ApiProperty({
    description: 'Post title',
    example: 'Admission Guidelines 2024',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'URL-friendly slug',
    example: 'admission-guidelines-2024',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  slug: string;

  @ApiProperty({
    description: 'Post content (HTML or Markdown)',
    example: '<p>This is the admission guidelines for 2024...</p>',
  })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiProperty({
    description: 'Brief excerpt or summary',
    example: 'A brief summary of the post',
    required: false,
  })
  @IsString()
  @IsOptional()
  excerpt?: string;

  @ApiProperty({
    description: 'Featured image URL',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  featuredImage?: string;

  @ApiProperty({
    description: 'Category ID',
    example: 'uuid-category-id',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({
    description: 'Post status',
    enum: PostStatus,
    example: PostStatus.published,
  })
  @IsEnum(PostStatus)
  status: PostStatus;

  @ApiProperty({
    description: 'Author user ID',
    example: 'uuid-user-id',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  authorId?: string;
}
