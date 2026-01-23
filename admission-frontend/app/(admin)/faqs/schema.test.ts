/**
 * FAQ Schema Tests
 * Unit tests for FAQ form validation schema
 */

import { describe, it, expect } from 'vitest';
import { 
  faqSchema, 
  createFaqSchema, 
  updateFaqSchema,
  type FaqFormData 
} from './schema';

describe('FAQ Schema Validation', () => {
  describe('faqSchema', () => {
    it('should validate a valid FAQ', () => {
      const validFaq: FaqFormData = {
        question: 'What is the admission deadline?',
        answer: 'The admission deadline is December 31st.',
        displayOrder: 1,
        isActive: true,
      };

      const result = faqSchema.safeParse(validFaq);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const minimalFaq = {
        question: 'Test question?',
        answer: 'Test answer.',
      };

      const result = faqSchema.safeParse(minimalFaq);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.displayOrder).toBe(0);
        expect(result.data.isActive).toBe(true);
      }
    });

    it('should reject empty question', () => {
      const invalidFaq = {
        question: '',
        answer: 'Test answer.',
        displayOrder: 0,
        isActive: true,
      };

      const result = faqSchema.safeParse(invalidFaq);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Question is required');
      }
    });

    it('should reject empty answer', () => {
      const invalidFaq = {
        question: 'Test question?',
        answer: '',
        displayOrder: 0,
        isActive: true,
      };

      const result = faqSchema.safeParse(invalidFaq);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Answer is required');
      }
    });

    it('should reject question exceeding max length', () => {
      const invalidFaq = {
        question: 'a'.repeat(501),
        answer: 'Test answer.',
        displayOrder: 0,
        isActive: true,
      };

      const result = faqSchema.safeParse(invalidFaq);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must not exceed 500 characters');
      }
    });

    it('should reject answer exceeding max length', () => {
      const invalidFaq = {
        question: 'Test question?',
        answer: 'a'.repeat(5001),
        displayOrder: 0,
        isActive: true,
      };

      const result = faqSchema.safeParse(invalidFaq);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must not exceed 5000 characters');
      }
    });

    it('should reject negative display order', () => {
      const invalidFaq = {
        question: 'Test question?',
        answer: 'Test answer.',
        displayOrder: -1,
        isActive: true,
      };

      const result = faqSchema.safeParse(invalidFaq);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be 0 or greater');
      }
    });

    it('should reject non-integer display order', () => {
      const invalidFaq = {
        question: 'Test question?',
        answer: 'Test answer.',
        displayOrder: 1.5,
        isActive: true,
      };

      const result = faqSchema.safeParse(invalidFaq);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be an integer');
      }
    });

    it('should accept valid display order range', () => {
      const testCases = [0, 1, 10, 100, 999];
      
      testCases.forEach(order => {
        const faq = {
          question: 'Test question?',
          answer: 'Test answer.',
          displayOrder: order,
          isActive: true,
        };

        const result = faqSchema.safeParse(faq);
        expect(result.success).toBe(true);
      });
    });

    it('should accept both active and inactive status', () => {
      const activeFaq = {
        question: 'Test question?',
        answer: 'Test answer.',
        displayOrder: 0,
        isActive: true,
      };

      const inactiveFaq = {
        question: 'Test question?',
        answer: 'Test answer.',
        displayOrder: 0,
        isActive: false,
      };

      expect(faqSchema.safeParse(activeFaq).success).toBe(true);
      expect(faqSchema.safeParse(inactiveFaq).success).toBe(true);
    });
  });

  describe('createFaqSchema', () => {
    it('should be identical to faqSchema', () => {
      const faq = {
        question: 'Test question?',
        answer: 'Test answer.',
        displayOrder: 1,
        isActive: true,
      };

      const faqResult = faqSchema.safeParse(faq);
      const createResult = createFaqSchema.safeParse(faq);

      expect(faqResult.success).toBe(createResult.success);
    });
  });

  describe('updateFaqSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        question: 'Updated question?',
      };

      const result = updateFaqSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow updating only answer', () => {
      const partialUpdate = {
        answer: 'Updated answer.',
      };

      const result = updateFaqSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow updating only display order', () => {
      const partialUpdate = {
        displayOrder: 5,
      };

      const result = updateFaqSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow updating only active status', () => {
      const partialUpdate = {
        isActive: false,
      };

      const result = updateFaqSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow empty update object', () => {
      const emptyUpdate = {};

      const result = updateFaqSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(true);
    });

    it('should still validate field constraints when provided', () => {
      const invalidUpdate = {
        question: '', // Empty question should fail
      };

      const result = updateFaqSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it('should allow updating multiple fields', () => {
      const multiUpdate = {
        question: 'New question?',
        answer: 'New answer.',
        displayOrder: 10,
        isActive: false,
      };

      const result = updateFaqSchema.safeParse(multiUpdate);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle question at exact max length', () => {
      const faq = {
        question: 'a'.repeat(500),
        answer: 'Test answer.',
        displayOrder: 0,
        isActive: true,
      };

      const result = faqSchema.safeParse(faq);
      expect(result.success).toBe(true);
    });

    it('should handle answer at exact max length', () => {
      const faq = {
        question: 'Test question?',
        answer: 'a'.repeat(5000),
        displayOrder: 0,
        isActive: true,
      };

      const result = faqSchema.safeParse(faq);
      expect(result.success).toBe(true);
    });

    it('should handle very large display order', () => {
      const faq = {
        question: 'Test question?',
        answer: 'Test answer.',
        displayOrder: 999999,
        isActive: true,
      };

      const result = faqSchema.safeParse(faq);
      expect(result.success).toBe(true);
    });

    it('should handle special characters in question', () => {
      const faq = {
        question: 'What is the deadline? (2024-2025)',
        answer: 'Test answer.',
        displayOrder: 0,
        isActive: true,
      };

      const result = faqSchema.safeParse(faq);
      expect(result.success).toBe(true);
    });

    it('should handle special characters in answer', () => {
      const faq = {
        question: 'Test question?',
        answer: 'The deadline is 12/31/2024 @ 11:59 PM (GMT+7).',
        displayOrder: 0,
        isActive: true,
      };

      const result = faqSchema.safeParse(faq);
      expect(result.success).toBe(true);
    });

    it('should handle Unicode characters', () => {
      const faq = {
        question: 'Hạn nộp hồ sơ là khi nào?',
        answer: 'Hạn nộp hồ sơ là ngày 31 tháng 12.',
        displayOrder: 0,
        isActive: true,
      };

      const result = faqSchema.safeParse(faq);
      expect(result.success).toBe(true);
    });
  });
});
