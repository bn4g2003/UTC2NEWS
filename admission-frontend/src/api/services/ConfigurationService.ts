/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UpdateSettingDto } from '../models/UpdateSettingDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ConfigurationService {
    /**
     * Get setting by key
     * Retrieve a specific configuration setting value
     * @param key Setting key
     * @returns any Setting retrieved successfully
     * @throws ApiError
     */
    public static configControllerGetSetting(
        key: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/{key}',
            path: {
                'key': key,
            },
            errors: {
                403: `Forbidden - requires config:read permission`,
            },
        });
    }
    /**
     * Update setting
     * Update a configuration setting value. Values are validated against expected types and ranges.
     * @param key Setting key
     * @param requestBody
     * @returns any Setting updated successfully
     * @throws ApiError
     */
    public static configControllerUpdateSetting(
        key: string,
        requestBody: UpdateSettingDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/settings/{key}',
            path: {
                'key': key,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid setting value`,
                403: `Forbidden - requires config:update permission`,
            },
        });
    }
    /**
     * Get all settings
     * Retrieve all configuration settings
     * @returns any Settings retrieved successfully
     * @throws ApiError
     */
    public static configControllerGetAllSettings(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings',
            errors: {
                403: `Forbidden - requires config:read permission`,
            },
        });
    }
}
