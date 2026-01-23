/**
 * ProtectedComponent Wrapper
 * Conditionally renders components based on user permissions
 * Validates Requirement 3.3
 */

'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

export interface ProtectedComponentProps {
  /**
   * Child components to render if user has required permissions
   */
  children: ReactNode;

  /**
   * Single permission required to view the component
   * Format: "resource:action" (e.g., "users:create")
   */
  permission?: string;

  /**
   * Multiple permissions - user must have ALL of them
   */
  permissions?: string[];

  /**
   * Multiple permissions - user must have ANY of them
   */
  anyPermissions?: string[];

  /**
   * Fallback component to render when user lacks permissions
   * If not provided, nothing is rendered
   */
  fallback?: ReactNode;

  /**
   * Whether to show loading state while checking permissions
   * Default: false
   */
  showLoading?: boolean;

  /**
   * Custom loading component
   */
  loadingComponent?: ReactNode;
}

/**
 * ProtectedComponent wrapper that conditionally renders children based on permissions
 * 
 * @example
 * ```tsx
 * // Single permission check
 * <ProtectedComponent permission="users:create">
 *   <button>Create User</button>
 * </ProtectedComponent>
 * ```
 * 
 * @example
 * ```tsx
 * // Multiple permissions (user must have ALL)
 * <ProtectedComponent permissions={['users:read', 'users:update']}>
 *   <UserTable />
 * </ProtectedComponent>
 * ```
 * 
 * @example
 * ```tsx
 * // Multiple permissions (user must have ANY)
 * <ProtectedComponent anyPermissions={['users:create', 'users:update']}>
 *   <UserForm />
 * </ProtectedComponent>
 * ```
 * 
 * @example
 * ```tsx
 * // With fallback component
 * <ProtectedComponent 
 *   permission="users:delete"
 *   fallback={<p>You don't have permission to delete users</p>}
 * >
 *   <button>Delete User</button>
 * </ProtectedComponent>
 * ```
 */
export function ProtectedComponent({
  children,
  permission,
  permissions,
  anyPermissions,
  fallback = null,
  showLoading = false,
  loadingComponent = <div>Loading...</div>,
}: ProtectedComponentProps): ReactNode {
  const {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    isLoading,
    isAuthenticated,
  } = usePermissions();

  // Show loading state if requested
  if (showLoading && isLoading) {
    return loadingComponent;
  }

  // If not authenticated, don't render
  if (!isAuthenticated) {
    return fallback;
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return fallback;
  }

  // Check all permissions (user must have ALL)
  if (permissions && permissions.length > 0 && !hasAllPermissions(permissions)) {
    return fallback;
  }

  // Check any permissions (user must have ANY)
  if (anyPermissions && anyPermissions.length > 0 && !hasAnyPermission(anyPermissions)) {
    return fallback;
  }

  // User has required permissions, render children
  return <>{children}</>;
}

/**
 * Higher-Order Component (HOC) version of ProtectedComponent
 * Wraps a component and only renders it if user has required permissions
 * 
 * @param Component - Component to wrap
 * @param permissionConfig - Permission configuration
 * @returns Wrapped component
 * 
 * @example
 * ```tsx
 * const ProtectedUserTable = withPermission(UserTable, {
 *   permissions: ['users:read'],
 *   fallback: <AccessDenied />,
 * });
 * 
 * function UsersPage() {
 *   return <ProtectedUserTable />;
 * }
 * ```
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permissionConfig: Omit<ProtectedComponentProps, 'children'>
) {
  return function ProtectedComponentWrapper(props: P) {
    return (
      <ProtectedComponent {...permissionConfig}>
        <Component {...props} />
      </ProtectedComponent>
    );
  };
}

/**
 * Hook-based alternative for conditional rendering based on permissions
 * Useful when you need more control over the rendering logic
 * 
 * @param permissionConfig - Permission configuration
 * @returns Object with canRender boolean
 * 
 * @example
 * ```tsx
 * function UserManagement() {
 *   const { canRender } = useProtectedRender({ permission: 'users:create' });
 *   
 *   return (
 *     <div>
 *       <h1>User Management</h1>
 *       {canRender && <button>Create User</button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useProtectedRender(
  permissionConfig: Pick<ProtectedComponentProps, 'permission' | 'permissions' | 'anyPermissions'>
): { canRender: boolean; isLoading: boolean } {
  const {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    isLoading,
    isAuthenticated,
  } = usePermissions();

  if (!isAuthenticated) {
    return { canRender: false, isLoading };
  }

  // Check single permission
  if (permissionConfig.permission && !hasPermission(permissionConfig.permission)) {
    return { canRender: false, isLoading };
  }

  // Check all permissions
  if (
    permissionConfig.permissions &&
    permissionConfig.permissions.length > 0 &&
    !hasAllPermissions(permissionConfig.permissions)
  ) {
    return { canRender: false, isLoading };
  }

  // Check any permissions
  if (
    permissionConfig.anyPermissions &&
    permissionConfig.anyPermissions.length > 0 &&
    !hasAnyPermission(permissionConfig.anyPermissions)
  ) {
    return { canRender: false, isLoading };
  }

  return { canRender: true, isLoading };
}
