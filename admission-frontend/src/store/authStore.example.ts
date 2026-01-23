/**
 * Example usage of the Auth Store
 * This file demonstrates how to use the auth store in various scenarios
 */

import { useAuthStore } from './authStore';

// Example 1: Login Component
export function ExampleLoginComponent() {
  const { login, logout, isLoading, error, isAuthenticated, user } = useAuthStore();

  const handleLogin = async () => {
    try {
      await login({
        username: 'admin',
        password: 'password123',
      });
      console.log('Login successful!');
      // Redirect to dashboard or home page
    } catch (error) {
      console.error('Login failed:', error);
      // Error is already stored in the store's error state
    }
  };

  const handleLogout = () => {
    logout();
    console.log('Logged out successfully');
    // Redirect to login page
  };

  return {
    handleLogin,
    handleLogout,
    isLoading,
    error,
    isAuthenticated,
    user,
  };
}

// Example 2: Permission Check
export function ExamplePermissionCheck() {
  const { checkPermission } = useAuthStore();

  const canCreateUsers = checkPermission('users:create');
  const canDeleteStudents = checkPermission('students:delete');
  const canUpdateMajors = checkPermission('majors:update');

  console.log('Can create users:', canCreateUsers);
  console.log('Can delete students:', canDeleteStudents);
  console.log('Can update majors:', canUpdateMajors);

  return {
    canCreateUsers,
    canDeleteStudents,
    canUpdateMajors,
  };
}

// Example 3: Get Current User
export function ExampleGetCurrentUser() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    console.log('No user is logged in');
    return null;
  }

  console.log('Current user:', {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role?.name || 'N/A',
    status: user.status,
  });

  return user;
}

// Example 4: Get User Permissions
export function ExampleGetUserPermissions() {
  const { permissions, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    console.log('No user is logged in');
    return [];
  }

  console.log('User permissions:', permissions);
  return permissions;
}

// Example 5: Conditional Rendering Based on Permission
export function ExampleConditionalRendering() {
  const { checkPermission } = useAuthStore();

  // Example: Show delete button only if user has permission
  const renderDeleteButton = (itemId: string) => {
    if (!checkPermission('students:delete')) {
      return null; // Don't render button
    }

    return {
      type: 'button',
      text: 'Delete',
      onClick: () => console.log(`Deleting item ${itemId}`),
    };
  };

  // Example: Show admin menu only if user has admin permissions
  const renderAdminMenu = () => {
    const hasAdminPermissions = 
      checkPermission('users:create') ||
      checkPermission('roles:create') ||
      checkPermission('permissions:create');

    if (!hasAdminPermissions) {
      return null;
    }

    return {
      type: 'menu',
      items: [
        { label: 'Users', path: '/admin/users' },
        { label: 'Roles', path: '/admin/roles' },
        { label: 'Permissions', path: '/admin/permissions' },
      ],
    };
  };

  return {
    renderDeleteButton,
    renderAdminMenu,
  };
}

// Example 6: Protected Route Guard
export function ExampleProtectedRouteGuard() {
  const { isAuthenticated, checkPermission } = useAuthStore();

  const canAccessRoute = (requiredPermission?: string) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      console.log('User is not authenticated');
      return false;
    }

    // If no specific permission is required, just being authenticated is enough
    if (!requiredPermission) {
      return true;
    }

    // Check if user has the required permission
    const hasPermission = checkPermission(requiredPermission);
    if (!hasPermission) {
      console.log(`User does not have permission: ${requiredPermission}`);
      return false;
    }

    return true;
  };

  return {
    canAccessRoute,
  };
}

// Example 7: Error Handling
export function ExampleErrorHandling() {
  const { login, error, clearError } = useAuthStore();

  const handleLoginWithErrorHandling = async (username: string, password: string) => {
    // Clear any previous errors
    clearError();

    try {
      await login({ username, password });
      console.log('Login successful!');
      return { success: true };
    } catch (error) {
      // Error is already stored in the store
      console.error('Login failed:', error);
      return { success: false, error };
    }
  };

  return {
    handleLoginWithErrorHandling,
    error,
    clearError,
  };
}

// Example 8: Using Store Outside React Components
export function ExampleNonReactUsage() {
  // You can access the store outside React components using getState()
  const state = useAuthStore.getState();

  console.log('Current auth state:', {
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    permissions: state.permissions,
  });

  // You can also call actions directly
  const logout = () => {
    useAuthStore.getState().logout();
  };

  const checkPermission = (permission: string) => {
    return useAuthStore.getState().checkPermission(permission);
  };

  return {
    state,
    logout,
    checkPermission,
  };
}
