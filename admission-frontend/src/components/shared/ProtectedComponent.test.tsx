/**
 * Tests for ProtectedComponent
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProtectedComponent, withPermission, useProtectedRender } from './ProtectedComponent';
import { useAuthStore } from '@/store/authStore';

describe('ProtectedComponent', () => {
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
    it('should not render children', () => {
      render(
        <ProtectedComponent permission="users:create">
          <div>Protected Content</div>
        </ProtectedComponent>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should render fallback when provided', () => {
      render(
        <ProtectedComponent
          permission="users:create"
          fallback={<div>Access Denied</div>}
        >
          <div>Protected Content</div>
        </ProtectedComponent>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('when user is authenticated with permissions', () => {
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

    it('should render children when user has single required permission', () => {
      render(
        <ProtectedComponent permission="users:create">
          <div>Protected Content</div>
        </ProtectedComponent>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should not render children when user lacks single required permission', () => {
      render(
        <ProtectedComponent permission="users:delete">
          <div>Protected Content</div>
        </ProtectedComponent>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should render children when user has all required permissions', () => {
      render(
        <ProtectedComponent permissions={['users:create', 'users:read']}>
          <div>Protected Content</div>
        </ProtectedComponent>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should not render children when user lacks any of the required permissions', () => {
      render(
        <ProtectedComponent permissions={['users:create', 'users:delete']}>
          <div>Protected Content</div>
        </ProtectedComponent>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should render children when user has any of the specified permissions', () => {
      render(
        <ProtectedComponent anyPermissions={['users:create', 'users:delete']}>
          <div>Protected Content</div>
        </ProtectedComponent>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should not render children when user has none of the specified permissions', () => {
      render(
        <ProtectedComponent anyPermissions={['users:delete', 'students:create']}>
          <div>Protected Content</div>
        </ProtectedComponent>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should render fallback when user lacks permissions', () => {
      render(
        <ProtectedComponent
          permission="users:delete"
          fallback={<div>Access Denied</div>}
        >
          <div>Protected Content</div>
        </ProtectedComponent>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('withPermission HOC', () => {
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

    it('should render wrapped component when user has permission', () => {
      const TestComponent = ({ message }: { message: string }) => <div>{message}</div>;
      const ProtectedTestComponent = withPermission(TestComponent, {
        permission: 'users:create',
      });

      render(<ProtectedTestComponent message="Test Message" />);

      expect(screen.getByText('Test Message')).toBeInTheDocument();
    });

    it('should not render wrapped component when user lacks permission', () => {
      const TestComponent = ({ message }: { message: string }) => <div>{message}</div>;
      const ProtectedTestComponent = withPermission(TestComponent, {
        permission: 'users:delete',
      });

      render(<ProtectedTestComponent message="Test Message" />);

      expect(screen.queryByText('Test Message')).not.toBeInTheDocument();
    });

    it('should render fallback when user lacks permission', () => {
      const TestComponent = ({ message }: { message: string }) => <div>{message}</div>;
      const ProtectedTestComponent = withPermission(TestComponent, {
        permission: 'users:delete',
        fallback: <div>No Access</div>,
      });

      render(<ProtectedTestComponent message="Test Message" />);

      expect(screen.getByText('No Access')).toBeInTheDocument();
      expect(screen.queryByText('Test Message')).not.toBeInTheDocument();
    });
  });

  describe('useProtectedRender hook', () => {
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

    it('should return canRender true when user has permission', () => {
      function TestComponent() {
        const { canRender } = useProtectedRender({ permission: 'users:create' });
        return <div>{canRender ? 'Can Render' : 'Cannot Render'}</div>;
      }

      render(<TestComponent />);

      expect(screen.getByText('Can Render')).toBeInTheDocument();
    });

    it('should return canRender false when user lacks permission', () => {
      function TestComponent() {
        const { canRender } = useProtectedRender({ permission: 'users:delete' });
        return <div>{canRender ? 'Can Render' : 'Cannot Render'}</div>;
      }

      render(<TestComponent />);

      expect(screen.getByText('Cannot Render')).toBeInTheDocument();
    });
  });
});
