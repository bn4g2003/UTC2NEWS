/**
 * FAQ Form Schema
 * Zod validation schema for FAQ creation and editing
 * Validates Requirement 18.4
 */

import { z } from 'zod';

/**
 * FAQ form validation schema
 * Defines validation rules for FAQ data
 */
export const faqSchema = z.object({
  question: z
    .string()
    .min(1, 'Question is required')
    .max(500, 'Question must not exceed 500 characters'),
  
  answer: z
    .string()
    .min(1, 'Answer is required')
    .max(5000, 'Answer must not exceed 5000 characters'),
  
  displayOrder: z
    .number()
    .int('Display order must be an integer')
    .min(0, 'Display order must be 0 or greater')
    .default(0),
  
  isActive: z
    .boolean()
    .default(true),
});

/**
 * Type inference from schema
 */
export type FaqFormData = z.infer<typeof faqSchema>;

/**
 * Create FAQ schema
 */
export const createFaqSchema = faqSchema;

/**
 * Update FAQ schema (all fields optional)
 */
export const updateFaqSchema = faqSchema.partial();

export type CreateFaqFormData = z.infer<typeof createFaqSchema>;
export type UpdateFaqFormData = z.infer<typeof updateFaqSchema>;
