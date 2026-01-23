import { z } from 'zod';

const idCardSchema = z
  .string()
  .min(1, 'Số CCCD là bắt buộc')
  .regex(/^\d{12}$/, 'Số CCCD phải có đúng 12 chữ số');

const phoneSchema = z
  .string()
  .default('')
  .refine((val) => val === '' || /^0\d{9}$/.test(val), {
    message: 'Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0',
  });

const emailSchema = z
  .string()
  .default('')
  .refine((val) => val === '' || z.string().email().safeParse(val).success, {
    message: 'Email không hợp lệ',
  });

const dateOfBirthSchema = z
  .string()
  .min(1, 'Ngày sinh là bắt buộc')
  .refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Định dạng ngày không hợp lệ');

const priorityPointsSchema = z
  .union([z.number(), z.string()])
  .transform((val) => {
    if (typeof val === 'string') {
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    }
    return val;
  })
  .pipe(
    z
      .number()
      .min(0, 'Điểm ưu tiên phải ít nhất là 0')
      .max(10, 'Điểm ưu tiên không vượt quá 10')
  )
  .optional()
  .default(0);

const subjectScoreSchema = z
  .union([z.number(), z.string()])
  .transform((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    if (typeof val === 'string') {
      const num = parseFloat(val);
      return isNaN(num) ? undefined : num;
    }
    return val;
  })
  .pipe(
    z
      .number()
      .min(0, 'Điểm phải ít nhất là 0')
      .max(10, 'Điểm không vượt quá 10')
      .optional()
  )
  .optional();

export const importStudentSchema = z.object({
  idCard: idCardSchema,
  fullName: z
    .string()
    .min(1, 'Họ tên là bắt buộc')
    .max(100, 'Họ tên không được quá 100 ký tự'),
  dateOfBirth: dateOfBirthSchema,
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().max(200, 'Địa chỉ không quá 200 ký tự').default(''),
  priorityPoints: priorityPointsSchema,

  // Subject scores
  math: subjectScoreSchema,
  physics: subjectScoreSchema,
  chemistry: subjectScoreSchema,
  biology: subjectScoreSchema,
  literature: subjectScoreSchema,
  history: subjectScoreSchema,
  geography: subjectScoreSchema,
  english: subjectScoreSchema,
  civic_education: subjectScoreSchema,
  technology: subjectScoreSchema,
  informatics: subjectScoreSchema,
});

export type ImportStudentData = z.infer<typeof importStudentSchema>;

export interface ImportPreviewRecord {
  row: number;
  data: Partial<ImportStudentData>;
  isValid: boolean;
  errors: string[];
}

export interface ImportResult {
  totalRecords: number;
  successCount: number;
  failureCount: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
}

export const EXCEL_HEADERS = {
  idCard: 'ID Card',
  fullName: 'Full Name',
  dateOfBirth: 'Date of Birth',
  email: 'Email',
  phone: 'Phone',
  address: 'Address',
  priorityPoints: 'Priority Points',
  math: 'Math',
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  literature: 'Literature',
  history: 'History',
  geography: 'Geography',
  english: 'English',
  civic_education: 'Civic Education',
  technology: 'Technology',
  informatics: 'Informatics',
} as const;

export const EXCEL_COLUMN_MAP: Record<string, keyof typeof EXCEL_HEADERS> = {
  'id card': 'idCard',
  'cmnd': 'idCard',
  'cccd': 'idCard',
  'full name': 'fullName',
  'họ tên': 'fullName',
  'date of birth': 'dateOfBirth',
  'ngày sinh': 'dateOfBirth',
  'email': 'email',
  'phone': 'phone',
  'sđt': 'phone',
  'số điện thoại': 'phone',
  'address': 'address',
  'địa chỉ': 'address',
  'priority points': 'priorityPoints',
  'điểm cộng': 'priorityPoints',
  'math': 'math',
  'toán': 'math',
  'physics': 'physics',
  'lý': 'physics',
  'vật lý': 'physics',
  'chemistry': 'chemistry',
  'hóa': 'chemistry',
  'biology': 'biology',
  'sinh': 'biology',
  'literature': 'literature',
  'văn': 'literature',
  'history': 'history',
  'sử': 'history',
  'geography': 'geography',
  'địa': 'geography',
  'english': 'english',
  'anh': 'english',
  'tiếng anh': 'english',
  'civic education': 'civic_education',
  'gdcd': 'civic_education',
  'technology': 'technology',
  'công nghệ': 'technology',
  'informatics': 'informatics',
  'tin học': 'informatics',
};
