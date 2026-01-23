/**
 * Zod validation schemas
 * Centralized validation schemas for forms
 */

import { z } from 'zod';

// User validation schemas
export const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const userSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8).optional(),
  fullName: z.string().min(1, 'Full name is required'),
  roleId: z.string().uuid('Invalid role ID'),
  status: z.enum(['active', 'inactive']),
});

// Student validation schemas
export const studentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  fullName: z.string().min(1, 'Full name is required'),
  dateOfBirth: z.date(),
  idCardNumber: z.string().min(9).max(12),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  programId: z.string().uuid('Invalid program ID'),
  sessionId: z.string().uuid('Invalid session ID'),
  scores: z.object({
    math: z.number().min(0).max(10),
    literature: z.number().min(0).max(10),
    english: z.number().min(0).max(10),
  }),
});

// Program validation schemas
export const programSchema = z.object({
  name: z.string().min(1, 'Program name is required'),
  code: z.string().min(1, 'Program code is required'),
  description: z.string().optional(),
  quota: z.number().min(1, 'Quota must be at least 1'),
  status: z.enum(['active', 'inactive']),
});

// Session validation schemas
export const sessionSchema = z.object({
  name: z.string().min(1, 'Session name is required'),
  startDate: z.date(),
  endDate: z.date(),
  status: z.enum(['upcoming', 'active', 'closed']),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// Role validation schemas
export const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
});

// CMS validation schemas
export const postSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  featuredImage: z.string().optional(),
  categoryId: z.string().uuid('Invalid category ID'),
  status: z.enum(['draft', 'published']),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
});

export const faqSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
  order: z.number().min(0),
  category: z.string().optional(),
});

// Result lookup validation
export const resultLookupSchema = z.object({
  idCardNumber: z.string()
    .min(9, 'ID card number must be at least 9 characters')
    .max(12, 'ID card number must be at most 12 characters')
    .regex(/^[0-9]+$/, 'ID card number must contain only numbers'),
});

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type StudentFormData = z.infer<typeof studentSchema>;
export type ProgramFormData = z.infer<typeof programSchema>;
export type SessionFormData = z.infer<typeof sessionSchema>;
export type RoleFormData = z.infer<typeof roleSchema>;
export type PostFormData = z.infer<typeof postSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type FaqFormData = z.infer<typeof faqSchema>;
export type ResultLookupFormData = z.infer<typeof resultLookupSchema>;
