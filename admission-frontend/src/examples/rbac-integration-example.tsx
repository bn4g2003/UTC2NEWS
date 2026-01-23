/**
 * RBAC Integration Example
 * Demonstrates how to use all three RBAC components together
 * This is a complete example of a Users management page with RBAC
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  usePermissions, 
  ProtectedComponent, 
  checkApiPermission,
  PermissionError,
  PERMISSIONS 
} from '@/lib/rbac';
import { UsersService } from '@/api/services/UsersService';
import type { CreateUserDto } from '@/api/models/CreateUserDto';

/**
 * Example: Users Management Page with Complete RBAC Integration
 * 
 * This example demonstrates:
 * 1. Using usePermissions hook for conditional rendering
 * 2. Using ProtectedComponent for UI elements
 * 3. Using checkApiPermission before API calls
 * 4. Proper error handling with PermissionError
 */
export default function UsersManagementExample() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 1. Use usePermissions hook for permission checking
  const { 
    hasPermission, 
    hasAllPermissions, 
    permissions,
    isAuthenticated 
  } = usePermissions();
  
  // Check if user can manage users (needs both read and update)
  const canManageUsers = hasAllPermissions([
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE
  ]);
  
  // Load users on component mount
  useEffect(() => {
    if (isAuthenticated && hasPermission(PERMISSIONS.USERS_READ)) {
      loadUsers();
    }
  }, [isAuthenticated]);
  
  /**
   * Load users from API
   * Demonstrates: API permission checking with checkApiPermission
   */
  const loadUsers = async () => {
    try {
      // 3. Check permission before making API call
      checkApiPermission(PERMISSIONS.USERS_READ);
      
      setLoading(true);
      setError(null);
      
      const data = await UsersService.usersControllerFindAll();
      setUsers(data);
    } catch (err) {
      // 4. Handle PermissionError specifically
      if (err instanceof PermissionError) {
        setError('You do not have permission to view users');
      } else {
        setError('Failed to load users');
      }
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Create a new user
   * Demonstrates: API permission checking before create operation
   */
  const handleCreateUser = async (userData: CreateUserDto) => {
    try {
      // Check permission before API call
      checkApiPermission(PERMISSIONS.USERS_CREATE);
      
      setLoading(true);
      await UsersService.usersControllerCreateUser(userData);
      
      // Reload users after creation
      await loadUsers();
      
      alert('User created successfully');
    } catch (err) {
      if (err instanceof PermissionError) {
        alert('You do not have permission to create users');
      } else {
        alert('Failed to create user');
      }
      console.error('Error creating user:', err);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Update an existing user
   * Demonstrates: API permission checking before update operation
   */
  const handleUpdateUser = async (userId: string, userData: any) => {
    try {
      checkApiPermission(PERMISSIONS.USERS_UPDATE);
      
      setLoading(true);
      await UsersService.usersControllerUpdateUser(userId, userData);
      
      // Reload users after update
      await loadUsers();
      
      alert('User updated successfully');
    } catch (err) {
      if (err instanceof PermissionError) {
        alert('You do not have permission to update users');
      } else {
        alert('Failed to update user');
      }
      console.error('Error updating user:', err);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Delete a user
   * Demonstrates: API permission checking before delete operation
   */
  const handleDeleteUser = async (userId: string) => {
    try {
      checkApiPermission(PERMISSIONS.USERS_DELETE);
      
      if (!confirm('Are you sure you want to delete this user?')) {
        return;
      }
      
      setLoading(true);
      await UsersService.usersControllerDeleteUser(userId);
      
      // Reload users after deletion
      await loadUsers();
      
      alert('User deleted successfully');
    } catch (err) {
      if (err instanceof PermissionError) {
        alert('You do not have permission to delete users');
      } else {
        alert('Failed to delete user');
      }
      console.error('Error deleting user:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Show error if user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Users Management</h1>
        <p className="text-red-500">You must be logged in to view this page</p>
      </div>
    );
  }
  
  // Show error if user cannot view users
  if (!hasPermission(PERMISSIONS.USERS_READ)) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Users Management</h1>
        <p className="text-red-500">You do not have permission to view users</p>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Users Management</h1>
        
        {/* 2. Use ProtectedComponent to conditionally render create button */}
        <ProtectedComponent 
          permission={PERMISSIONS.USERS_CREATE}
          fallback={<p className="text-sm text-gray-500">No permission to create users</p>}
        >
          <button
            onClick={() => handleCreateUser({
              username: 'newuser',
              email: 'newuser@example.com',
              password: 'password123',
              fullName: 'New User',
            })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loading}
          >
            Create User
          </button>
        </ProtectedComponent>
      </div>
      
      {/* Show current user permissions for debugging */}
      <div className="mb-4 p-2 bg-gray-100 rounded">
        <p className="text-sm font-semibold">Your Permissions:</p>
        <ul className="text-xs">
          {permissions.map((perm) => (
            <li key={perm}>{perm}</li>
          ))}
        </ul>
      </div>
      
      {/* Show error message if any */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {/* Show loading state */}
      {loading && (
        <div className="mb-4 p-4 bg-blue-100 text-blue-700 rounded">
          Loading...
        </div>
      )}
      
      {/* Users table - only show if user can manage users */}
      {canManageUsers ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">ID</th>
                <th className="px-4 py-2 border">Username</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Full Name</th>
                <th className="px-4 py-2 border">Status</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{user.id}</td>
                  <td className="px-4 py-2 border">{user.username}</td>
                  <td className="px-4 py-2 border">{user.email}</td>
                  <td className="px-4 py-2 border">{user.fullName}</td>
                  <td className="px-4 py-2 border">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 border">
                    <div className="flex gap-2">
                      {/* Edit button - only show if user has update permission */}
                      <ProtectedComponent permission={PERMISSIONS.USERS_UPDATE}>
                        <button
                          onClick={() => handleUpdateUser(user.id, { fullName: 'Updated Name' })}
                          className="px-2 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                          disabled={loading}
                        >
                          Edit
                        </button>
                      </ProtectedComponent>
                      
                      {/* Delete button - only show if user has delete permission */}
                      <ProtectedComponent permission={PERMISSIONS.USERS_DELETE}>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </ProtectedComponent>
                      
                      {/* Show message if user has no permissions for actions */}
                      {!hasPermission(PERMISSIONS.USERS_UPDATE) && 
                       !hasPermission(PERMISSIONS.USERS_DELETE) && (
                        <span className="text-xs text-gray-500">No actions available</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {users.length === 0 && !loading && (
            <p className="text-center py-4 text-gray-500">No users found</p>
          )}
        </div>
      ) : (
        <div className="p-4 bg-yellow-100 text-yellow-700 rounded">
          You need both read and update permissions to manage users
        </div>
      )}
      
      {/* Permission summary */}
      <div className="mt-4 p-4 bg-gray-50 rounded">
        <h2 className="font-semibold mb-2">Permission Summary:</h2>
        <ul className="text-sm space-y-1">
          <li>
            ✓ Can view users: {hasPermission(PERMISSIONS.USERS_READ) ? 'Yes' : 'No'}
          </li>
          <li>
            ✓ Can create users: {hasPermission(PERMISSIONS.USERS_CREATE) ? 'Yes' : 'No'}
          </li>
          <li>
            ✓ Can update users: {hasPermission(PERMISSIONS.USERS_UPDATE) ? 'Yes' : 'No'}
          </li>
          <li>
            ✓ Can delete users: {hasPermission(PERMISSIONS.USERS_DELETE) ? 'Yes' : 'No'}
          </li>
          <li>
            ✓ Can manage users: {canManageUsers ? 'Yes' : 'No'}
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Key Takeaways from this Example:
 * 
 * 1. usePermissions Hook:
 *    - Use for conditional rendering logic
 *    - Check permissions before showing UI elements
 *    - Get user's permission list and authentication status
 * 
 * 2. ProtectedComponent:
 *    - Wrap UI elements that require permissions
 *    - Automatically hide/show based on user permissions
 *    - Provide fallback UI for better UX
 * 
 * 3. checkApiPermission:
 *    - Always check permissions before API calls
 *    - Throw PermissionError if user lacks permission
 *    - Catch and handle PermissionError appropriately
 * 
 * 4. Error Handling:
 *    - Use try-catch blocks for API calls
 *    - Check for PermissionError specifically
 *    - Show user-friendly error messages
 * 
 * 5. Best Practices:
 *    - Check permissions at both UI and API levels
 *    - Use PERMISSIONS constants to avoid typos
 *    - Provide clear feedback when permissions are missing
 *    - Disable buttons during loading states
 *    - Show permission summary for debugging
 */
