/**
 * Session Form Schema
 * Zod validation schema for session creation and editing
 * Validates Requirements 11.4, 11.7
 */

import { z } from 'zod';

/**
 * Session status enum
 */
export const sessionStatusEnum = z.enum(['upcoming', 'active', 'closed']);

/**
 * Session form validation schema
 * Defines validation rules for session data including date validation
 */
export const sessionSchema = z.object({
  name: z
    .string()
    .min(3, 'Session name must be at least 3 characters')
    .max(200, 'Session name must not exceed 200 characters'),
  
  year: z
    .number()
    .int('Year must be an integer')
    .min(2000, 'Year must be 2000 or later')
    .max(2100, 'Year must be 2100 or earlier'),
  
  startDate: z
    .string()
    .min(1, 'Start date is required')
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Invalid start date format'),
  
  endDate: z
    .string()
    .min(1, 'End date is required')
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Invalid end date format'),
  
  status: sessionStatusEnum.default('upcoming'),
}).refine((data) => {
  // Validate that end date is after start date (Requirement 11.7)
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

/**
 * Type inference from schema
 */
export type SessionFormData = z.infer<typeof sessionSchema>;

/**
 * Create session schema
 */
export const createSessionSchema = sessionSchema;

/**
 * Update session schema (all fields optional)
 * Note: We need to define this separately because .partial() cannot be used on schemas with refinements
 */
export const updateSessionSchema = z.object({
  name: z
    .string()
    .min(3, 'Session name must be at least 3 characters')
    .max(200, 'Session name must not exceed 200 characters')
    .optional(),
  
  year: z
    .number()
    .int('Year must be an integer')
    .min(2000, 'Year must be 2000 or later')
    .max(2100, 'Year must be 2100 or earlier')
    .optional(),
  
  startDate: z
    .string()
    .min(1, 'Start date is required')
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Invalid start date format')
    .optional(),
  
  endDate: z
    .string()
    .min(1, 'End date is required')
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Invalid end date format')
    .optional(),
  
  status: sessionStatusEnum.optional(),
}).refine((data) => {
  // Only validate date relationship if both dates are provided
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end > start;
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export type CreateSessionFormData = z.infer<typeof createSessionSchema>;
export type UpdateSessionFormData = z.infer<typeof updateSessionSchema>;
