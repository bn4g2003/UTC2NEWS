/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ImportService {
    /**
     * Import students from Excel
     * Upload an Excel file containing student personal data and scores. All records are validated before import.
     * @param formData
     * @returns any
     * @throws ApiError
     */
    public static importControllerImportStudents(
        formData: {
            file: Blob;
            sessionId: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/import/students',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Import candidate preferences from Excel
     * Upload an Excel file containing candidate preferences (student ID, major, priority).
     * @param formData
     * @returns any
     * @throws ApiError
     */
    public static importControllerImportPreferences(
        formData: {
            file: Blob;
            sessionId: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/import/preferences',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
}
