'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Space, Input, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { Controller } from 'react-hook-form';
import { DataGrid } from '@/components/admin/DataGrid';
import { FormModal } from '@/components/admin/FormModal';
import { FormDrawer } from '@/components/admin/FormDrawer';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { PermissionsSelector, type Permission } from '@/components/admin/PermissionsSelector';
import { usePagination } from '@/hooks/usePagination';
import { useModal } from '@/hooks/useModal';
import { RbacService } from '@/api/services/RbacService';
import { createRoleSchema, updateRoleSchema, type CreateRoleFormData, type UpdateRoleFormData } from './schema';
import type { Column, DataGridAction } from '@/components/admin/DataGrid/types';

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: Array<{
    permission: Permission;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Permissions state
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  
  const pagination = usePagination(10);
  const createModal = useModal();
  const editDrawer = useModal();
  const deleteModal = useModal();
  
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Fetch roles from API
  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/rbac/roles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admission_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch roles: ${response.status} ${response.statusText}`);
      }
      
      const data: any = await response.json();
      let filteredRoles = Array.isArray(data) ? data : [];
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredRoles = filteredRoles.filter((role: any) =>
          role.name.toLowerCase().includes(query) ||
          (role.description && role.description.toLowerCase().includes(query))
        );
      }
      
      setRoles(filteredRoles);
      pagination.setTotal(filteredRoles.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Failed to fetch roles');
      setError(errorMessage);
      message.error('Failed to load roles');
      console.error('Error fetching roles:', err);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.pageSize, searchQuery]);

  // Load roles on mount and when dependencies change
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Fetch all permissions for the selector
  const fetchPermissions = useCallback(async () => {
    setLoadingPermissions(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/rbac/permissions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admission_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch permissions: ${response.status} ${response.statusText}`);
      }
      
      const data: any = await response.json();
      const permissions = Array.isArray(data) ? data : [];
      setAllPermissions(permissions);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      message.error('Failed to load permissions');
      setAllPermissions([]);
    } finally {
      setLoadingPermissions(false);
    }
  }, []);

  // Load permissions on mount
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Handle create role
  const handleCreate = async (data: CreateRoleFormData) => {
    try {
      console.log('Creating role with data:', data);
      
      // Clean data: convert empty string to undefined
      const cleanData = {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
      };
      
      console.log('Cleaned data:', cleanData);
      
      await RbacService.rbacControllerCreateRole(cleanData);
      message.success('Role created successfully');
      fetchRoles();
      createModal.close();
    } catch (err) {
      console.error('Create role error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create role';
      message.error(errorMessage);
      throw err;
    }
  };

  // Handle edit role
  const handleEdit = async (data: UpdateRoleFormData) => {
    if (!selectedRole) return;
    
    try {
      // Validate that we have permission IDs
      if (!selectedPermissionIds || selectedPermissionIds.length === 0) {
        message.warning('Please select at least one permission');
        return;
      }

      console.log('Updating role permissions:', {
        roleId: selectedRole.id,
        permissionIds: selectedPermissionIds,
      });
      
      // Only update role permissions (role name and description cannot be changed)
      await RbacService.rbacControllerAssignPermissionsToRole(
        selectedRole.id,
        { permissionIds: selectedPermissionIds }
      );
      
      message.success('Role permissions updated successfully');
      fetchRoles();
      editDrawer.close();
      setSelectedRole(null);
      setSelectedPermissionIds([]);
    } catch (err) {
      console.error('Error updating role:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update role';
      message.error(errorMessage);
      throw err;
    }
  };

  // Handle delete role
  const handleDelete = async () => {
    if (!selectedRole) return;
    
    try {
      // Check if role is assigned to users (validation check per requirement 8.8)
      // Note: This check should ideally be done on the backend
      const usersResponse: any = await fetch(`/api/roles/${selectedRole.id}/users`)
        .then(r => r.json())
        .catch(() => ({ data: [] }));
      
      const assignedUsers = usersResponse.data || usersResponse || [];
      
      if (assignedUsers.length > 0) {
        message.error(`Cannot delete role "${selectedRole.name}" because it is assigned to ${assignedUsers.length} user(s)`);
        return;
      }
      
      // Note: The API doesn't have a deleteRole endpoint in RbacService
      // This is a placeholder - you may need to add this endpoint to the backend
      await fetch(`/api/roles/${selectedRole.id}`, { method: 'DELETE' });
      message.success('Role deleted successfully');
      fetchRoles();
      deleteModal.close();
      setSelectedRole(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete role';
      message.error(errorMessage);
    }
  };

  // Open edit drawer with role data
  const openEditDrawer = (role: Role) => {
    console.log('Opening edit drawer for role:', role);
    setSelectedRole(role);
    // Set initial selected permissions - backend returns { permission: Permission }[]
    const permissionIds = role.permissions?.map(rp => rp.permission.id) || [];
    console.log('Initial permission IDs:', permissionIds);
    setSelectedPermissionIds(permissionIds);
    editDrawer.open();
  };

  // Open delete confirmation
  const openDeleteModal = (role: Role) => {
    setSelectedRole(role);
    deleteModal.open();
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    pagination.goToPage(1);
  };

  // Define table columns
  const columns: Column<Role>[] = [
    {
      key: 'name',
      title: 'Role Name',
      dataIndex: 'name',
      sortable: true,
    },
    {
      key: 'description',
      title: 'Description',
      dataIndex: 'description',
      render: (value: string | undefined) => value || '-',
    },
    {
      key: 'createdAt',
      title: 'Created At',
      dataIndex: 'createdAt',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  // Define row actions
  const actions: DataGridAction<Role>[] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: openEditDrawer,
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      onClick: openDeleteModal,
      danger: true,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Roles Management</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={createModal.open}
        >
          Add Role
        </Button>
      </div>

      {/* Search Bar */}
      <Space style={{ marginBottom: '16px', width: '100%' }} size="middle">
        <Input
          placeholder="Search by role name or description"
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
        />
      </Space>

      {/* Roles DataGrid */}
      <DataGrid
        columns={columns}
        data={roles}
        loading={loading}
        error={error}
        pagination={{
          current: pagination.currentPage,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: pagination.goToPage,
        }}
        actions={actions}
        rowKey="id"
      />

      {/* Create Role Modal */}
      <FormModal
        open={createModal.isOpen}
        title="Create Role"
        schema={createRoleSchema}
        onClose={createModal.close}
        onSubmit={handleCreate}
        initialValues={{
          name: '',
          description: '',
        }}
      >
        {(form) => (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Role Name <span style={{ color: 'red' }}>*</span>
              </label>
              <Controller
                name="name"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter role name (e.g., admin, editor)"
                    status={form.formState.errors.name ? 'error' : ''}
                  />
                )}
              />
              {form.formState.errors.name && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {form.formState.errors.name.message}
                </div>
              )}
              <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                Chỉ được chứa chữ cái, số, gạch dưới, gạch ngang và khoảng trắng
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Description
              </label>
              <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                  <Input.TextArea
                    {...field}
                    placeholder="Enter role description"
                    rows={3}
                    status={form.formState.errors.description ? 'error' : ''}
                  />
                )}
              />
              {form.formState.errors.description && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {form.formState.errors.description.message}
                </div>
              )}
            </div>
          </Space>
        )}
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteModal.isOpen}
        title="Delete Role"
        content={`Are you sure you want to delete role "${selectedRole?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => {
          deleteModal.close();
          setSelectedRole(null);
        }}
        okText="Delete"
        cancelText="Cancel"
        okType="danger"
      />

      {/* Edit Role Drawer */}
      <FormDrawer
        open={editDrawer.isOpen}
        title="Edit Role"
        schema={updateRoleSchema}
        onClose={() => {
          editDrawer.close();
          setSelectedRole(null);
          setSelectedPermissionIds([]);
        }}
        onSubmit={handleEdit}
        initialValues={{
          name: selectedRole?.name || '',
          description: selectedRole?.description || '',
        }}
        width={720}
      >
        {(form) => (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Role Name <span style={{ color: 'red' }}>*</span>
              </label>
              <Controller
                name="name"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter role name (e.g., admin, editor)"
                    disabled
                    status={form.formState.errors.name ? 'error' : ''}
                  />
                )}
              />
              {form.formState.errors.name && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {form.formState.errors.name.message}
                </div>
              )}
              <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                Role name cannot be changed after creation
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Description
              </label>
              <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                  <Input.TextArea
                    {...field}
                    placeholder="Enter role description"
                    rows={3}
                    status={form.formState.errors.description ? 'error' : ''}
                  />
                )}
              />
              {form.formState.errors.description && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {form.formState.errors.description.message}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: 500 }}>
                Permissions
              </label>
              <PermissionsSelector
                permissions={allPermissions}
                selectedPermissionIds={selectedPermissionIds}
                onChange={setSelectedPermissionIds}
                loading={loadingPermissions}
              />
            </div>
          </Space>
        )}
      </FormDrawer>
    </div>
  );
}
