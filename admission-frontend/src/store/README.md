# Store Documentation

This directory contains Zustand stores for state management.

## Auth Store

The auth store manages authentication state, user data, and permissions.

### Usage

```typescript
import { useAuthStore } from '@/store';

function LoginComponent() {
  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async () => {
    try {
      await login({ username: 'admin', password: 'password123' });
      // Login successful, redirect to dashboard
    } catch (error) {
      // Error is already set in store
      console.error('Login failed:', error);
    }
  };

  return (
    <div>
      <button onClick={handleLogin} disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

### State

- `user: User | null` - Current authenticated user
- `token: string | null` - JWT access token
- `isAuthenticated: boolean` - Whether user is authenticated
- `permissions: string[]` - User's permissions (format: "resource:action")
- `isLoading: boolean` - Loading state for async operations
- `error: string | null` - Error message from last operation

### Actions

#### `login(credentials: LoginDto): Promise<void>`

Authenticates user with username and password. Stores JWT token and user data.

**Validates Requirements 2.1**: Generate and store JWT access token with 24-hour expiration

```typescript
await login({ username: 'admin', password: 'password123' });
```

#### `logout(): void`

Clears authentication state and removes stored tokens.

**Validates Requirements 2.4**: Clear all stored authentication tokens

```typescript
logout();
```

#### `refreshToken(): Promise<void>`

Refreshes the JWT token (placeholder - implement when backend endpoint is available).

```typescript
await refreshToken();
```

#### `checkPermission(permission: string): boolean`

Checks if the current user has a specific permission.

**Validates Requirements 2.4**: Permission checking for RBAC

```typescript
const canCreateUsers = checkPermission('users:create');
const canDeleteStudents = checkPermission('students:delete');
```

#### `setUser(user: User | null): void`

Updates user data (useful for profile updates).

```typescript
setUser(updatedUser);
```

#### `clearError(): void`

Clears the error state.

```typescript
clearError();
```

### Initialization

The auth store automatically persists state to localStorage. To initialize the store on app load:

```typescript
import { initializeAuthStore } from '@/store';

// In your app initialization (e.g., _app.tsx or layout.tsx)
initializeAuthStore();
```

This restores the token to the API client if it exists in storage.

### Permission Format

Permissions are stored in the format `resource:action`, where:
- `resource` is the entity (e.g., "users", "students", "programs")
- `action` is the operation (e.g., "create", "read", "update", "delete")

Examples:
- `users:create` - Can create users
- `students:read` - Can view students
- `programs:update` - Can update programs
- `cms:posts:delete` - Can delete CMS posts

### Example: Protected Component

```typescript
import { useAuthStore } from '@/store';

function DeleteButton({ studentId }: { studentId: string }) {
  const { checkPermission } = useAuthStore();
  
  if (!checkPermission('students:delete')) {
    return null; // Hide button if no permission
  }
  
  return (
    <button onClick={() => deleteStudent(studentId)}>
      Delete
    </button>
  );
}
```

### Example: Protected Route

```typescript
import { useAuthStore } from '@/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function ProtectedPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);
  
  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }
  
  return <div>Protected content</div>;
}
```

## Notes

- The store uses Zustand's `persist` middleware to save state to localStorage
- Only essential fields are persisted (user, token, isAuthenticated, permissions)
- The token is automatically restored to the API client on app load
- Error handling is built into the store - errors are caught and stored in the `error` state
