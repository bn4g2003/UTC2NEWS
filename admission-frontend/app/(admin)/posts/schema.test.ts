/**
 * Post Schema Tests
 * Unit tests for post form validation schema
 */

import { describe, it, expect } from 'vitest';
import { createPostSchema, updatePostSchema, generateSlug, PostStatus } from './schema';

describe('Post Schema Validation', () => {
  describe('createPostSchema', () => {
    it('should validate a valid post', () => {
      const validPost = {
        title: 'Test Post Title',
        slug: 'test-post-title',
        content: 'This is the post content',
        status: PostStatus.DRAFT,
      };

      const result = createPostSchema.safeParse(validPost);
      expect(result.success).toBe(true);
    });

    it('should require title', () => {
      const invalidPost = {
        slug: 'test-post',
        content: 'Content',
        status: PostStatus.DRAFT,
      };

      const result = createPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('title');
      }
    });

    it('should require slug', () => {
      const invalidPost = {
        title: 'Test Post',
        content: 'Content',
        status: PostStatus.DRAFT,
      };

      const result = createPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('slug');
      }
    });

    it('should require content', () => {
      const invalidPost = {
        title: 'Test Post',
        slug: 'test-post',
        status: PostStatus.DRAFT,
      };

      const result = createPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('content');
      }
    });

    it('should validate slug format', () => {
      const invalidPost = {
        title: 'Test Post',
        slug: 'Invalid Slug With Spaces',
        content: 'Content',
        status: PostStatus.DRAFT,
      };

      const result = createPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('slug');
      }
    });

    it('should accept valid slug with hyphens', () => {
      const validPost = {
        title: 'Test Post',
        slug: 'test-post-with-hyphens',
        content: 'Content',
        status: PostStatus.DRAFT,
      };

      const result = createPostSchema.safeParse(validPost);
      expect(result.success).toBe(true);
    });

    it('should validate title length', () => {
      const invalidPost = {
        title: 'a'.repeat(201),
        slug: 'test-post',
        content: 'Content',
        status: PostStatus.DRAFT,
      };

      const result = createPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('200');
      }
    });

    it('should validate content length', () => {
      const invalidPost = {
        title: 'Test Post',
        slug: 'test-post',
        content: 'a'.repeat(50001),
        status: PostStatus.DRAFT,
      };

      const result = createPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('50000');
      }
    });

    it('should accept optional fields', () => {
      const validPost = {
        title: 'Test Post',
        slug: 'test-post',
        content: 'Content',
        excerpt: 'Brief summary',
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        featuredImage: 'https://example.com/image.jpg',
        status: PostStatus.PUBLISHED,
      };

      const result = createPostSchema.safeParse(validPost);
      expect(result.success).toBe(true);
    });

    it('should validate categoryId as UUID', () => {
      const invalidPost = {
        title: 'Test Post',
        slug: 'test-post',
        content: 'Content',
        categoryId: 'invalid-uuid',
        status: PostStatus.DRAFT,
      };

      const result = createPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('categoryId');
      }
    });

    it('should validate featuredImage as URL', () => {
      const invalidPost = {
        title: 'Test Post',
        slug: 'test-post',
        content: 'Content',
        featuredImage: 'not-a-url',
        status: PostStatus.DRAFT,
      };

      const result = createPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('featuredImage');
      }
    });

    it('should accept empty strings for optional fields', () => {
      const validPost = {
        title: 'Test Post',
        slug: 'test-post',
        content: 'Content',
        excerpt: '',
        categoryId: '',
        featuredImage: '',
        status: PostStatus.DRAFT,
      };

      const result = createPostSchema.safeParse(validPost);
      expect(result.success).toBe(true);
    });
  });

  describe('updatePostSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        title: 'Updated Title',
      };

      const result = updatePostSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate fields when provided', () => {
      const invalidUpdate = {
        slug: 'Invalid Slug',
      };

      const result = updatePostSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe('generateSlug', () => {
    it('should convert title to lowercase slug', () => {
      const slug = generateSlug('Test Post Title');
      expect(slug).toBe('test-post-title');
    });

    it('should replace spaces with hyphens', () => {
      const slug = generateSlug('Multiple Word Title');
      expect(slug).toBe('multiple-word-title');
    });

    it('should remove special characters', () => {
      const slug = generateSlug('Title with @#$% special chars!');
      expect(slug).toBe('title-with-special-chars');
    });

    it('should handle Vietnamese characters', () => {
      const slug = generateSlug('Tiêu đề bài viết');
      expect(slug).toBe('tieu-de-bai-viet');
    });

    it('should remove multiple consecutive hyphens', () => {
      const slug = generateSlug('Title   with   spaces');
      expect(slug).toBe('title-with-spaces');
    });

    it('should trim leading and trailing spaces', () => {
      const slug = generateSlug('  Title with spaces  ');
      expect(slug).toBe('title-with-spaces');
    });

    it('should handle empty string', () => {
      const slug = generateSlug('');
      expect(slug).toBe('');
    });

    it('should handle numbers', () => {
      const slug = generateSlug('Post 123 Title');
      expect(slug).toBe('post-123-title');
    });
  });
});
