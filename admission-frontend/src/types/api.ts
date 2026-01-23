/**
 * API-related TypeScript types
 */

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ImportResult {
  successCount: number;
  failureCount: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
}

export interface FilterResult {
  processedCount: number;
  acceptedCount: number;
  rejectedCount: number;
  message: string;
}

export interface FilterProgress {
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress: number;
  message: string;
  result?: FilterResult;
}
