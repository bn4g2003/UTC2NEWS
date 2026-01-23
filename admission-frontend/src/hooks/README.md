# Custom Hooks

This directory contains custom React hooks used throughout the application.

## useAuth Hook

The `useAuth` hook provides easy access to authentication state and actions from the auth store.

### Features

- ✅ Access to current user information
- ✅ Authentication status checking
- ✅ Login and logout functionality
- ✅ Permission checking for RBAC
- ✅ Loading and error state management
- ✅ Automatic reactivity to auth store changes

### Usage

```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error,
    login, 
    logout, 
    checkPermission,
    clearError 
  } = useAuth();

  // Use the hook values and actions
}
```

### API Reference

#### State

- **`user: User | null`** - Current authenticated user object, or null if not authenticated
- **`isAuthenticated: boolean`** - Whether the user is currently authenticated
- **`isLoading: boolean`** - Whether an authentication operation is in progress
- **`error: string | null`** - Current error message, or null if no error
- **`permissions: string[]`** - Array of user permissions in format "resource:action"

#### Actions

- **`login(credentials: LoginDto): Promise<void>`** - Authenticate user with username and password
  - Throws error if authentication fails
  - Updates store with user data and token on success
  
- **`logout(): void`** - Clear authentication state and log out the user
  - Clears token from API client
  - Resets all auth state to initial values
  
- **`checkPermission(permission: string): boolean`** - Check if user has a specific permission
  - Returns `false` if not authenticated
  - Returns `true` if user has the permission
  - Permission format: "resource:action" (e.g., "users:create")
  
- **`clearError(): void`** - Clear the current error message

### Examples

See `useAuth.example.tsx` for comprehensive usage examples including:

1. Login form with error handling
2. User profile display
3. Permission-based rendering
4. Protected component wrapper
5. Conditional navigation
6. Multiple permission checks

### Requirements Validation

This hook validates the following requirements:

- **Requirement 2.1**: Generate and store JWT access token with 24-hour expiration
- **Requirement 2.4**: Clear all stored authentication tokens on logout
- **Requirement 2.6**: Display clear error messages for authentication failures

### Testing

Unit tests are available in `useAuth.test.ts`. The tests verify:

- Initial state is unauthenticated
- State exposure (user, loading, error, permissions)
- Action exposure (login, logout, checkPermission, clearError)
- Permission checking logic
- Logout clears state
- Error clearing
- Reactivity to store changes

To run tests (once Vitest is configured):

```bash
npm run test useAuth.test.ts
```

### Implementation Notes

1. **Zustand Integration**: The hook uses Zustand's selector pattern for optimal performance
2. **Automatic Reactivity**: Components using this hook will automatically re-render when auth state changes
3. **Type Safety**: Full TypeScript support with proper type inference
4. **Error Handling**: Errors are stored in state and can be displayed to users
5. **Permission Format**: Permissions follow the format "resource:action" (e.g., "users:create", "students:read")

### Related Files

- `src/store/authStore.ts` - The underlying Zustand store
- `src/types/auth.ts` - TypeScript type definitions
- `src/lib/api-client.ts` - API client with token management
- `src/config/constants.ts` - Authentication configuration constants
