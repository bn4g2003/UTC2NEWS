/**
 * User Schema Tests
 * Tests for user form validation schema
 */

import { describe, it, expect } from 'vitest';
import { createUserSchema, updateUserSchema } from './schema';

describe('User Schema Validation', () => {
  describe('createUserSchema', () => {
    it('should validate valid user data', () => {
      const validData = {
        username: 'testuser',
        password: 'Password123',
        email: 'test@example.com',
        fullName: 'Test User',
        isActive: true,
      };

      const result = createUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject username shorter than 3 characters', () => {
      const invalidData = {
        username: 'ab',
        password: 'Password123',
        email: 'test@example.com',
        fullName: 'Test User',
        isActive: true,
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 3 characters');
      }
    });

    it('should reject username with invalid characters', () => {
      const invalidData = {
        username: 'test@user',
        password: 'Password123',
        email: 'test@example.com',
        fullName: 'Test User',
        isActive: true,
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('letters, numbers, underscores');
      }
    });

    it('should reject password shorter than 8 characters', () => {
      const invalidData = {
        username: 'testuser',
        password: 'Pass1',
        email: 'test@example.com',
        fullName: 'Test User',
        isActive: true,
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 8 characters');
      }
    });

    it('should reject password without uppercase letter', () => {
      const invalidData = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        fullName: 'Test User',
        isActive: true,
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('uppercase letter');
      }
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        username: 'testuser',
        password: 'Password123',
        email: 'invalid-email',
        fullName: 'Test User',
        isActive: true,
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email');
      }
    });

    it('should reject empty full name', () => {
      const invalidData = {
        username: 'testuser',
        password: 'Password123',
        email: 'test@example.com',
        fullName: '',
        isActive: true,
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should default isActive to true if not provided', () => {
      const dataWithoutIsActive = {
        username: 'testuser',
        password: 'Password123',
        email: 'test@example.com',
        fullName: 'Test User',
      };

      const result = createUserSchema.safeParse(dataWithoutIsActive);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(true);
      }
    });
  });

  describe('updateUserSchema', () => {
    it('should validate valid update data without password', () => {
      const validData = {
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
        isActive: true,
        password: '',
      };

      const result = updateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate valid update data with password', () => {
      const validData = {
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
        isActive: true,
        password: 'NewPassword123',
      };

      const result = updateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow empty password for updates', () => {
      const dataWithEmptyPassword = {
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
        isActive: false,
        password: '',
      };

      const result = updateUserSchema.safeParse(dataWithEmptyPassword);
      expect(result.success).toBe(true);
    });

    it('should reject weak password if provided', () => {
      const invalidData = {
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
        isActive: true,
        password: 'weak',
      };

      const result = updateUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
