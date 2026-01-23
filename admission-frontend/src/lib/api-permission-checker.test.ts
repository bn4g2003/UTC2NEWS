/**
 * Tests for API Permission Checker
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkApiPermission,
  checkApiPermissions,
  checkApiAnyPermission,
  PermissionError,
  hasApiPermission,
  hasApiPermissions,
  hasApiAnyPermission,
  withApiPermission,
  withApiPermissions,
} from './api-permission-checker';
import { useAuthStore } from '@/store/authStore';

describe('API Permission Checker', () => {
  beforeEach(() => {
    // Reset auth store before each test
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      permissions: [],
      isLoading: false,
      error: null,
    });
  });

  describe('checkApiPermission', () => {
    it('should throw PermissionError when user is not authenticated', () => {
      expect(() => checkApiPermission('users:create')).toThrow(PermissionError);
      expect(() => checkApiPermission('users:create')).toThrow('User is not authenticated');
    });

    it('should throw PermissionError when user lacks the required permission', () => {
      useAuthStore.setState({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User',
          role: {
            id: '1',
            name: 'User',
            description: 'Regular User',
            permissions: [],
          },
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'test-token',
        isAuthenticated: true,
        permissions: [],
        isLoading: false,
        error: null,
      });

      expect(() => checkApiPermission('users:create')).toThrow(PermissionError);
      expect(() => checkApiPermission('users:create')).toThrow('User lacks required permission: users:create');
    });

    it('should not throw when user has the required permission', () => {
      useAuthStore.setState({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User',
          role: {
            id: '1',
            name: 'Admin',
            description: 'Administrator',
            permissions: [
              { id: '1', name: 'Create Users', resource: 'users', action: 'create' },
            ],
          },
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'test-token',
        isAuthenticated: true,
        permissions: ['users:create'],
        isLoading: false,
        error: null,
      });

      expect(() => checkApiPermission('users:create')).not.toThrow();
    });
  });

  describe('checkApiPermissions', () => {
    it('should throw PermissionError when user is not authenticated', () => {
      expect(() => checkApiPermissions(['users:create', 'users:read'])).toThrow(PermissionError);
    });

    it('should throw PermissionError when user lacks any of the required permissions', () => {
      useAuthStore.setState({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User',
          role: {
            id: '1',
            name: 'User',
            description: 'Regular User',
            permissions: [
              { id: '1', name: 'Read Users', resource: 'users', action: 'read' },
            ],
          },
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'test-token',
        isAuthenticated: true,
        permissions: ['users:read'],
        isLoading: false,
        error: null,
      });

      expect(() => checkApiPermissions(['users:create', 'users:read'])).toThrow(PermissionError);
      expect(() => checkApiPermissions(['users:create', 'users:read'])).toThrow('User lacks required permissions: users:create');
    });

    it('should not throw when user has all required permissions', () => {
      useAuthStore.setState({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User',
          role: {
            id: '1',
            name: 'Admin',
            description: 'Administrator',
            permissions: [
              { id: '1', name: 'Create Users', resource: 'users', action: 'create' },
              { id: '2', name: 'Read Users', resource: 'users', action: 'read' },
            ],
          },
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'test-token',
        isAuthenticated: true,
        permissions: ['users:create', 'users:read'],
        isLoading: false,
        error: null,
      });

      expect(() => checkApiPermissions(['users:create', 'users:read'])).not.toThrow();
    });
  });

  describe('checkApiAnyPermission', () => {
    it('should throw PermissionError when user is not authenticated', () => {
      expect(() => checkApiAnyPermission(['users:create', 'users:read'])).toThrow(PermissionError);
    });

    it('should throw PermissionError when user has none of the specified permissions', () => {
      useAuthStore.setState({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User',
          role: {
            id: '1',
            name: 'User',
            description: 'Regular User',
            permissions: [],
          },
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'test-token',
        isAuthenticated: true,
        permissions: [],
        isLoading: false,
        error: null,
      });

      expect(() => checkApiAnyPermission(['users:create', 'users:read'])).toThrow(PermissionError);
    });

    it('should not throw when user has at least one of the specified permissions', () => {
      useAuthStore.setState({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User',
          role: {
            id: '1',
            name: 'User',
            description: 'Regular User',
            permissions: [
              { id: '1', name: 'Read Users', resource: 'users', action: 'read' },
            ],
          },
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'test-token',
        isAuthenticated: true,
        permissions: ['users:read'],
        isLoading: false,
        error: null,
      });

      expect(() => checkApiAnyPermission(['users:create', 'users:read'])).not.toThrow();
    });
  });

  describe('hasApiPermission', () => {
    it('should return false when user is not authenticated', () => {
      expect(hasApiPermission('users:create')).toBe(false);
    });

    it('should return false when user lacks the permission', () => {
      useAuthStore.setState({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User',
          role: {
            id: '1',
            name: 'User',
            description: 'Regular User',
            permissions: [],
          },
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'test-token',
        isAuthenticated: true,
        permissions: [],
        isLoading: false,
        error: null,
      });

      expect(hasApiPermission('users:create')).toBe(false);
    });

    it('should return true when user has the permission', () => {
      useAuthStore.setState({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User',
          role: {
            id: '1',
            name: 'Admin',
            description: 'Administrator',
            permissions: [
              { id: '1', name: 'Create Users', resource: 'users', action: 'create' },
            ],
          },
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'test-token',
        isAuthenticated: true,
        permissions: ['users:create'],
        isLoading: false,
        error: null,
      });

      expect(hasApiPermission('users:create')).toBe(true);
    });
  });

  describe('hasApiPermissions', () => {
    it('should return false when user is not authenticated', () => {
      expect(hasApiPermissions(['users:create', 'users:read'])).toBe(false);
    });

    it('should return false when user lacks any permission', () => {
      useAuthStore.setState({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User',
          role: {
            id: '1',
            name: 'User',
            description: 'Regular User',
            permissions: [
              { id: '1', name: 'Read Users', resource: 'users', action: 'read' },
            ],
          },
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'test-token',
        isAuthenticated: true,
        permissions: ['users:read'],
        isLoading: false,
        error: null,
      });

      expect(hasApiPermissions(['users:create', 'users:read'])).toBe(false);
    });

    it('should return true when user has all permissions', () => {
      useAuthStore.setState({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User',
          role: {
            id: '1',
            name: 'Admin',
            description: 'Administrator',
            permissions: [
              { id: '1', name: 'Create Users', resource: 'users', action: 'create' },
              { id: '2', name: 'Read Users', resource: 'users', action: 'read' },
            ],
          },
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'test-token',
        isAuthenticated: true,
        permissions: ['users:create', 'users:read'],
        isLoading: false,
        error: null,
      });

      expect(hasApiPermissions(['users:create', 'users:read'])).toBe(true);
    });
  });

  describe('hasApiAnyPermission', () => {
    it('should return false when user is not authenticated', () => {
      expect(hasApiAnyPermission(['users:create', 'users:read'])).toBe(false);
    });

    it('should return false when user has none of the permissions', () => {
      useAuthStore.setState({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User',
          role: {
            id: '1',
            name: 'User',
            description: 'Regular User',
            permissions: [],
          },
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'test-token',
        isAuthenticated: true,
        permissions: [],
        isLoading: false,
        error: null,
      });

      expect(hasApiAnyPermission(['users:create', 'users:read'])).toBe(false);
    });

    it('should return true when user has at least one permission', () => {
      useAuthStore.setState({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User',
          role: {
            id: '1',
            name: 'User',
            description: 'Regular User',
            permissions: [
              { id: '1', name: 'Read Users', resource: 'users', action: 'read' },
            ],
          },
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'test-token',
        isAuthenticated: true,
        permissions: ['users:read'],
        isLoading: false,
        error: null,
      });

      expect(hasApiAnyPermission(['users:create', 'users:read'])).toBe(true);
    });
  });

  describe('withApiPermission', () => {
    it('should execute API call when user has permission', async () => {
      useAuthStore.setState({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User',
          role: {
            id: '1',
            name: 'Admin',
            description: 'Administrator',
            permissions: [
              { id: '1', name: 'Create Users', resource: 'users', action: 'create' },
            ],
          },
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'test-token',
        isAuthenticated: true,
        permissions: ['users:create'],
        isLoading: false,
        error: null,
      });

      const mockApiCall = async (data: any) => ({ success: true, data });
      const wrappedCall = withApiPermission('users:create', mockApiCall);

      const result = await wrappedCall({ name: 'Test' });
      expect(result).toEqual({ success: true, data: { name: 'Test' } });
    });

    it('should throw PermissionError when user lacks permission', async () => {
      useAuthStore.setState({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User',
          role: {
            id: '1',
            name: 'User',
            description: 'Regular User',
            permissions: [],
          },
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'test-token',
        isAuthenticated: true,
        permissions: [],
        isLoading: false,
        error: null,
      });

      const mockApiCall = async (data: any) => ({ success: true, data });
      const wrappedCall = withApiPermission('users:create', mockApiCall);

      await expect(wrappedCall({ name: 'Test' })).rejects.toThrow(PermissionError);
    });
  });

  describe('withApiPermissions', () => {
    it('should execute API call when user has all permissions', async () => {
      useAuthStore.setState({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User',
          role: {
            id: '1',
            name: 'Admin',
            description: 'Administrator',
            permissions: [
              { id: '1', name: 'Create Users', resource: 'users', action: 'create' },
              { id: '2', name: 'Read Users', resource: 'users', action: 'read' },
            ],
          },
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'test-token',
        isAuthenticated: true,
        permissions: ['users:create', 'users:read'],
        isLoading: false,
        error: null,
      });

      const mockApiCall = async (data: any) => ({ success: true, data });
      const wrappedCall = withApiPermissions(['users:create', 'users:read'], mockApiCall);

      const result = await wrappedCall({ name: 'Test' });
      expect(result).toEqual({ success: true, data: { name: 'Test' } });
    });

    it('should throw PermissionError when user lacks any permission', async () => {
      useAuthStore.setState({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User',
          role: {
            id: '1',
            name: 'User',
            description: 'Regular User',
            permissions: [
              { id: '1', name: 'Read Users', resource: 'users', action: 'read' },
            ],
          },
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'test-token',
        isAuthenticated: true,
        permissions: ['users:read'],
        isLoading: false,
        error: null,
      });

      const mockApiCall = async (data: any) => ({ success: true, data });
      const wrappedCall = withApiPermissions(['users:create', 'users:read'], mockApiCall);

      await expect(wrappedCall({ name: 'Test' })).rejects.toThrow(PermissionError);
    });
  });
});
