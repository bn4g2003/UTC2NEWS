/**
 * Session Schema Tests
 * Unit tests for session form validation schema
 */

import { describe, it, expect } from 'vitest';
import { createSessionSchema, updateSessionSchema } from './schema';

describe('Session Schema Validation', () => {
  describe('createSessionSchema', () => {
    it('should validate valid session data', () => {
      const validData = {
        name: 'Admission 2024',
        year: 2024,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        status: 'upcoming' as const,
      };

      const result = createSessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject session name that is too short', () => {
      const invalidData = {
        name: 'AB',
        year: 2024,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const result = createSessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 3 characters');
      }
    });

    it('should reject session name that is too long', () => {
      const invalidData = {
        name: 'A'.repeat(201),
        year: 2024,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const result = createSessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('not exceed 200 characters');
      }
    });

    it('should reject year that is too early', () => {
      const invalidData = {
        name: 'Admission 1999',
        year: 1999,
        startDate: '1999-01-01',
        endDate: '1999-12-31',
      };

      const result = createSessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('2000 or later');
      }
    });

    it('should reject year that is too late', () => {
      const invalidData = {
        name: 'Admission 2101',
        year: 2101,
        startDate: '2101-01-01',
        endDate: '2101-12-31',
      };

      const result = createSessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('2100 or earlier');
      }
    });

    it('should reject non-integer year', () => {
      const invalidData = {
        name: 'Admission 2024',
        year: 2024.5,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const result = createSessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('integer');
      }
    });

    it('should reject invalid start date format', () => {
      const invalidData = {
        name: 'Admission 2024',
        year: 2024,
        startDate: 'invalid-date',
        endDate: '2024-12-31',
      };

      const result = createSessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid start date');
      }
    });

    it('should reject invalid end date format', () => {
      const invalidData = {
        name: 'Admission 2024',
        year: 2024,
        startDate: '2024-01-01',
        endDate: 'invalid-date',
      };

      const result = createSessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid end date');
      }
    });

    it('should reject end date before start date (Requirement 11.7)', () => {
      const invalidData = {
        name: 'Admission 2024',
        year: 2024,
        startDate: '2024-12-31',
        endDate: '2024-01-01',
      };

      const result = createSessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('End date must be after start date');
      }
    });

    it('should reject end date equal to start date', () => {
      const invalidData = {
        name: 'Admission 2024',
        year: 2024,
        startDate: '2024-06-01',
        endDate: '2024-06-01',
      };

      const result = createSessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('End date must be after start date');
      }
    });

    it('should accept valid status values', () => {
      const statuses = ['upcoming', 'active', 'closed'] as const;
      
      statuses.forEach(status => {
        const validData = {
          name: 'Admission 2024',
          year: 2024,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          status,
        };

        const result = createSessionSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid status value', () => {
      const invalidData = {
        name: 'Admission 2024',
        year: 2024,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        status: 'invalid',
      };

      const result = createSessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should default status to upcoming', () => {
      const validData = {
        name: 'Admission 2024',
        year: 2024,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const result = createSessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('upcoming');
      }
    });

    it('should reject missing required fields', () => {
      const invalidData = {};

      const result = createSessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updateSessionSchema', () => {
    it('should validate valid update data', () => {
      const validData = {
        name: 'Admission 2024 Updated',
        year: 2024,
        status: 'active' as const,
      };

      const result = updateSessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow partial updates', () => {
      const validData = {
        name: 'Updated Name',
      };

      const result = updateSessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate date relationship when both dates provided', () => {
      const invalidData = {
        startDate: '2024-12-31',
        endDate: '2024-01-01',
      };

      const result = updateSessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('End date must be after start date');
      }
    });

    it('should allow updating only start date', () => {
      const validData = {
        startDate: '2024-01-01',
      };

      const result = updateSessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow updating only end date', () => {
      const validData = {
        endDate: '2024-12-31',
      };

      const result = updateSessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should have same validation rules as create schema for provided fields', () => {
      const invalidData = {
        name: 'AB',
      };

      const result = updateSessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 3 characters');
      }
    });
  });
});
