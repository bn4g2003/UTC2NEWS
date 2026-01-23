/**
 * Category Schema Tests
 * Unit tests for category form validation
 */

import { describe, it, expect } from 'vitest';
import { 
  categorySchema, 
  createCategorySchema, 
  updateCategorySchema,
  generateSlug 
} from './schema';

describe('Category Schema Validation', () => {
  describe('categorySchema', () => {
    it('should validate valid category data', () => {
      const validData = {
        name: 'Technology',
        slug: 'technology',
        description: 'Technology related posts',
      };

      const result = categorySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate category without description', () => {
      const validData = {
        name: 'Technology',
        slug: 'technology',
      };

      const result = categorySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate category with empty description', () => {
      const validData = {
        name: 'Technology',
        slug: 'technology',
        description: '',
      };

      const result = categorySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        slug: 'technology',
      };

      const result = categorySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name is required');
      }
    });

    it('should reject name exceeding 100 characters', () => {
      const invalidData = {
        name: 'a'.repeat(101),
        slug: 'technology',
      };

      const result = categorySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name must not exceed 100 characters');
      }
    });

    it('should reject empty slug', () => {
      const invalidData = {
        name: 'Technology',
        slug: '',
      };

      const result = categorySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Slug is required');
      }
    });

    it('should reject slug with uppercase letters', () => {
      const invalidData = {
        name: 'Technology',
        slug: 'Technology',
      };

      const result = categorySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Slug must be lowercase letters, numbers, and hyphens only');
      }
    });

    it('should reject slug with spaces', () => {
      const invalidData = {
        name: 'Technology',
        slug: 'tech news',
      };

      const result = categorySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject slug with special characters', () => {
      const invalidData = {
        name: 'Technology',
        slug: 'tech@news',
      };

      const result = categorySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept slug with hyphens', () => {
      const validData = {
        name: 'Technology',
        slug: 'tech-news-updates',
      };

      const result = categorySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept slug with numbers', () => {
      const validData = {
        name: 'Technology',
        slug: 'tech-2024',
      };

      const result = categorySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject description exceeding 500 characters', () => {
      const invalidData = {
        name: 'Technology',
        slug: 'technology',
        description: 'a'.repeat(501),
      };

      const result = categorySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Description must not exceed 500 characters');
      }
    });
  });

  describe('createCategorySchema', () => {
    it('should validate valid create data', () => {
      const validData = {
        name: 'Technology',
        slug: 'technology',
        description: 'Technology related posts',
      };

      const result = createCategorySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('updateCategorySchema', () => {
    it('should validate partial update data', () => {
      const validData = {
        name: 'Updated Technology',
      };

      const result = updateCategorySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate full update data', () => {
      const validData = {
        name: 'Updated Technology',
        slug: 'updated-technology',
        description: 'Updated description',
      };

      const result = updateCategorySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('generateSlug', () => {
    it('should convert to lowercase', () => {
      expect(generateSlug('Technology')).toBe('technology');
    });

    it('should replace spaces with hyphens', () => {
      expect(generateSlug('Tech News')).toBe('tech-news');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Tech & News!')).toBe('tech-news');
    });

    it('should handle Vietnamese characters', () => {
      expect(generateSlug('Công nghệ')).toBe('cong-nghe');
    });

    it('should handle multiple spaces', () => {
      expect(generateSlug('Tech   News')).toBe('tech-news');
    });

    it('should handle leading/trailing spaces', () => {
      expect(generateSlug('  Tech News  ')).toBe('tech-news');
    });

    it('should replace đ with d', () => {
      expect(generateSlug('Đại học')).toBe('dai-hoc');
    });

    it('should handle multiple hyphens', () => {
      expect(generateSlug('Tech---News')).toBe('tech-news');
    });

    it('should handle empty string', () => {
      expect(generateSlug('')).toBe('');
    });

    it('should handle complex Vietnamese text', () => {
      expect(generateSlug('Tuyển sinh Đại học 2024')).toBe('tuyen-sinh-dai-hoc-2024');
    });
  });
});
