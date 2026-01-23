/**
 * Category Form Schema
 * Zod validation schema for category creation and editing
 * Validates Requirement 17.4
 */

import { z } from 'zod';

/**
 * Slug validation
 * URL-friendly slug with lowercase letters, numbers, and hyphens
 */
const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(200, 'Slug must not exceed 200 characters')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens only');

/**
 * Category form validation schema
 * Defines validation rules for category data
 */
export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters'),
  
  slug: slugSchema,
  
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .default(''),
});

/**
 * Type inference from schema
 */
export type CategoryFormData = z.infer<typeof categorySchema>;

/**
 * Create category schema
 */
export const createCategorySchema = categorySchema;

/**
 * Update category schema (all fields optional except required ones)
 */
export const updateCategorySchema = categorySchema.partial().extend({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters')
    .optional(),
  slug: slugSchema.optional(),
});

export type CreateCategoryFormData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryFormData = z.infer<typeof updateCategorySchema>;

/**
 * Helper function to generate slug from name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}
