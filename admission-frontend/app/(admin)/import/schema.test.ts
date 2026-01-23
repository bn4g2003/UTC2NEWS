/**
 * Import Schema Tests
 * Unit tests for Excel import validation schema
 */

import { describe, it, expect } from 'vitest';
import { importStudentSchema, EXCEL_COLUMN_MAP } from './schema';

describe('Import Schema Validation', () => {
  describe('Valid Data', () => {
    it('should validate complete valid student data', () => {
      const validData = {
        idCard: '123456789',
        fullName: 'Nguyen Van A',
        dateOfBirth: '2005-01-15',
        email: 'student@example.com',
        phone: '0912345678',
        address: '123 Main St, Hanoi',
        priorityPoints: 0,
      };

      const result = importStudentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate minimal required data', () => {
      const minimalData = {
        idCard: '123456789',
        fullName: 'Nguyen Van A',
        dateOfBirth: '2005-01-15',
      };

      const result = importStudentSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    it('should accept 12-digit ID card number', () => {
      const data = {
        idCard: '123456789012',
        fullName: 'Nguyen Van A',
        dateOfBirth: '2005-01-15',
      };

      const result = importStudentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept empty optional fields', () => {
      const data = {
        idCard: '123456789',
        fullName: 'Nguyen Van A',
        dateOfBirth: '2005-01-15',
        email: '',
        phone: '',
        address: '',
      };

      const result = importStudentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid ID Card', () => {
    it('should reject empty ID card', () => {
      const data = {
        idCard: '',
        fullName: 'Nguyen Van A',
        dateOfBirth: '2005-01-15',
      };

      const result = importStudentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject ID card with letters', () => {
      const data = {
        idCard: '12345678A',
        fullName: 'Nguyen Van A',
        dateOfBirth: '2005-01-15',
      };

      const result = importStudentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject ID card with wrong length', () => {
      const data = {
        idCard: '12345',
        fullName: 'Nguyen Van A',
        dateOfBirth: '2005-01-15',
      };

      const result = importStudentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid Full Name', () => {
    it('should reject empty full name', () => {
      const data = {
        idCard: '123456789',
        fullName: '',
        dateOfBirth: '2005-01-15',
      };

      const result = importStudentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject full name with numbers', () => {
      const data = {
        idCard: '123456789',
        fullName: 'Nguyen Van A 123',
        dateOfBirth: '2005-01-15',
      };

      const result = importStudentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject full name exceeding 100 characters', () => {
      const data = {
        idCard: '123456789',
        fullName: 'A'.repeat(101),
        dateOfBirth: '2005-01-15',
      };

      const result = importStudentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid Date of Birth', () => {
    it('should reject empty date of birth', () => {
      const data = {
        idCard: '123456789',
        fullName: 'Nguyen Van A',
        dateOfBirth: '',
      };

      const result = importStudentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid date format', () => {
      const data = {
        idCard: '123456789',
        fullName: 'Nguyen Van A',
        dateOfBirth: 'invalid-date',
      };

      const result = importStudentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject age below 15', () => {
      const currentYear = new Date().getFullYear();
      const data = {
        idCard: '123456789',
        fullName: 'Nguyen Van A',
        dateOfBirth: `${currentYear - 10}-01-15`,
      };

      const result = importStudentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject age above 100', () => {
      const currentYear = new Date().getFullYear();
      const data = {
        idCard: '123456789',
        fullName: 'Nguyen Van A',
        dateOfBirth: `${currentYear - 110}-01-15`,
      };

      const result = importStudentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid Email', () => {
    it('should reject invalid email format', () => {
      const data = {
        idCard: '123456789',
        fullName: 'Nguyen Van A',
        dateOfBirth: '2005-01-15',
        email: 'invalid-email',
      };

      const result = importStudentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid Phone', () => {
    it('should reject phone not starting with 0', () => {
      const data = {
        idCard: '123456789',
        fullName: 'Nguyen Van A',
        dateOfBirth: '2005-01-15',
        phone: '1912345678',
      };

      const result = importStudentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject phone with wrong length', () => {
      const data = {
        idCard: '123456789',
        fullName: 'Nguyen Van A',
        dateOfBirth: '2005-01-15',
        phone: '091234567',
      };

      const result = importStudentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid Address', () => {
    it('should reject address exceeding 200 characters', () => {
      const data = {
        idCard: '123456789',
        fullName: 'Nguyen Van A',
        dateOfBirth: '2005-01-15',
        address: 'A'.repeat(201),
      };

      const result = importStudentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid Priority Points', () => {
    it('should reject negative priority points', () => {
      const data = {
        idCard: '123456789',
        fullName: 'Nguyen Van A',
        dateOfBirth: '2005-01-15',
        priorityPoints: -1,
      };

      const result = importStudentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject priority points above 3', () => {
      const data = {
        idCard: '123456789',
        fullName: 'Nguyen Van A',
        dateOfBirth: '2005-01-15',
        priorityPoints: 4,
      };

      const result = importStudentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should convert string priority points to number', () => {
      const data = {
        idCard: '123456789',
        fullName: 'Nguyen Van A',
        dateOfBirth: '2005-01-15',
        priorityPoints: '2',
      };

      const result = importStudentSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priorityPoints).toBe(2);
      }
    });
  });

  describe('Excel Column Mapping', () => {
    it('should map standard column names', () => {
      expect(EXCEL_COLUMN_MAP['id card number']).toBe('idCard');
      expect(EXCEL_COLUMN_MAP['full name']).toBe('fullName');
      expect(EXCEL_COLUMN_MAP['date of birth']).toBe('dateOfBirth');
      expect(EXCEL_COLUMN_MAP['email']).toBe('email');
      expect(EXCEL_COLUMN_MAP['phone']).toBe('phone');
      expect(EXCEL_COLUMN_MAP['address']).toBe('address');
      expect(EXCEL_COLUMN_MAP['priority points']).toBe('priorityPoints');
    });

    it('should map alternative column names', () => {
      expect(EXCEL_COLUMN_MAP['idcard']).toBe('idCard');
      expect(EXCEL_COLUMN_MAP['fullname']).toBe('fullName');
      expect(EXCEL_COLUMN_MAP['dob']).toBe('dateOfBirth');
      expect(EXCEL_COLUMN_MAP['phone number']).toBe('phone');
    });
  });
});
