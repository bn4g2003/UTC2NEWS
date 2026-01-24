/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChangePasswordDto } from '../models/ChangePasswordDto';
import type { CreateUserDto } from '../models/CreateUserDto';
import type { UpdatePasswordDto } from '../models/UpdatePasswordDto';
import type { UpdateStatusDto } from '../models/UpdateStatusDto';
import type { UpdateUserDto } from '../models/UpdateUserDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsersService {
    /**
     * Create user
     * Create a new user account with username, password, email, and full name
     * @param requestBody
     * @returns any User created successfully
     * @throws ApiError
     */
    public static usersControllerCreateUser(
        requestBody: CreateUserDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Validation error`,
                403: `Forbidden - requires users:create permission`,
                409: `Username or email already exists`,
            },
        });
    }
    /**
     * Get all users
     * Retrieve paginated list of all users
     * @param page Page number
     * @param limit Items per page
     * @returns any Users retrieved successfully
     * @throws ApiError
     */
    public static usersControllerFindAll(
        page?: number,
        limit?: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users',
            query: {
                'page': page,
                'limit': limit,
            },
            errors: {
                403: `Forbidden - requires users:read permission`,
            },
        });
    }
    /**
     * Search users
     * Search users by name, username or email (public for authenticated users)
     * @param q Search query
     * @param limit Limit results
     * @returns any Users found successfully
     * @throws ApiError
     */
    public static usersControllerSearch(
        q: string,
        limit?: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/search',
            query: {
                'q': q,
                'limit': limit,
            },
        });
    }
    /**
     * Get current user profile
     * Retrieve profile information of the authenticated user
     * @returns any Profile retrieved successfully
     * @throws ApiError
     */
    public static usersControllerGetProfile(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/me',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Update current user profile
     * Update profile information of the authenticated user
     * @param requestBody
     * @returns any Profile updated successfully
     * @throws ApiError
     */
    public static usersControllerUpdateProfile(
        requestBody: UpdateUserDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/users/me',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
                409: `Email already exists`,
            },
        });
    }
    /**
     * Get user by ID
     * Retrieve detailed information of a specific user including roles and permissions
     * @param id User ID
     * @returns any User retrieved successfully
     * @throws ApiError
     */
    public static usersControllerFindOne(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/{id}',
            path: {
                'id': id,
            },
            errors: {
                403: `Forbidden - requires users:read permission`,
                404: `User not found`,
            },
        });
    }
    /**
     * Update user
     * Update user information (admin only)
     * @param id User ID
     * @param requestBody
     * @returns any User updated successfully
     * @throws ApiError
     */
    public static usersControllerUpdateUser(
        id: string,
        requestBody: UpdateUserDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/users/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden - requires users:update permission`,
                404: `User not found`,
                409: `Email already exists`,
            },
        });
    }
    /**
     * Delete user
     * Delete a user account (admin only)
     * @param id User ID
     * @returns any User deleted successfully
     * @throws ApiError
     */
    public static usersControllerDeleteUser(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/users/{id}',
            path: {
                'id': id,
            },
            errors: {
                403: `Forbidden - requires users:delete permission`,
                404: `User not found`,
            },
        });
    }
    /**
     * Update user status
     * Activate or deactivate a user account
     * @param id User ID
     * @param requestBody
     * @returns any User status updated successfully
     * @throws ApiError
     */
    public static usersControllerUpdateStatus(
        id: string,
        requestBody: UpdateStatusDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/users/{id}/status',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden - requires users:update_status permission`,
                404: `User not found`,
            },
        });
    }
    /**
     * Change own password
     * Change password for the authenticated user (requires current password)
     * @param requestBody
     * @returns any Password changed successfully
     * @throws ApiError
     */
    public static usersControllerChangePassword(
        requestBody: ChangePasswordDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/users/me/password',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Current password is incorrect`,
            },
        });
    }
    /**
     * Update user password
     * Reset password for any user (admin only, does not require current password)
     * @param id User ID
     * @param requestBody
     * @returns any Password updated successfully
     * @throws ApiError
     */
    public static usersControllerUpdatePassword(
        id: string,
        requestBody: UpdatePasswordDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/users/{id}/password',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden - requires users:update_password permission`,
                404: `User not found`,
            },
        });
    }
}
