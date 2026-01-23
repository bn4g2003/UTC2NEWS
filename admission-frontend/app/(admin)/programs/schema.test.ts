/**
 * Program Schema Tests
 * Unit tests for program form validation schema
 */

import { describe, it, expect } from 'vitest';
import { createProgramSchema, updateProgramSchema } from './schema';

describe('Program Schema Validation', () => {
  describe('createProgramSchema', () => {
    it('should validate valid program data', () => {
      const validData = {
        code: 'CS',
        name: 'Computer Science',
        description: 'Bachelor of Computer Science program',
        subjectCombinations: {},
        isActive: true,
      };

      const result = createProgramSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid program code (lowercase)', () => {
      const invalidData = {
        code: 'cs',
        name: 'Computer Science',
      };

      const result = createProgramSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('uppercase');
      }
    });

    it('should reject program code that is too short', () => {
      const invalidData = {
        code: 'C',
        name: 'Computer Science',
      };

      const result = createProgramSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters');
      }
    });

    it('should reject program code that is too long', () => {
      const invalidData = {
        code: 'VERYLONGPROGRAMCODE123',
        name: 'Computer Science',
      };

      const result = createProgramSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('not exceed 20 characters');
      }
    });

    it('should reject program name that is too short', () => {
      const invalidData = {
        code: 'CS',
        name: 'CS',
      };

      const result = createProgramSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 3 characters');
      }
    });

    it('should reject program name that is too long', () => {
      const invalidData = {
        code: 'CS',
        name: 'A'.repeat(201),
      };

      const result = createProgramSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('not exceed 200 characters');
      }
    });

    it('should accept valid program code with underscores and hyphens', () => {
      const validData = {
        code: 'CS_AI-ML',
        name: 'Computer Science - AI and ML',
      };

      const result = createProgramSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept empty description', () => {
      const validData = {
        code: 'CS',
        name: 'Computer Science',
        description: '',
      };

      const result = createProgramSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept missing description', () => {
      const validData = {
        code: 'CS',
        name: 'Computer Science',
      };

      const result = createProgramSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject description that is too long', () => {
      const invalidData = {
        code: 'CS',
        name: 'Computer Science',
        description: 'A'.repeat(1001),
      };

      const result = createProgramSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('not exceed 1000 characters');
      }
    });

    it('should default isActive to true', () => {
      const validData = {
        code: 'CS',
        name: 'Computer Science',
      };

      const result = createProgramSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(true);
      }
    });

    it('should default subjectCombinations to empty object', () => {
      const validData = {
        code: 'CS',
        name: 'Computer Science',
      };

      const result = createProgramSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.subjectCombinations).toEqual({});
      }
    });
  });

  describe('updateProgramSchema', () => {
    it('should validate valid update data', () => {
      const validData = {
        code: 'CS',
        name: 'Computer Science Updated',
        description: 'Updated description',
        isActive: false,
      };

      const result = updateProgramSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should have same validation rules as create schema', () => {
      const invalidData = {
        code: 'cs',
        name: 'CS',
      };

      const result = updateProgramSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
