/**
 * PermissionsSelector Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PermissionsSelector, type Permission } from './PermissionsSelector';

describe('PermissionsSelector', () => {
  const mockPermissions: Permission[] = [
    {
      id: '1',
      name: 'users:create',
      description: 'Create users',
      resource: 'users',
      action: 'create',
    },
    {
      id: '2',
      name: 'users:read',
      description: 'Read users',
      resource: 'users',
      action: 'read',
    },
    {
      id: '3',
      name: 'roles:create',
      description: 'Create roles',
      resource: 'roles',
      action: 'create',
    },
  ];

  it('should render permissions grouped by resource', () => {
    const onChange = vi.fn();
    render(
      <PermissionsSelector
        permissions={mockPermissions}
        selectedPermissionIds={[]}
        onChange={onChange}
      />
    );

    // Check if modules are rendered
    expect(screen.getByText('users')).toBeInTheDocument();
    expect(screen.getByText('roles')).toBeInTheDocument();
  });

  it('should display selected count', () => {
    const onChange = vi.fn();
    const { container } = render(
      <PermissionsSelector
        permissions={mockPermissions}
        selectedPermissionIds={['1', '2']}
        onChange={onChange}
      />
    );

    // Check if selected count is displayed in the summary section
    const summaryText = container.querySelector('div[style*="margin-top: 16px"]')?.textContent;
    expect(summaryText).toContain('2 permission(s) selected out of');
    expect(summaryText).toContain('3 total');
  });

  it('should call onChange when permission is selected', () => {
    const onChange = vi.fn();
    render(
      <PermissionsSelector
        permissions={mockPermissions}
        selectedPermissionIds={[]}
        onChange={onChange}
      />
    );

    // Find and click a permission checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    // Skip the first checkbox (module select all) and click a permission checkbox
    fireEvent.click(checkboxes[1]);

    expect(onChange).toHaveBeenCalled();
  });

  it('should show loading state', () => {
    const onChange = vi.fn();
    render(
      <PermissionsSelector
        permissions={mockPermissions}
        selectedPermissionIds={[]}
        onChange={onChange}
        loading={true}
      />
    );

    expect(screen.getByText('Loading permissions...')).toBeInTheDocument();
  });

  it('should show error state', () => {
    const onChange = vi.fn();
    const error = new Error('Failed to load permissions');
    render(
      <PermissionsSelector
        permissions={mockPermissions}
        selectedPermissionIds={[]}
        onChange={onChange}
        error={error}
      />
    );

    expect(screen.getByText('Error loading permissions')).toBeInTheDocument();
    expect(screen.getByText('Failed to load permissions')).toBeInTheDocument();
  });

  it('should show empty state when no permissions', () => {
    const onChange = vi.fn();
    render(
      <PermissionsSelector
        permissions={[]}
        selectedPermissionIds={[]}
        onChange={onChange}
      />
    );

    expect(screen.getByText('No permissions available')).toBeInTheDocument();
  });

  it('should disable checkboxes when disabled prop is true', () => {
    const onChange = vi.fn();
    render(
      <PermissionsSelector
        permissions={mockPermissions}
        selectedPermissionIds={[]}
        onChange={onChange}
        disabled={true}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeDisabled();
    });
  });
});
