/**
 * useAuth Hook
 * Provides easy access to authentication state and actions
 * Validates Requirements 2.1, 2.4, 2.6
 */

import { useAuthStore } from '@/store/authStore';
import type { LoginDto } from '@/api/models/LoginDto';
import type { User } from '@/types/auth';

export interface UseAuthReturn {
  [x: string]: any;
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: string[];

  // Actions
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
  checkPermission: (permission: string) => boolean;
  clearError: () => void;
}

/**
 * Custom hook for accessing authentication state and actions
 * 
 * @returns Authentication state and actions
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, login, logout } = useAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <LoginForm onSubmit={login} />;
 *   }
 *   
 *   return (
 *     <div>
 *       <p>Welcome, {user?.fullName}</p>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const permissions = useAuthStore((state) => state.permissions);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const checkPermission = useAuthStore((state) => state.checkPermission);
  const clearError = useAuthStore((state) => state.clearError);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    permissions,
    login,
    logout,
    checkPermission,
    clearError,
  };
}
