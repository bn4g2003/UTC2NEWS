/**
 * Student Form Schema
 * Zod validation schema for student creation and editing
 * Validates Requirement 9.8
 */

import { z } from 'zod';

/**
 * ID Card validation
 * Vietnamese ID card numbers are 9 or 12 digits
 */
const idCardSchema = z
  .string()
  .min(1, 'ID card number is required')
  .regex(/^\d{9}$|^\d{12}$/, 'ID card number must be 9 or 12 digits');

/**
 * Phone number validation
 * Vietnamese phone numbers typically start with 0 and have 10 digits
 */
const phoneSchema = z
  .string()
  .default('')
  .refine((val) => val === '' || /^0\d{9}$/.test(val), {
    message: 'Phone number must be 10 digits starting with 0',
  });

/**
 * Email validation
 */
const emailSchema = z
  .string()
  .default('')
  .refine((val) => val === '' || z.string().email().safeParse(val).success, {
    message: 'Invalid email address',
  });

/**
 * Date of birth validation
 * Must be a valid date string in ISO format
 */
const dateOfBirthSchema = z
  .string()
  .min(1, 'Date of birth is required')
  .refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Invalid date format')
  .refine((date) => {
    const parsed = new Date(date);
    const now = new Date();
    const age = now.getFullYear() - parsed.getFullYear();
    return age >= 15 && age <= 100;
  }, 'Student must be between 15 and 100 years old');

/**
 * Priority points validation
 * Priority points range from 0 to 3
 */
const priorityPointsSchema = z
  .number()
  .min(0, 'Priority points must be at least 0')
  .max(3, 'Priority points must not exceed 3')
  .optional()
  .default(0);

/**
 * Student form validation schema
 * Defines validation rules for student data
 */
export const studentSchema = z.object({
  idCard: idCardSchema,
  fullName: z
    .string()
    .trim()
    .min(1, 'Full name is required')
    .max(100, 'Full name must not exceed 100 characters')
    .regex(
      /^[a-zA-ZàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ\s]+$/,
      'Full name can only contain letters and spaces'
    ),
  dateOfBirth: dateOfBirthSchema,
  email: emailSchema,
  phone: phoneSchema,
  address: z
    .string()
    .trim()
    .max(200, 'Address must not exceed 200 characters')
    .optional()
    .default(''),
  priorityPoints: priorityPointsSchema,
});

/**
 * Type inference from schema
 */
export type StudentFormData = z.infer<typeof studentSchema>;

/**
 * Create student schema (all fields required except optional ones)
 */
export const createStudentSchema = studentSchema;

/**
 * Update student schema (all fields optional except ID card)
 */
export const updateStudentSchema = studentSchema.partial().extend({
  idCard: idCardSchema,
});

export type CreateStudentFormData = z.infer<typeof createStudentSchema>;
export type UpdateStudentFormData = z.infer<typeof updateStudentSchema>;
