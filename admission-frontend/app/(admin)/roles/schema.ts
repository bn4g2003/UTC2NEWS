/**
 * Role Form Schema
 * Zod validation schema for role creation and editing
 * Validates Requirement 8.2
 */

import { z } from 'zod';

/**
 * Role form validation schema
 * Defines validation rules for role data
 */
export const roleSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên vai trò không được để trống')
    .trim()
    .min(3, 'Tên vai trò phải có ít nhất 3 ký tự')
    .max(50, 'Tên vai trò không được vượt quá 50 ký tự')
    .regex(
      /^[a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ_\s-]+$/,
      'Tên vai trò chỉ được chứa chữ cái, số, gạch dưới, gạch ngang và khoảng trắng'
    ),
  
  description: z
    .string()
    .trim()
    .max(200, 'Mô tả không được vượt quá 200 ký tự')
    .or(z.literal(''))
    .optional()
    .transform(val => val || ''),
});

/**
 * Type inference from schema
 */
export type RoleFormData = z.infer<typeof roleSchema>;

/**
 * Create role schema
 */
export const createRoleSchema = roleSchema;

/**
 * Update role schema (same as create for roles)
 */
export const updateRoleSchema = roleSchema;

export type CreateRoleFormData = z.infer<typeof createRoleSchema>;
export type UpdateRoleFormData = z.infer<typeof updateRoleSchema>;
