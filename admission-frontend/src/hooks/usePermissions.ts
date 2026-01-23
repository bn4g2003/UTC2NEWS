/**
 * usePermissions Hook
 * Provides permission checking functionality for RBAC
 * Validates Requirements 3.1, 3.2
 */

import { useAuthStore } from '@/store/authStore';
import { useMemo } from 'react';

export interface UsePermissionsReturn {
  /**
   * Check if user has a specific permission
   * @param permission - Permission string in format "resource:action" (e.g., "users:create")
   * @returns true if user has the permission, false otherwise
   */
  hasPermission: (permission: string) => boolean;

  /**
   * Check if user has all of the specified permissions
   * @param permissions - Array of permission strings
   * @returns true if user has all permissions, false otherwise
   */
  hasAllPermissions: (permissions: string[]) => boolean;

  /**
   * Check if user has any of the specified permissions
   * @param permissions - Array of permission strings
   * @returns true if user has at least one permission, false otherwise
   */
  hasAnyPermission: (permissions: string[]) => boolean;

  /**
   * Get all user permissions
   */
  permissions: string[];

  /**
   * Loading state (always false for now, can be extended for async permission loading)
   */
  isLoading: boolean;

  /**
   * Whether user is authenticated
   */
  isAuthenticated: boolean;
}

/**
 * Custom hook for checking user permissions
 * 
 * @param requiredPermissions - Optional array of permissions to check on mount
 * @returns Permission checking functions and state
 * 
 * @example
 * ```tsx
 * function UserManagement() {
 *   const { hasPermission, hasAllPermissions } = usePermissions();
 *   
 *   const canCreate = hasPermission('users:create');
 *   const canManage = hasAllPermissions(['users:read', 'users:update', 'users:delete']);
 *   
 *   return (
 *     <div>
 *       {canCreate && <button>Create User</button>}
 *       {canManage && <UserTable />}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // Check permissions on component mount
 * function ProtectedPage() {
 *   const { hasAllPermissions, isLoading } = usePermissions(['users:read', 'users:update']);
 *   
 *   if (isLoading) {
 *     return <LoadingSpinner />;
 *   }
 *   
 *   if (!hasAllPermissions(['users:read', 'users:update'])) {
 *     return <AccessDenied />;
 *   }
 *   
 *   return <UserManagementPage />;
 * }
 * ```
 */
export function usePermissions(requiredPermissions?: string[]): UsePermissionsReturn {
  // Get authentication state from store
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const permissions = useAuthStore((state) => state.permissions);
  const checkPermission = useAuthStore((state) => state.checkPermission);

  // Memoize permission checking functions to avoid recreating on every render
  const hasPermission = useMemo(
    () => (permission: string): boolean => {
      if (!isAuthenticated) {
        return false;
      }
      return checkPermission(permission);
    },
    [isAuthenticated, checkPermission]
  );

  const hasAllPermissions = useMemo(
    () => (perms: string[]): boolean => {
      if (!isAuthenticated) {
        return false;
      }
      return perms.every((perm) => checkPermission(perm));
    },
    [isAuthenticated, checkPermission]
  );

  const hasAnyPermission = useMemo(
    () => (perms: string[]): boolean => {
      if (!isAuthenticated) {
        return false;
      }
      return perms.some((perm) => checkPermission(perm));
    },
    [isAuthenticated, checkPermission]
  );

  // For now, isLoading is always false
  // This can be extended in the future if permissions need to be loaded asynchronously
  const isLoading = false;

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    permissions,
    isLoading,
    isAuthenticated,
  };
}

/**
 * Hook to check a single permission
 * Convenience wrapper around usePermissions for simple permission checks
 * 
 * @param permission - Permission string to check
 * @returns Object with hasPermission boolean and isLoading state
 * 
 * @example
 * ```tsx
 * function CreateUserButton() {
 *   const { hasPermission, isLoading } = usePermission('users:create');
 *   
 *   if (isLoading) return null;
 *   if (!hasPermission) return null;
 *   
 *   return <button>Create User</button>;
 * }
 * ```
 */
export function usePermission(permission: string): {
  hasPermission: boolean;
  isLoading: boolean;
} {
  const { hasPermission: checkPermission, isLoading } = usePermissions();
  
  const hasPermission = useMemo(
    () => checkPermission(permission),
    [checkPermission, permission]
  );

  return {
    hasPermission,
    isLoading,
  };
}
