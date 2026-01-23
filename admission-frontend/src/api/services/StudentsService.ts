/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddPreferenceDto } from '../models/AddPreferenceDto';
import type { CreateStudentDto } from '../models/CreateStudentDto';
import type { UpdatePreferenceDto } from '../models/UpdatePreferenceDto';
import type { UpdateStudentDto } from '../models/UpdateStudentDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StudentsService {
    /**
     * Create student
     * Create a new student record manually with validation
     * @param requestBody
     * @returns any Student created successfully
     * @throws ApiError
     */
    public static studentControllerCreateStudent(
        requestBody: CreateStudentDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/students',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Validation error or duplicate ID card`,
                403: `Forbidden - requires students:create permission`,
            },
        });
    }
    /**
     * Get all students
     * Retrieve all students with optional filtering and pagination
     * @param page
     * @param pageSize
     * @param search
     * @param sessionId
     * @returns any Students retrieved successfully
     * @throws ApiError
     */
    public static studentControllerFindAllStudents(
        page: string,
        pageSize: string,
        search: string,
        sessionId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/students',
            query: {
                'page': page,
                'pageSize': pageSize,
                'search': search,
                'sessionId': sessionId,
            },
            errors: {
                403: `Forbidden - requires students:read permission`,
            },
        });
    }
    /**
     * Update student
     * Update an existing student record
     * @param id Student ID
     * @param requestBody
     * @returns any Student updated successfully
     * @throws ApiError
     */
    public static studentControllerUpdateStudent(
        id: string,
        requestBody: UpdateStudentDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/students/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden - requires students:update permission`,
                404: `Student not found`,
            },
        });
    }
    /**
     * Get student by ID
     * Retrieve a specific student with all preferences
     * @param id Student ID
     * @returns any Student retrieved successfully
     * @throws ApiError
     */
    public static studentControllerGetStudent(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/students/{id}',
            path: {
                'id': id,
            },
            errors: {
                403: `Forbidden - requires students:read permission`,
                404: `Student not found`,
            },
        });
    }
    /**
     * Add preference
     * Add a new preference (major choice) for a student
     * @param id Student ID
     * @param requestBody
     * @returns any Preference added successfully
     * @throws ApiError
     */
    public static studentControllerAddPreference(
        id: string,
        requestBody: AddPreferenceDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/students/{id}/preferences',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid major code or admission method`,
                403: `Forbidden - requires preferences:manage permission`,
                404: `Student not found`,
            },
        });
    }
    /**
     * Update preference
     * Update an existing preference for a student
     * @param id Student ID
     * @param preferenceId Preference (Application) ID
     * @param requestBody
     * @returns any Preference updated successfully
     * @throws ApiError
     */
    public static studentControllerUpdatePreference(
        id: string,
        preferenceId: string,
        requestBody: UpdatePreferenceDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/students/{id}/preferences/{preferenceId}',
            path: {
                'id': id,
                'preferenceId': preferenceId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden - requires preferences:manage permission`,
                404: `Student or preference not found`,
            },
        });
    }
    /**
     * Remove preference
     * Delete a preference from a student
     * @param id Student ID
     * @param preferenceId Preference (Application) ID
     * @returns any Preference removed successfully
     * @throws ApiError
     */
    public static studentControllerRemovePreference(
        id: string,
        preferenceId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/students/{id}/preferences/{preferenceId}',
            path: {
                'id': id,
                'preferenceId': preferenceId,
            },
            errors: {
                403: `Forbidden - requires preferences:manage permission`,
                404: `Student or preference not found`,
            },
        });
    }
}
