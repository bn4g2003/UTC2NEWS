/**
 * Post Form Schema
 * Zod validation schema for post creation and editing
 * Validates Requirement 16.5
 */

import { z } from 'zod';

/**
 * Slug validation
 * URL-friendly slug with lowercase letters, numbers, and hyphens
 */
const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(200, 'Slug must not exceed 200 characters')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens only');

/**
 * Post status enum
 */
export const PostStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
} as const;

export type PostStatusType = typeof PostStatus[keyof typeof PostStatus];

/**
 * Post form validation schema
 * Defines validation rules for post data
 */
export const postSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters'),
  
  slug: slugSchema,
  
  content: z
    .string()
    .min(1, 'Content is required')
    .max(50000, 'Content must not exceed 50000 characters'),
  
  excerpt: z
    .string()
    .max(500, 'Excerpt must not exceed 500 characters')
    .default(''),
  
  categoryId: z
    .string()
    .default('')
    .refine((val) => val === '' || z.string().uuid().safeParse(val).success, {
      message: 'Invalid category ID',
    }),
  
  featuredImage: z
    .string()
    .default('')
    .refine((val) => val === '' || z.string().url().safeParse(val).success, {
      message: 'Invalid image URL',
    }),
  
  status: z.enum(['draft', 'published']).default('draft'),
  
  authorId: z
    .string()
    .uuid('Invalid author ID')
    .optional(),
});

/**
 * Type inference from schema
 */
export type PostFormData = z.infer<typeof postSchema>;

/**
 * Create post schema
 */
export const createPostSchema = postSchema;

/**
 * Update post schema (all fields optional except required ones)
 */
export const updatePostSchema = postSchema.partial().extend({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters')
    .optional(),
  slug: slugSchema.optional(),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(50000, 'Content must not exceed 50000 characters')
    .optional(),
});

export type CreatePostFormData = z.infer<typeof createPostSchema>;
export type UpdatePostFormData = z.infer<typeof updatePostSchema>;

/**
 * Helper function to generate slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}
