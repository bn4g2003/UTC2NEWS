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
      message.success('Tạo vai trò thành công');
      fetchRoles();
      createModal.close();
    } catch (err) {
      console.error('Create role error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Không thể tạo vai trò';
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
        message.warning('Vui lòng chọn ít nhất một quyền');
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
      
      message.success('Cập nhật quyền vai trò thành công');
      fetchRoles();
      editDrawer.close();
      setSelectedRole(null);
      setSelectedPermissionIds([]);
    } catch (err) {
      console.error('Error updating role:', err);
      const errorMessage = err instanceof Error ? err.message : 'Không thể cập nhật vai trò';
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
        message.error(`Không thể xóa vai trò "${selectedRole.name}" vì đang được gán cho ${assignedUsers.length} người dùng`);
        return;
      }
      
      // Note: The API doesn't have a deleteRole endpoint in RbacService
      // This is a placeholder - you may need to add this endpoint to the backend
      await fetch(`/api/roles/${selectedRole.id}`, { method: 'DELETE' });
      message.success('Xóa vai trò thành công');
      fetchRoles();
      deleteModal.close();
      setSelectedRole(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể xóa vai trò';
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
      title: 'Tên vai trò',
      dataIndex: 'name',
      sortable: true,
    },
    {
      key: 'description',
      title: 'Mô tả',
      dataIndex: 'description',
      render: (value: string | undefined) => value || '-',
    },
    {
      key: 'createdAt',
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      render: (value: string) => new Date(value).toLocaleDateString('vi-VN'),
    },
  ];

  // Define row actions
  const actions: DataGridAction<Role>[] = [
    {
      key: 'edit',
      label: 'Sửa',
      icon: <EditOutlined />,
      onClick: openEditDrawer,
    },
    {
      key: 'delete',
      label: 'Xóa',
      icon: <DeleteOutlined />,
      onClick: openDeleteModal,
      danger: true,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Quản lý Vai trò</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={createModal.open}
        >
          Thêm vai trò
        </Button>
      </div>

      {/* Search Bar */}
      <Space style={{ marginBottom: '16px', width: '100%' }} size="middle">
        <Input
          placeholder="Tìm kiếm theo tên vai trò hoặc mô tả"
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
        title="Thêm vai trò"
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
        title="Xóa vai trò"
        content={`Bạn có chắc chắn muốn xóa vai trò "${selectedRole?.name}"? Hành động này không thể hoàn tác.`}
        onConfirm={handleDelete}
        onCancel={() => {
          deleteModal.close();
          setSelectedRole(null);
        }}
        okText="Xóa"
        cancelText="Hủy"
        okType="danger"
      />

      {/* Edit Role Drawer */}
      <FormDrawer
        open={editDrawer.isOpen}
        title="Sửa vai trò"
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
