/**
 * Authentication Store using Zustand
 * Manages authentication state, user data, and permissions
 * Validates Requirements 2.1, 2.4
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthenticationService } from '@/api/services/AuthenticationService';
import { UsersService } from '@/api/services/UsersService';
import type { LoginDto } from '@/api/models/LoginDto';
import type { User, AuthTokens } from '@/types/auth';
import { setAuthToken, clearAuthToken } from '@/lib/api-client';
import { AUTH_CONFIG } from '@/config/constants';

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  permissions: string[];
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  checkPermission: (permission: string) => boolean;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

/**
 * Extract permissions from user data
 * Backend returns permissions as an array of permission names
 */
function extractPermissions(user: User | null): string[] {
  if (!user) {
    return [];
  }

  // If permissions are directly in user object (from login response)
  if (user.permissions && Array.isArray(user.permissions)) {
    return user.permissions;
  }

  // If permissions are nested in role structure (from profile response)
  if (user.role && user.role.permissions) {
    return user.role.permissions.map((permission) => {
      // If permission is a string, return it directly
      if (typeof permission === 'string') {
        return permission;
      }
      // If permission is an object with name property
      if (permission.name) {
        return permission.name;
      }
      // Format: resource:action (e.g., "users:create")
      return `${permission.resource}:${permission.action}`;
    });
  }

  return [];
}

/**
 * Authentication store
 * Manages user authentication state and provides authentication actions
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      permissions: [],
      isLoading: false,
      error: null,

      /**
       * Login with username and password
       * Validates Requirement 2.1: Generate and store JWT access token with 24-hour expiration
       */
      login: async (credentials: LoginDto) => {
        set({ isLoading: true, error: null });

        try {
          // Call authentication API
          const response = await AuthenticationService.authControllerLogin(credentials);

          // Extract token from response
          // The response should contain accessToken and user data
          const accessToken = response.accessToken || response.access_token;
          const expiresIn = response.expiresIn || response.expires_in || AUTH_CONFIG.JWT_EXPIRY;

          if (!accessToken) {
            throw new Error('No access token received from server');
          }

          // Store token in API client
          setAuthToken(accessToken);

          // Store token in cookie for middleware access
          if (typeof document !== 'undefined') {
            // Set cookie with 24-hour expiration
            const expiryDate = new Date();
            expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);
            document.cookie = `auth-token=${accessToken}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Strict`;
          }

          // Extract user data from response
          // The backend should return user data with the login response
          const user: User | null = response.user || null;

          // Extract permissions from user
          const permissions = extractPermissions(user);

          // Update state
          set({
            user,
            token: accessToken,
            isAuthenticated: true,
            permissions,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          // Handle authentication errors
          const errorMessage = error?.body?.message || error?.message || 'Invalid credentials';
          
          // Clear any stored tokens
          clearAuthToken();
          
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            permissions: [],
            isLoading: false,
            error: errorMessage,
          });

          throw new Error(errorMessage);
        }
      },

      /**
       * Logout and clear authentication state
       * Validates Requirement 2.4: Clear all stored authentication tokens
       */
      logout: () => {
        // Clear token from API client
        clearAuthToken();

        // Clear token from cookie
        if (typeof document !== 'undefined') {
          document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
        }

        // Reset state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          permissions: [],
          isLoading: false,
          error: null,
        });
      },

      /**
       * Refresh authentication token
       * Note: This is a placeholder. Implement based on backend refresh token endpoint
       */
      refreshToken: async () => {
        const { token } = get();

        if (!token) {
          throw new Error('No token to refresh');
        }

        set({ isLoading: true, error: null });

        try {
          // TODO: Implement refresh token logic when backend endpoint is available
          // For now, this is a placeholder
          // const response = await AuthenticationService.refreshToken();
          // setAuthToken(response.accessToken);
          // set({ token: response.accessToken, isLoading: false });

          console.warn('Refresh token not implemented yet');
          set({ isLoading: false });
        } catch (error: any) {
          const errorMessage = error?.body?.message || error?.message || 'Failed to refresh token';
          
          set({
            isLoading: false,
            error: errorMessage,
          });

          // If refresh fails, logout
          get().logout();

          throw new Error(errorMessage);
        }
      },

      /**
       * Check if user has a specific permission
       * Validates Requirement 2.4: Permission checking for RBAC
       */
      checkPermission: (permission: string): boolean => {
        const { permissions, isAuthenticated } = get();

        if (!isAuthenticated) {
          return false;
        }

        // Check if user has the specific permission
        return permissions.includes(permission);
      },

      /**
       * Set user data (useful for updating user profile)
       */
      setUser: (user: User | null) => {
        const permissions = extractPermissions(user);
        set({
          user,
          permissions,
          isAuthenticated: !!user,
        });
      },

      /**
       * Clear error state
       */
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage', // Key in localStorage
      partialize: (state) => ({
        // Only persist these fields
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        permissions: state.permissions,
      }),
    }
  )
);

/**
 * Initialize auth store on app load
 * Restores token to API client and cookie if it exists in storage
 */
export function initializeAuthStore() {
  const { token } = useAuthStore.getState();
  
  if (token) {
    setAuthToken(token);
    
    // Restore token to cookie if not present
    if (typeof document !== 'undefined') {
      const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1];
      
      if (!cookieToken) {
        // Set cookie with 24-hour expiration
        const expiryDate = new Date();
        expiryDate.setSeconds(expiryDate.getSeconds() + AUTH_CONFIG.JWT_EXPIRY);
        document.cookie = `auth-token=${token}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Strict`;
      }
    }
  }
}
