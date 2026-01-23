/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LoginDto } from '../models/LoginDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthenticationService {
    /**
     * User login
     * Authenticate user with username and password, returns JWT access token with 24-hour expiration
     * @param requestBody
     * @returns any Login successful, returns access token
     * @throws ApiError
     */
    public static authControllerLogin(
        requestBody: LoginDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Invalid credentials`,
            },
        });
    }
}
