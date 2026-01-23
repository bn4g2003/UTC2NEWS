/**
 * User Form Schema
 * Zod validation schema for user creation and editing
 * Validates Requirement 7.8
 */

import { z } from 'zod';

/**
 * User form validation schema
 * Defines validation rules for user data
 */
export const userSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  
  password: z
    .string()
    .optional(),
  
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must not exceed 100 characters')
    .regex(
      /^[a-zA-ZàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ\s]+$/,
      'Full name can only contain letters and spaces'
    ),
  
  isActive: z
    .boolean()
    .default(true),
});

/**
 * Type inference from schema
 */
export type UserFormData = z.infer<typeof userSchema>;

/**
 * Create user schema (password required)
 */
export const createUserSchema = userSchema.extend({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

/**
 * Update user schema (password optional)
 */
export const updateUserSchema = userSchema.extend({
  password: z
    .string()
    .optional()
    .refine((val) => {
      // If password is provided, validate it
      if (!val || val === '') return true;
      if (val.length < 8 || val.length > 100) return false;
      return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(val);
    }, {
      message: 'Password must be 8-100 characters and contain at least one uppercase letter, one lowercase letter, and one number',
    }),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
