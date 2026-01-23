/**
 * Tests for usePermissions hook
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions, usePermission } from './usePermissions';
import { useAuthStore } from '@/store/authStore';

describe('usePermissions', () => {
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

  describe('when user is not authenticated', () => {
    it('should return false for hasPermission', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.hasPermission('users:create')).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should return false for hasAllPermissions', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.hasAllPermissions(['users:create', 'users:read'])).toBe(false);
    });

    it('should return false for hasAnyPermission', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.hasAnyPermission(['users:create', 'users:read'])).toBe(false);
    });

    it('should return empty permissions array', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.permissions).toEqual([]);
    });
  });

  describe('when user is authenticated with permissions', () => {
    beforeEach(() => {
      // Set authenticated user with permissions
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
              { id: '3', name: 'Update Users', resource: 'users', action: 'update' },
            ],
          },
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'test-token',
        isAuthenticated: true,
        permissions: ['users:create', 'users:read', 'users:update'],
        isLoading: false,
        error: null,
      });
    });

    it('should return true for hasPermission when user has the permission', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.hasPermission('users:create')).toBe(true);
      expect(result.current.hasPermission('users:read')).toBe(true);
      expect(result.current.hasPermission('users:update')).toBe(true);
    });

    it('should return false for hasPermission when user lacks the permission', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.hasPermission('users:delete')).toBe(false);
      expect(result.current.hasPermission('students:create')).toBe(false);
    });

    it('should return true for hasAllPermissions when user has all permissions', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.hasAllPermissions(['users:create', 'users:read'])).toBe(true);
    });

    it('should return false for hasAllPermissions when user lacks any permission', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.hasAllPermissions(['users:create', 'users:delete'])).toBe(false);
    });

    it('should return true for hasAnyPermission when user has at least one permission', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.hasAnyPermission(['users:create', 'users:delete'])).toBe(true);
      expect(result.current.hasAnyPermission(['users:delete', 'users:create'])).toBe(true);
    });

    it('should return false for hasAnyPermission when user has none of the permissions', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.hasAnyPermission(['users:delete', 'students:create'])).toBe(false);
    });

    it('should return user permissions array', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.permissions).toEqual(['users:create', 'users:read', 'users:update']);
    });

    it('should return isAuthenticated as true', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should return isLoading as false', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('usePermission convenience hook', () => {
    beforeEach(() => {
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
    });

    it('should return true when user has the permission', () => {
      const { result } = renderHook(() => usePermission('users:create'));
      
      expect(result.current.hasPermission).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should return false when user lacks the permission', () => {
      const { result } = renderHook(() => usePermission('users:delete'));
      
      expect(result.current.hasPermission).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
