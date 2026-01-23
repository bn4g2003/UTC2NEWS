/**
 * Student Schema Tests
 * Unit tests for student form validation schemas
 */

import { describe, it, expect } from 'vitest';
import { createStudentSchema, updateStudentSchema } from './schema';

describe('Student Schema Validation', () => {
  describe('createStudentSchema', () => {
    it('should validate a valid student with all required fields', () => {
      const validStudent = {
        idCard: '123456789',
        fullName: 'Nguyen Van A',
        dateOfBirth: '2005-01-01',
        email: 'nguyenvana@example.com',
        phone: '0123456789',
        address: '123 Main St, Hanoi',
        priorityPoints: 2,
      };

      const result = createStudentSchema.safeParse(validStudent);
      expect(result.success).toBe(true);
    });

    it('should validate a valid student with 12-digit ID card', () => {
      const validStudent = {
        idCard: '123456789012',
        fullName: 'Nguyen Van B',
        dateOfBirth: '2005-01-01',
        priorityPoints: 0,
      };

      const result = createStudentSchema.safeParse(validStudent);
      expect(result.success).toBe(true);
    });

    it('should reject student with invalid ID card (wrong length)', () => {
      const invalidStudent = {
        idCard: '12345', // Too short
        fullName: 'Nguyen Van C',
        dateOfBirth: '2005-01-01',
      };

      const result = createStudentSchema.safeParse(invalidStudent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('idCard');
      }
    });

    it('should reject student with invalid ID card (contains letters)', () => {
      const invalidStudent = {
        idCard: '12345678A',
        fullName: 'Nguyen Van D',
        dateOfBirth: '2005-01-01',
      };

      const result = createStudentSchema.safeParse(invalidStudent);
      expect(result.success).toBe(false);
    });

    it('should reject student with empty full name', () => {
      const invalidStudent = {
        idCard: '123456789',
        fullName: '',
        dateOfBirth: '2005-01-01',
      };

      const result = createStudentSchema.safeParse(invalidStudent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('fullName');
      }
    });

    it('should reject student with invalid full name (contains numbers)', () => {
      const invalidStudent = {
        idCard: '123456789',
        fullName: 'Nguyen Van 123',
        dateOfBirth: '2005-01-01',
      };

      const result = createStudentSchema.safeParse(invalidStudent);
      expect(result.success).toBe(false);
    });

    it('should reject student with invalid email', () => {
      const invalidStudent = {
        idCard: '123456789',
        fullName: 'Nguyen Van E',
        dateOfBirth: '2005-01-01',
        email: 'invalid-email',
      };

      const result = createStudentSchema.safeParse(invalidStudent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
      }
    });

    it('should reject student with invalid phone number (wrong format)', () => {
      const invalidStudent = {
        idCard: '123456789',
        fullName: 'Nguyen Van F',
        dateOfBirth: '2005-01-01',
        phone: '123456789', // Doesn't start with 0
      };

      const result = createStudentSchema.safeParse(invalidStudent);
      expect(result.success).toBe(false);
    });

    it('should reject student with invalid phone number (wrong length)', () => {
      const invalidStudent = {
        idCard: '123456789',
        fullName: 'Nguyen Van G',
        dateOfBirth: '2005-01-01',
        phone: '012345', // Too short
      };

      const result = createStudentSchema.safeParse(invalidStudent);
      expect(result.success).toBe(false);
    });

    it('should reject student with priority points below 0', () => {
      const invalidStudent = {
        idCard: '123456789',
        fullName: 'Nguyen Van H',
        dateOfBirth: '2005-01-01',
        priorityPoints: -1,
      };

      const result = createStudentSchema.safeParse(invalidStudent);
      expect(result.success).toBe(false);
    });

    it('should reject student with priority points above 3', () => {
      const invalidStudent = {
        idCard: '123456789',
        fullName: 'Nguyen Van I',
        dateOfBirth: '2005-01-01',
        priorityPoints: 4,
      };

      const result = createStudentSchema.safeParse(invalidStudent);
      expect(result.success).toBe(false);
    });

    it('should accept student with optional fields omitted', () => {
      const validStudent = {
        idCard: '123456789',
        fullName: 'Nguyen Van J',
        dateOfBirth: '2005-01-01',
      };

      const result = createStudentSchema.safeParse(validStudent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priorityPoints).toBe(0); // Default value
      }
    });

    it('should accept student with empty string for optional fields', () => {
      const validStudent = {
        idCard: '123456789',
        fullName: 'Nguyen Van K',
        dateOfBirth: '2005-01-01',
        email: '',
        phone: '',
        address: '',
      };

      const result = createStudentSchema.safeParse(validStudent);
      expect(result.success).toBe(true);
    });
  });

  describe('updateStudentSchema', () => {
    it('should validate a valid update with all fields', () => {
      const validUpdate = {
        idCard: '123456789',
        fullName: 'Nguyen Van Updated',
        dateOfBirth: '2005-01-01',
        email: 'updated@example.com',
        phone: '0987654321',
        address: 'Updated Address',
        priorityPoints: 3,
      };

      const result = updateStudentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate a partial update with only ID card', () => {
      const validUpdate = {
        idCard: '123456789',
      };

      const result = updateStudentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate a partial update with ID card and name', () => {
      const validUpdate = {
        idCard: '123456789',
        fullName: 'Nguyen Van Updated',
      };

      const result = updateStudentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should reject update without ID card', () => {
      const invalidUpdate = {
        fullName: 'Nguyen Van Updated',
        dateOfBirth: '2005-01-01',
      };

      const result = updateStudentSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('idCard');
      }
    });

    it('should reject update with invalid ID card', () => {
      const invalidUpdate = {
        idCard: 'invalid',
        fullName: 'Nguyen Van Updated',
      };

      const result = updateStudentSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle Vietnamese characters in full name', () => {
      const validStudent = {
        idCard: '123456789',
        fullName: 'Nguyễn Văn Ánh',
        dateOfBirth: '2005-01-01',
      };

      const result = createStudentSchema.safeParse(validStudent);
      expect(result.success).toBe(true);
    });

    it('should reject full name with special characters', () => {
      const invalidStudent = {
        idCard: '123456789',
        fullName: 'Nguyen Van @#$',
        dateOfBirth: '2005-01-01',
      };

      const result = createStudentSchema.safeParse(invalidStudent);
      expect(result.success).toBe(false);
    });

    it('should reject address longer than 200 characters', () => {
      const invalidStudent = {
        idCard: '123456789',
        fullName: 'Nguyen Van Long',
        dateOfBirth: '2005-01-01',
        address: 'A'.repeat(201),
      };

      const result = createStudentSchema.safeParse(invalidStudent);
      expect(result.success).toBe(false);
    });

    it('should accept address exactly 200 characters', () => {
      const validStudent = {
        idCard: '123456789',
        fullName: 'Nguyen Van Long',
        dateOfBirth: '2005-01-01',
        address: 'A'.repeat(200),
      };

      const result = createStudentSchema.safeParse(validStudent);
      expect(result.success).toBe(true);
    });
  });
});
