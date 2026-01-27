import { z } from 'zod';

export const quotaSchema = z.object({
  sessionId: z.string().min(1, 'Vui lòng chọn đợt tuyển sinh'),
  majorId: z.string().min(1, 'Vui lòng chọn ngành'),
  formulaId: z.string().optional(),
  quota: z.number().min(1, 'Chỉ tiêu phải lớn hơn 0'),
});

export const quotaConditionsSchema = z.object({
  minTotalScore: z.number().min(0).max(30).optional(),
  minSubjectScores: z.record(z.string(), z.number().min(0).max(10)).optional(),
  requiredSubjects: z.array(z.string()).optional(),
  subjectCombinations: z.array(z.array(z.string())).optional(),
  priorityBonus: z
    .object({
      enabled: z.boolean(),
      maxBonus: z.number().min(0).max(5),
    })
    .optional(),
});

export type QuotaFormData = z.infer<typeof quotaSchema>;
export type QuotaConditionsData = z.infer<typeof quotaConditionsSchema>;
