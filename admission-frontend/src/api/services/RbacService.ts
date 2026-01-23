/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssignPermissionsDto } from '../models/AssignPermissionsDto';
import type { AssignRolesDto } from '../models/AssignRolesDto';
import type { CreatePermissionDto } from '../models/CreatePermissionDto';
import type { CreateRoleDto } from '../models/CreateRoleDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RbacService {
    /**
     * Create permission
     * Create a new permission representing an atomic action in the system
     * @param requestBody
     * @returns any Permission created successfully
     * @throws ApiError
     */
    public static rbacControllerCreatePermission(
        requestBody: CreatePermissionDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/rbac/permissions',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
                403: `Forbidden - requires permissions:assign permission`,
            },
        });
    }
    /**
     * Get all permissions
     * Retrieve all permissions in the system
     * @returns any Permissions retrieved successfully
     * @throws ApiError
     */
    public static rbacControllerGetAllPermissions(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/rbac/permissions',
            errors: {
                401: `Unauthorized`,
                403: `Forbidden - requires permissions:read permission`,
            },
        });
    }
    /**
     * Create role
     * Create a new role that can be assigned permissions
     * @param requestBody
     * @returns any Role created successfully
     * @throws ApiError
     */
    public static rbacControllerCreateRole(
        requestBody: CreateRoleDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/rbac/roles',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
                403: `Forbidden - requires roles:create permission`,
            },
        });
    }
    /**
     * Get all roles
     * Retrieve all roles with their permissions
     * @returns any Roles retrieved successfully
     * @throws ApiError
     */
    public static rbacControllerGetAllRoles(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/rbac/roles',
            errors: {
                401: `Unauthorized`,
                403: `Forbidden - requires roles:read permission`,
            },
        });
    }
    /**
     * Get role by ID
     * Retrieve a specific role with its permissions
     * @param id Role ID
     * @returns any Role retrieved successfully
     * @throws ApiError
     */
    public static rbacControllerGetRoleById(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/rbac/roles/{id}',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden - requires roles:read permission`,
                404: `Role not found`,
            },
        });
    }
    /**
     * Assign permissions to role
     * Assign multiple permissions to a specific role
     * @param id Role ID
     * @param requestBody
     * @returns any Permissions assigned successfully
     * @throws ApiError
     */
    public static rbacControllerAssignPermissionsToRole(
        id: string,
        requestBody: AssignPermissionsDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/rbac/roles/{id}/permissions',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
                403: `Forbidden - requires permissions:assign permission`,
                404: `Role not found`,
            },
        });
    }
    /**
     * Assign roles to user
     * Assign multiple roles to a specific user
     * @param id User ID
     * @param requestBody
     * @returns any Roles assigned successfully
     * @throws ApiError
     */
    public static rbacControllerAssignRolesToUser(
        id: string,
        requestBody: AssignRolesDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/rbac/users/{id}/roles',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
                403: `Forbidden - requires roles:assign permission`,
                404: `User not found`,
            },
        });
    }
    /**
     * Get user permissions
     * Retrieve all permissions for a specific user based on their assigned roles
     * @param id User ID
     * @returns any User permissions retrieved successfully
     * @throws ApiError
     */
    public static rbacControllerGetUserPermissions(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/rbac/users/{id}/permissions',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden - requires permissions:read permission`,
                404: `User not found`,
            },
        });
    }
}
