import { ValidationError } from './validation-result.dto';

export interface ImportResult {
  totalRecords: number;
  successCount: number;
  failureCount: number;
  errors: ValidationError[];
}
