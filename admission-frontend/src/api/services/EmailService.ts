/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EmailService {
    /**
     * Send admission result emails
     * Queue email notifications for all admitted students in a session. Emails are processed asynchronously in the background with automatic retry on failure.
     * @param id Admission session ID
     * @returns any Emails queued successfully for background processing
     * @throws ApiError
     */
    public static emailControllerSendAdmissionResults(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/email/sessions/{id}/send-results',
            path: {
                'id': id,
            },
            errors: {
                403: `Forbidden - requires emails:send permission`,
                404: `Session not found`,
            },
        });
    }
    /**
     * Get email delivery status
     * Check the delivery status of admission result email for a specific student
     * @param studentId Student ID
     * @returns any Email status retrieved successfully
     * @throws ApiError
     */
    public static emailControllerGetEmailStatus(
        studentId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/email/students/{studentId}/status',
            path: {
                'studentId': studentId,
            },
            errors: {
                403: `Forbidden - requires emails:read permission`,
                404: `No email notification found for student`,
            },
        });
    }
    /**
     * Get recipient count for email
     * Get the count of students who will receive emails based on filters
     * @param id Admission session ID
     * @returns any Recipient count retrieved successfully
     * @throws ApiError
     */
    public static emailControllerGetRecipientCount(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/email/sessions/{id}/recipient-count',
            path: {
                'id': id,
            },
            errors: {
                403: `Forbidden - requires emails:read permission`,
                404: `Session not found`,
            },
        });
    }
}
