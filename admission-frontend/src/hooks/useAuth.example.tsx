/**
 * Example usage of useAuth hook
 * Demonstrates how to use the hook in React components
 */

'use client';

import React from 'react';
import { useAuth } from './useAuth';
import type { LoginDto } from '@/api/models/LoginDto';

/**
 * Example 1: Simple login component
 */
export function LoginExample() {
  const { login, isLoading, error, clearError } = useAuth();
  const [credentials, setCredentials] = React.useState<LoginDto>({
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(credentials);
      // Redirect to dashboard on success
      window.location.href = '/admin/dashboard';
    } catch (err) {
      // Error is already set in the store
      console.error('Login failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={credentials.username}
          onChange={(e) =>
            setCredentials({ ...credentials, username: e.target.value })
          }
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={credentials.password}
          onChange={(e) =>
            setCredentials({ ...credentials, password: e.target.value })
          }
          disabled={isLoading}
        />
      </div>

      {error && (
        <div style={{ color: 'red' }}>
          {error}
        </div>
      )}

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

/**
 * Example 2: User profile display
 */
export function UserProfileExample() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated || !user) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h2>User Profile</h2>
      <p>Username: {user.username}</p>
      <p>Full Name: {user.fullName}</p>
      <p>Email: {user.email}</p>
      <p>Role: {user.role?.name || 'N/A'}</p>
      <p>Status: {user.status}</p>

      <button onClick={logout}>Logout</button>
    </div>
  );
}

/**
 * Example 3: Permission-based rendering
 */
export function PermissionExample() {
  const { checkPermission, permissions } = useAuth();

  return (
    <div>
      <h2>Available Actions</h2>

      {checkPermission('users:create') && (
        <button>Create User</button>
      )}

      {checkPermission('users:update') && (
        <button>Edit User</button>
      )}

      {checkPermission('users:delete') && (
        <button>Delete User</button>
      )}

      {checkPermission('users:read') && (
        <button>View Users</button>
      )}

      <div>
        <h3>All Permissions:</h3>
        <ul>
          {permissions.map((permission) => (
            <li key={permission}>{permission}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Example 4: Protected component wrapper
 */
export function ProtectedComponentExample() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Access denied. Please log in.</div>;
  }

  return (
    <div>
      <h2>Protected Content</h2>
      <p>This content is only visible to authenticated users.</p>
    </div>
  );
}

/**
 * Example 5: Conditional navigation
 */
export function NavigationExample() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav>
      <ul>
        <li>
          <a href="/">Home</a>
        </li>

        {isAuthenticated ? (
          <>
            <li>
              <a href="/admin/dashboard">Dashboard</a>
            </li>
            <li>
              <span>Welcome, {user?.fullName}</span>
            </li>
            <li>
              <button onClick={logout}>Logout</button>
            </li>
          </>
        ) : (
          <li>
            <a href="/login">Login</a>
          </li>
        )}
      </ul>
    </nav>
  );
}

/**
 * Example 6: Error handling
 */
export function ErrorHandlingExample() {
  const { login, error, clearError, isLoading } = useAuth();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleLogin = async () => {
    try {
      await login({ username, password });
      alert('Login successful!');
    } catch (err) {
      // Error is already displayed via the error state
      // You can add additional error handling here
    }
  };

  return (
    <div>
      <h2>Login with Error Handling</h2>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin} disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>

      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          <strong>Error:</strong> {error}
          <button onClick={clearError} style={{ marginLeft: '10px' }}>
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Example 7: Multiple permission checks
 */
export function MultiPermissionExample() {
  const { checkPermission } = useAuth();

  const canManageUsers =
    checkPermission('users:create') &&
    checkPermission('users:update') &&
    checkPermission('users:delete');

  const canViewUsers = checkPermission('users:read');

  return (
    <div>
      <h2>User Management</h2>

      {canViewUsers ? (
        <div>
          <h3>Users List</h3>
          {/* Display users list */}

          {canManageUsers && (
            <div>
              <button>Add User</button>
              <button>Edit User</button>
              <button>Delete User</button>
            </div>
          )}
        </div>
      ) : (
        <div>You don't have permission to view users.</div>
      )}
    </div>
  );
}
