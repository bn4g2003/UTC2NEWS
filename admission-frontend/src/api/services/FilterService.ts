/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FilterService {
    /**
     * Run virtual filter algorithm
     * Execute the virtual filtering algorithm for an admission session. Processes applications by preference priority and score ranking, enforces quotas, and generates final admission decisions. The operation is idempotent and atomic.
     * @param id Admission session ID
     * @returns any Filter executed successfully
     * @throws ApiError
     */
    public static filterControllerRunFilter(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/sessions/{id}/run-filter',
            path: {
                'id': id,
            },
            errors: {
                403: `Forbidden - requires filter:execute permission`,
                404: `Session not found`,
            },
        });
    }
    /**
     * Get detailed filter results
     * Retrieve detailed admission decisions for all applications in a session, including rejection reasons for each preference.
     * @param id Admission session ID
     * @param studentId Filter by specific student ID
     * @returns any Filter results retrieved successfully
     * @throws ApiError
     */
    public static filterControllerGetFilterResults(
        id: string,
        studentId?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sessions/{id}/filter-results',
            path: {
                'id': id,
            },
            query: {
                'studentId': studentId,
            },
            errors: {
                403: `Forbidden - requires filter:execute permission`,
                404: `Session not found`,
            },
        });
    }
}
