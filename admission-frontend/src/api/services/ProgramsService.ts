/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateMajorDto } from '../models/CreateMajorDto';
import type { CreateQuotaDto } from '../models/CreateQuotaDto';
import type { CreateSessionDto } from '../models/CreateSessionDto';
import type { UpdateMajorDto } from '../models/UpdateMajorDto';
import type { UpdateQuotaDto } from '../models/UpdateQuotaDto';
import type { UpdateSessionDto } from '../models/UpdateSessionDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProgramsService {
    /**
     * Create major
     * Create a new academic major with unique code
     * @param requestBody
     * @returns any Major created successfully
     * @throws ApiError
     */
    public static programControllerCreateMajor(
        requestBody: CreateMajorDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/program/majors',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden - requires majors:create permission`,
                409: `Major code already exists`,
            },
        });
    }
    /**
     * Get all majors
     * Retrieve all majors, optionally filter by active status (public)
     * @param active Filter by active status (true/false)
     * @returns any Majors retrieved successfully
     * @throws ApiError
     */
    public static programControllerFindAllMajors(
        active?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/program/majors',
            query: {
                'active': active,
            },
        });
    }
    /**
     * Get major by ID
     * Retrieve a specific major (public)
     * @param id Major ID
     * @returns any Major retrieved successfully
     * @throws ApiError
     */
    public static programControllerFindMajorById(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/program/majors/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Major not found`,
            },
        });
    }
    /**
     * Update major
     * Update an existing major
     * @param id Major ID
     * @param requestBody
     * @returns any Major updated successfully
     * @throws ApiError
     */
    public static programControllerUpdateMajor(
        id: string,
        requestBody: UpdateMajorDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/program/majors/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden - requires majors:update permission`,
                404: `Major not found`,
            },
        });
    }
    /**
     * Delete major
     * Delete a major (prevented if applications exist)
     * @param id Major ID
     * @returns any Major deleted successfully
     * @throws ApiError
     */
    public static programControllerDeleteMajor(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/program/majors/{id}',
            path: {
                'id': id,
            },
            errors: {
                403: `Forbidden - requires majors:delete permission`,
                404: `Major not found`,
                409: `Cannot delete major with existing applications`,
            },
        });
    }
    /**
     * Create admission session
     * Create a new admission session
     * @param requestBody
     * @returns any Session created successfully
     * @throws ApiError
     */
    public static programControllerCreateSession(
        requestBody: CreateSessionDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/program/sessions',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden - requires admission_sessions:create permission`,
            },
        });
    }
    /**
     * Get all sessions
     * Retrieve all admission sessions
     * @returns any Sessions retrieved successfully
     * @throws ApiError
     */
    public static programControllerFindAllSessions(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/program/sessions',
        });
    }
    /**
     * Get session by ID
     * Retrieve a specific admission session
     * @param id Session ID
     * @returns any Session retrieved successfully
     * @throws ApiError
     */
    public static programControllerFindSessionById(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/program/sessions/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Session not found`,
            },
        });
    }
    /**
     * Update session
     * Update an existing admission session
     * @param id Session ID
     * @param requestBody
     * @returns any Session updated successfully
     * @throws ApiError
     */
    public static programControllerUpdateSession(
        id: string,
        requestBody: UpdateSessionDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/program/sessions/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden - requires admission_sessions:update permission`,
                404: `Session not found`,
            },
        });
    }
    /**
     * Delete session
     * Delete an admission session
     * @param id Session ID
     * @returns any Session deleted successfully
     * @throws ApiError
     */
    public static programControllerDeleteSession(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/program/sessions/{id}',
            path: {
                'id': id,
            },
            errors: {
                403: `Forbidden - requires admission_sessions:delete permission`,
                404: `Session not found`,
            },
        });
    }
    /**
     * Create quota
     * Configure admission quota for a major in a session
     * @param requestBody
     * @returns any Quota created successfully
     * @throws ApiError
     */
    public static programControllerCreateQuota(
        requestBody: CreateQuotaDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/program/quotas',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden - requires quotas:create permission`,
            },
        });
    }
    /**
     * Get all quotas
     * Retrieve all quotas, optionally filter by session
     * @param sessionId Filter by session ID
     * @returns any Quotas retrieved successfully
     * @throws ApiError
     */
    public static programControllerFindAllQuotas(
        sessionId?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/program/quotas',
            query: {
                'sessionId': sessionId,
            },
        });
    }
    /**
     * Get quota by ID
     * Retrieve a specific quota configuration
     * @param id Quota ID
     * @returns any Quota retrieved successfully
     * @throws ApiError
     */
    public static programControllerFindQuotaById(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/program/quotas/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Quota not found`,
            },
        });
    }
    /**
     * Update quota
     * Update an existing quota configuration
     * @param id Quota ID
     * @param requestBody
     * @returns any Quota updated successfully
     * @throws ApiError
     */
    public static programControllerUpdateQuota(
        id: string,
        requestBody: UpdateQuotaDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/program/quotas/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden - requires quotas:update permission`,
                404: `Quota not found`,
            },
        });
    }
    /**
     * Delete quota
     * Delete a quota configuration
     * @param id Quota ID
     * @returns any Quota deleted successfully
     * @throws ApiError
     */
    public static programControllerDeleteQuota(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/program/quotas/{id}',
            path: {
                'id': id,
            },
            errors: {
                403: `Forbidden - requires quotas:delete permission`,
                404: `Quota not found`,
            },
        });
    }
}
