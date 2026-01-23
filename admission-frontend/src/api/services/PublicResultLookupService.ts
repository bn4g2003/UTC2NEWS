/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PublicResultLookupService {
    /**
     * Lookup admission result by ID card
     * Public endpoint for students to check their admission results using ID card number. No authentication required.
     * @param idCardNumber Student ID card number (CMND/CCCD)
     * @returns any Result found successfully
     * @throws ApiError
     */
    public static resultLookupControllerLookupResult(
        idCardNumber: string,
    ): CancelablePromise<{
        student?: {
            fullName?: string;
            idCardNumber?: string;
            dateOfBirth?: string;
        };
        program?: {
            name?: string;
            code?: string;
        };
        session?: {
            name?: string;
        };
        status?: 'accepted' | 'rejected' | 'pending';
        score?: number;
        ranking?: number | null;
        admissionMethod?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/public/results/lookup/{idCardNumber}',
            path: {
                'idCardNumber': idCardNumber,
            },
            errors: {
                404: `No result found for this ID card`,
            },
        });
    }
}
