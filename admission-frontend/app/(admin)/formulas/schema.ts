import { z } from 'zod';

export const formulaSchema = z.object({
    name: z.string().min(1, 'Vui lòng nhập tên công thức'),
    formula: z.string().min(1, 'Vui lòng nhập biểu thức tính điểm'),
    description: z.string().optional(),
});

export type FormulaFormData = z.infer<typeof formulaSchema>;
