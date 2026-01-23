/**
 * Result Lookup Service
 * Handles fetching admission results by ID card number using generated API client
 */

import { PublicResultLookupService } from '@/api/services/PublicResultLookupService';
import { ApiError } from '@/api/core/ApiError';

export interface AdmissionResult {
  student: {
    fullName: string;
    idCardNumber: string;
    dateOfBirth: string;
  };
  program: {
    name: string;
    code: string;
  };
  session: {
    name: string;
  };
  status: 'accepted' | 'rejected' | 'pending';
  score: number;
  ranking?: number;
  admissionMethod?: string;
}

/**
 * Fetch admission result by ID card number from backend API
 * Uses the generated API client from OpenAPI specification
 */
export async function lookupResult(idCardNumber: string): Promise<AdmissionResult | null> {
  try {
    const result = await PublicResultLookupService.resultLookupControllerLookupResult(
      idCardNumber
    );
    
    // Transform the result to match our interface
    return {
      student: {
        fullName: result.student?.fullName || '',
        idCardNumber: result.student?.idCardNumber || '',
        dateOfBirth: result.student?.dateOfBirth || '',
      },
      program: {
        name: result.program?.name || '',
        code: result.program?.code || '',
      },
      session: {
        name: result.session?.name || '',
      },
      status: result.status || 'pending',
      score: result.score || 0,
      ranking: result.ranking || undefined,
      admissionMethod: result.admissionMethod,
    };
  } catch (error) {
    // Handle 404 - not found
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    
    // Re-throw other errors
    console.error('Error fetching result:', error);
    throw error;
  }
}
