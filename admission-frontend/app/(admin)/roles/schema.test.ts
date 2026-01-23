/**
 * Role Schema Tests
 * Tests for role form validation schema
 */

import { describe, it, expect } from 'vitest';
import { roleSchema, createRoleSchema, updateRoleSchema } from './schema';

describe('Role Schema Validation', () => {
  describe('roleSchema', () => {
    it('should validate a valid role', () => {
      const validRole = {
        name: 'admin',
        description: 'Administrator role',
      };

      const result = roleSchema.safeParse(validRole);
      expect(result.success).toBe(true);
    });

    it('should validate role without description', () => {
      const validRole = {
        name: 'editor',
      };

      const result = roleSchema.safeParse(validRole);
      expect(result.success).toBe(true);
    });

    it('should reject role name shorter than 3 characters', () => {
      const invalidRole = {
        name: 'ab',
        description: 'Test role',
      };

      const result = roleSchema.safeParse(invalidRole);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 3 characters');
      }
    });

    it('should reject role name longer than 50 characters', () => {
      const invalidRole = {
        name: 'a'.repeat(51),
        description: 'Test role',
      };

      const result = roleSchema.safeParse(invalidRole);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('not exceed 50 characters');
      }
    });

    it('should reject role name with invalid characters', () => {
      const invalidRole = {
        name: 'admin role!',
        description: 'Test role',
      };

      const result = roleSchema.safeParse(invalidRole);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('letters, numbers, underscores, and hyphens');
      }
    });

    it('should accept role name with underscores and hyphens', () => {
      const validRole = {
        name: 'admin_role-test',
        description: 'Test role',
      };

      const result = roleSchema.safeParse(validRole);
      expect(result.success).toBe(true);
    });

    it('should reject description longer than 200 characters', () => {
      const invalidRole = {
        name: 'admin',
        description: 'a'.repeat(201),
      };

      const result = roleSchema.safeParse(invalidRole);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('not exceed 200 characters');
      }
    });

    it('should accept empty string for description', () => {
      const validRole = {
        name: 'admin',
        description: '',
      };

      const result = roleSchema.safeParse(validRole);
      expect(result.success).toBe(true);
    });
  });

  describe('createRoleSchema', () => {
    it('should be the same as roleSchema', () => {
      expect(createRoleSchema).toBe(roleSchema);
    });
  });

  describe('updateRoleSchema', () => {
    it('should be the same as roleSchema', () => {
      expect(updateRoleSchema).toBe(roleSchema);
    });
  });
});
