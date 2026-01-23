/**
 * Validation Helper Functions
 * Reusable validation patterns and utilities for Zod schemas
 */

/**
 * Vietnamese characters regex pattern
 * Includes all Vietnamese diacritics and special characters
 */
export const VIETNAMESE_CHARS = 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ';

/**
 * Regex pattern for Vietnamese names (letters and spaces only)
 */
export const VIETNAMESE_NAME_PATTERN = new RegExp(`^[a-zA-Z${VIETNAMESE_CHARS}\\s]+$`);

/**
 * Regex pattern for Vietnamese text with numbers, underscores, hyphens
 */
export const VIETNAMESE_TEXT_PATTERN = new RegExp(`^[a-zA-Z0-9${VIETNAMESE_CHARS}_\\s-]+$`);

/**
 * Regex pattern for slugs (lowercase, numbers, hyphens)
 */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Regex pattern for Vietnamese ID card (9 or 12 digits)
 */
export const ID_CARD_PATTERN = /^\d{9}$|^\d{12}$/;

/**
 * Regex pattern for Vietnamese phone number (10 digits starting with 0)
 */
export const PHONE_PATTERN = /^0\d{9}$/;

/**
 * Regex pattern for username (alphanumeric, underscore, hyphen)
 */
export const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

/**
 * Regex pattern for code fields (uppercase, numbers, underscore, hyphen)
 */
export const CODE_PATTERN = /^[A-Z0-9_-]+$/;

/**
 * Error messages in Vietnamese
 */
export const ERROR_MESSAGES = {
  REQUIRED: 'Trường này là bắt buộc',
  INVALID_FORMAT: 'Định dạng không hợp lệ',
  INVALID_EMAIL: 'Email không hợp lệ',
  INVALID_PHONE: 'Số điện thoại phải có 10 chữ số và bắt đầu bằng 0',
  INVALID_ID_CARD: 'Số CMND/CCCD phải có 9 hoặc 12 chữ số',
  INVALID_NAME: 'Tên chỉ được chứa chữ cái và khoảng trắng',
  INVALID_USERNAME: 'Username chỉ được chứa chữ cái, số, gạch dưới và gạch ngang',
  INVALID_CODE: 'Mã chỉ được chứa chữ in hoa, số, gạch dưới và gạch ngang',
  INVALID_SLUG: 'Slug chỉ được chứa chữ thường, số và gạch ngang',
  MIN_LENGTH: (min: number) => `Phải có ít nhất ${min} ký tự`,
  MAX_LENGTH: (max: number) => `Không được vượt quá ${max} ký tự`,
  MIN_VALUE: (min: number) => `Giá trị tối thiểu là ${min}`,
  MAX_VALUE: (max: number) => `Giá trị tối đa là ${max}`,
} as const;
