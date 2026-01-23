/**
 * Program (Major) Form Schema
 * Zod validation schema for program creation and editing
 * Validates Requirement 10.4
 */

import { z } from 'zod';

/**
 * Program form validation schema
 * Defines validation rules for program data
 */
export const programSchema = z.object({
  code: z
    .string()
    .min(2, 'Program code must be at least 2 characters')
    .max(20, 'Program code must not exceed 20 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Program code must be uppercase letters, numbers, underscores, or hyphens'),
  
  name: z
    .string()
    .min(3, 'Program name must be at least 3 characters')
    .max(200, 'Program name must not exceed 200 characters'),
  
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .default(''),
  
  subjectCombinations: z
    .record(z.string(), z.any())
    .default({}),
  
  isActive: z
    .boolean()
    .default(true),
});

/**
 * Type inference from schema
 */
export type ProgramFormData = z.infer<typeof programSchema>;

/**
 * Create program schema
 */
export const createProgramSchema = programSchema;

/**
 * Update program schema (all fields optional except code which can't be changed)
 */
export const updateProgramSchema = programSchema.extend({
  code: z
    .string()
    .min(2, 'Program code must be at least 2 characters')
    .max(20, 'Program code must not exceed 20 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Program code must be uppercase letters, numbers, underscores, or hyphens'),
});

export type CreateProgramFormData = z.infer<typeof createProgramSchema>;
export type UpdateProgramFormData = z.infer<typeof updateProgramSchema>;
