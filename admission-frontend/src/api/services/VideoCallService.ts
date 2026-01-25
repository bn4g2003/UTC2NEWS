/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class VideoCallService {
    /**
     * @returns any
     * @throws ApiError
     */
    public static videoCallControllerCreateRoom(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/video/rooms',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static videoCallControllerGetToken(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/video/token',
        });
    }
    /**
     * @param id
     * @returns any
     * @throws ApiError
     */
    public static videoCallControllerGetSession(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/video/sessions/{id}',
            path: {
                'id': id,
            },
        });
    }
}
