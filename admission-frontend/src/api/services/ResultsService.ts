/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ResultsService {
    /**
     * Export admission results
     * Generate and download Excel file containing all admitted students for a session with their details (student info, major, method, score)
     * @param id Admission session ID
     * @returns binary Excel file generated and downloaded successfully
     * @throws ApiError
     */
    public static resultControllerExportResults(
        id: string,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sessions/{id}/results/export',
            path: {
                'id': id,
            },
            errors: {
                403: `Forbidden - requires results:export permission`,
                404: `Session not found`,
            },
        });
    }

    /**
     * Get admission results as JSON
     * Retrieve list of all admitted students for a session with their details
     * @param id Admission session ID
     * @returns any Results retrieved successfully
     * @throws ApiError
     */
    public static resultControllerGetResults(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sessions/{id}/results',
            path: {
                'id': id,
            },
            errors: {
                403: `Forbidden - requires results:read permission`,
                404: `Session not found`,
            },
        });
    }
}
