/**
 * API Permission Checker
 * Validates user permissions before making API requests
 * Validates Requirement 3.4
 */

import { useAuthStore } from '@/store/authStore';

/**
 * Error thrown when user lacks required permissions for an API call
 */
export class PermissionError extends Error {
  constructor(
    message: string,
    public requiredPermission: string | string[]
  ) {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * Check if user has permission before making an API call
 * Throws PermissionError if user lacks the required permission
 * 
 * @param permission - Required permission string (e.g., "users:create")
 * @throws {PermissionError} If user lacks the required permission
 * 
 * @example
 * ```typescript
 * async function createUser(userData: CreateUserDto) {
 *   // Check permission before API call
 *   checkApiPermission('users:create');
 *   
 *   // Make API call
 *   return await UsersService.createUser(userData);
 * }
 * ```
 */
export function checkApiPermission(permission: string): void {
  const { isAuthenticated, checkPermission } = useAuthStore.getState();

  if (!isAuthenticated) {
    throw new PermissionError(
      'User is not authenticated',
      permission
    );
  }

  if (!checkPermission(permission)) {
    throw new PermissionError(
      `User lacks required permission: ${permission}`,
      permission
    );
  }
}

/**
 * Check if user has all of the specified permissions before making an API call
 * Throws PermissionError if user lacks any of the required permissions
 * 
 * @param permissions - Array of required permission strings
 * @throws {PermissionError} If user lacks any of the required permissions
 * 
 * @example
 * ```typescript
 * async function updateUserRole(userId: string, roleId: string) {
 *   // Check multiple permissions before API call
 *   checkApiPermissions(['users:update', 'roles:read']);
 *   
 *   // Make API call
 *   return await UsersService.updateUser(userId, { roleId });
 * }
 * ```
 */
export function checkApiPermissions(permissions: string[]): void {
  const { isAuthenticated, permissions: userPermissions } = useAuthStore.getState();

  if (!isAuthenticated) {
    throw new PermissionError(
      'User is not authenticated',
      permissions
    );
  }

  const missingPermissions = permissions.filter(
    (perm) => !userPermissions.includes(perm)
  );

  if (missingPermissions.length > 0) {
    throw new PermissionError(
      `User lacks required permissions: ${missingPermissions.join(', ')}`,
      permissions
    );
  }
}

/**
 * Check if user has any of the specified permissions before making an API call
 * Throws PermissionError if user lacks all of the specified permissions
 * 
 * @param permissions - Array of permission strings (user needs at least one)
 * @throws {PermissionError} If user lacks all of the specified permissions
 * 
 * @example
 * ```typescript
 * async function viewUserDetails(userId: string) {
 *   // User needs either read or update permission
 *   checkApiAnyPermission(['users:read', 'users:update']);
 *   
 *   // Make API call
 *   return await UsersService.getUser(userId);
 * }
 * ```
 */
export function checkApiAnyPermission(permissions: string[]): void {
  const { isAuthenticated, permissions: userPermissions } = useAuthStore.getState();

  if (!isAuthenticated) {
    throw new PermissionError(
      'User is not authenticated',
      permissions
    );
  }

  const hasAnyPermission = permissions.some((perm) =>
    userPermissions.includes(perm)
  );

  if (!hasAnyPermission) {
    throw new PermissionError(
      `User lacks any of the required permissions: ${permissions.join(', ')}`,
      permissions
    );
  }
}

/**
 * Wrapper function that checks permissions before executing an API call
 * Returns a function that performs the permission check and then executes the API call
 * 
 * @param permission - Required permission string
 * @param apiCall - API call function to execute
 * @returns Wrapped function that checks permission before executing
 * 
 * @example
 * ```typescript
 * const createUserWithPermission = withApiPermission(
 *   'users:create',
 *   (userData: CreateUserDto) => UsersService.createUser(userData)
 * );
 * 
 * // Usage
 * try {
 *   const user = await createUserWithPermission(userData);
 * } catch (error) {
 *   if (error instanceof PermissionError) {
 *     console.error('Permission denied:', error.message);
 *   }
 * }
 * ```
 */
export function withApiPermission<TArgs extends any[], TReturn>(
  permission: string,
  apiCall: (...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    checkApiPermission(permission);
    return apiCall(...args);
  };
}

/**
 * Wrapper function that checks multiple permissions before executing an API call
 * 
 * @param permissions - Array of required permission strings
 * @param apiCall - API call function to execute
 * @returns Wrapped function that checks permissions before executing
 * 
 * @example
 * ```typescript
 * const updateUserRoleWithPermissions = withApiPermissions(
 *   ['users:update', 'roles:read'],
 *   (userId: string, roleId: string) => UsersService.updateUser(userId, { roleId })
 * );
 * ```
 */
export function withApiPermissions<TArgs extends any[], TReturn>(
  permissions: string[],
  apiCall: (...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    checkApiPermissions(permissions);
    return apiCall(...args);
  };
}

/**
 * Hook for checking permissions before API calls in React components
 * Returns functions that check permissions and throw errors if user lacks them
 * 
 * @returns Object with permission checking functions
 * 
 * @example
 * ```tsx
 * function UserManagement() {
 *   const { checkPermission, checkPermissions } = useApiPermissionChecker();
 *   
 *   const handleCreateUser = async (userData: CreateUserDto) => {
 *     try {
 *       checkPermission('users:create');
 *       const user = await UsersService.createUser(userData);
 *       toast.success('User created successfully');
 *     } catch (error) {
 *       if (error instanceof PermissionError) {
 *         toast.error('You do not have permission to create users');
 *       }
 *     }
 *   };
 *   
 *   return <button onClick={() => handleCreateUser(data)}>Create User</button>;
 * }
 * ```
 */
export function useApiPermissionChecker() {
  return {
    checkPermission: checkApiPermission,
    checkPermissions: checkApiPermissions,
    checkAnyPermission: checkApiAnyPermission,
  };
}

/**
 * Utility to check if user has permission without throwing an error
 * Useful for conditional logic without try-catch blocks
 * 
 * @param permission - Permission string to check
 * @returns true if user has permission, false otherwise
 * 
 * @example
 * ```typescript
 * if (hasApiPermission('users:create')) {
 *   // Show create button
 * }
 * ```
 */
export function hasApiPermission(permission: string): boolean {
  const { isAuthenticated, checkPermission } = useAuthStore.getState();
  return isAuthenticated && checkPermission(permission);
}

/**
 * Utility to check if user has all specified permissions without throwing an error
 * 
 * @param permissions - Array of permission strings
 * @returns true if user has all permissions, false otherwise
 */
export function hasApiPermissions(permissions: string[]): boolean {
  const { isAuthenticated, permissions: userPermissions } = useAuthStore.getState();
  
  if (!isAuthenticated) {
    return false;
  }

  return permissions.every((perm) => userPermissions.includes(perm));
}

/**
 * Utility to check if user has any of the specified permissions without throwing an error
 * 
 * @param permissions - Array of permission strings
 * @returns true if user has any permission, false otherwise
 */
export function hasApiAnyPermission(permissions: string[]): boolean {
  const { isAuthenticated, permissions: userPermissions } = useAuthStore.getState();
  
  if (!isAuthenticated) {
    return false;
  }

  return permissions.some((perm) => userPermissions.includes(perm));
}
