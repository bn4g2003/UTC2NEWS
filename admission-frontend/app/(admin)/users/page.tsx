'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Space, Input, Select, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { Controller } from 'react-hook-form';
import { DataGrid } from '@/components/admin/DataGrid';
import { FormModal } from '@/components/admin/FormModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { usePagination } from '@/hooks/usePagination';
import { useModal } from '@/hooks/useModal';
import { UsersService } from '@/api/services/UsersService';
import { createUserSchema, updateUserSchema, type CreateUserFormData, type UpdateUserFormData } from './schema';
import type { Column, DataGridAction } from '@/components/admin/DataGrid/types';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const pagination = usePagination(10);
  const createModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await UsersService.usersControllerFindAll(
        pagination.currentPage,
        pagination.pageSize
      );
      
      // Filter users based on search and status
      let filteredUsers = response.data || response || [];
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredUsers = filteredUsers.filter((user: User) =>
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.fullName.toLowerCase().includes(query)
        );
      }
      
      // Apply status filter
      if (statusFilter !== 'all') {
        const isActive = statusFilter === 'active';
        filteredUsers = filteredUsers.filter((user: User) => user.isActive === isActive);
      }
      
      setUsers(filteredUsers);
      
      // Update total count for pagination
      const total = response.total || filteredUsers.length;
      pagination.setTotal(total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Failed to fetch users');
      setError(errorMessage);
      message.error('Failed to load users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.pageSize, searchQuery, statusFilter]);

  // Load users on mount and when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle create user
  const handleCreate = async (data: CreateUserFormData) => {
    try {
      await UsersService.usersControllerCreateUser(data);
      message.success('Tạo người dùng thành công');
      fetchUsers();
      createModal.close();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tạo người dùng';
      message.error(errorMessage);
      throw err;
    }
  };

  // Handle edit user
  const handleEdit = async (data: UpdateUserFormData) => {
    if (!selectedUser) return;
    
    try {
      // Remove password if empty
      const updateData: any = { ...data };
      if (!updateData.password) {
        delete updateData.password;
      }
      
      await UsersService.usersControllerUpdateUser(selectedUser.id, updateData);
      message.success('Cập nhật người dùng thành công');
      fetchUsers();
      editModal.close();
      setSelectedUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể cập nhật người dùng';
      message.error(errorMessage);
      throw err;
    }
  };

  // Handle delete user
  const handleDelete = async () => {
    if (!selectedUser) return;
    
    try {
      await UsersService.usersControllerDeleteUser(selectedUser.id);
      message.success('Xóa người dùng thành công');
      fetchUsers();
      deleteModal.close();
      setSelectedUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể xóa người dùng';
      message.error(errorMessage);
    }
  };

  // Open edit modal with user data
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    editModal.open();
  };

  // Open delete confirmation
  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    deleteModal.open();
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    pagination.goToPage(1); // Reset to first page on search
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    pagination.goToPage(1); // Reset to first page on filter
  };

  // Define table columns
  const columns: Column<User>[] = [
    {
      key: 'username',
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      sortable: true,
    },
    {
      key: 'fullName',
      title: 'Họ và tên',
      dataIndex: 'fullName',
      sortable: true,
    },
    {
      key: 'email',
      title: 'Email',
      dataIndex: 'email',
      sortable: true,
    },
    {
      key: 'isActive',
      title: 'Trạng thái',
      dataIndex: 'isActive',
      render: (value: boolean) => (
        <Tag color={value ? 'green' : 'red'}>
          {value ? 'Hoạt động' : 'Không hoạt động'}
        </Tag>
      ),
    },
    {
      key: 'createdAt',
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      render: (value: string) => new Date(value).toLocaleDateString('vi-VN'),
    },
  ];

  // Define row actions
  const actions: DataGridAction<User>[] = [
    {
      key: 'edit',
      label: 'Sửa',
      icon: <EditOutlined />,
      onClick: openEditModal,
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
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Quản lý Người dùng</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={createModal.open}
        >
          Thêm người dùng
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Space style={{ marginBottom: '16px', width: '100%' }} size="middle">
        <Input
          placeholder="Tìm kiếm theo tên đăng nhập, email hoặc họ tên"
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
        />
        <Select
          placeholder="Lọc theo trạng thái"
          style={{ width: 150 }}
          value={statusFilter}
          onChange={handleStatusFilterChange}
        >
          <Select.Option value="all">Tất cả</Select.Option>
          <Select.Option value="active">Hoạt động</Select.Option>
          <Select.Option value="inactive">Không hoạt động</Select.Option>
        </Select>
      </Space>

      {/* Users DataGrid */}
      <DataGrid
        columns={columns}
        data={users}
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

      {/* Create User Modal */}
      <FormModal
        open={createModal.isOpen}
        title="Thêm người dùng"
        schema={createUserSchema}
        onClose={createModal.close}
        onSubmit={handleCreate}
        initialValues={{
          username: '',
          email: '',
          fullName: '',
          password: '',
          isActive: true,
        }}
      >
        {(form) => (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Username <span style={{ color: 'red' }}>*</span>
              </label>
              <Controller
                name="username"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter username"
                    status={form.formState.errors.username ? 'error' : ''}
                  />
                )}
              />
              {form.formState.errors.username && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {form.formState.errors.username.message}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Password <span style={{ color: 'red' }}>*</span>
              </label>
              <Controller
                name="password"
                control={form.control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    placeholder="Enter password"
                    status={form.formState.errors.password ? 'error' : ''}
                  />
                )}
              />
              {form.formState.errors.password && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {form.formState.errors.password.message}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Email <span style={{ color: 'red' }}>*</span>
              </label>
              <Controller
                name="email"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter email"
                    type="email"
                    status={form.formState.errors.email ? 'error' : ''}
                  />
                )}
              />
              {form.formState.errors.email && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {form.formState.errors.email.message}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Full Name <span style={{ color: 'red' }}>*</span>
              </label>
              <Controller
                name="fullName"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter full name"
                    status={form.formState.errors.fullName ? 'error' : ''}
                  />
                )}
              />
              {form.formState.errors.fullName && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {form.formState.errors.fullName.message}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Status
              </label>
              <Controller
                name="isActive"
                control={form.control}
                render={({ field }) => (
                  <Select
                    {...field}
                    style={{ width: '100%' }}
                  >
                    <Select.Option value={true}>Active</Select.Option>
                    <Select.Option value={false}>Inactive</Select.Option>
                  </Select>
                )}
              />
            </div>
          </Space>
        )}
      </FormModal>

      {/* Edit User Modal */}
      <FormModal
        open={editModal.isOpen}
        title="Sửa người dùng"
        schema={updateUserSchema}
        onClose={() => {
          editModal.close();
          setSelectedUser(null);
        }}
        onSubmit={handleEdit}
        initialValues={{
          username: selectedUser?.username || '',
          email: selectedUser?.email || '',
          fullName: selectedUser?.fullName || '',
          isActive: selectedUser?.isActive ?? true,
          password: '', // Password is optional for edit
        }}
      >
        {(form) => (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Username <span style={{ color: 'red' }}>*</span>
              </label>
              <Controller
                name="username"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter username"
                    disabled
                    status={form.formState.errors.username ? 'error' : ''}
                  />
                )}
              />
              {form.formState.errors.username && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {form.formState.errors.username.message}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Email <span style={{ color: 'red' }}>*</span>
              </label>
              <Controller
                name="email"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter email"
                    type="email"
                    status={form.formState.errors.email ? 'error' : ''}
                  />
                )}
              />
              {form.formState.errors.email && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {form.formState.errors.email.message}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Full Name <span style={{ color: 'red' }}>*</span>
              </label>
              <Controller
                name="fullName"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter full name"
                    status={form.formState.errors.fullName ? 'error' : ''}
                  />
                )}
              />
              {form.formState.errors.fullName && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {form.formState.errors.fullName.message}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Status
              </label>
              <Controller
                name="isActive"
                control={form.control}
                render={({ field }) => (
                  <Select
                    {...field}
                    style={{ width: '100%' }}
                  >
                    <Select.Option value={true}>Active</Select.Option>
                    <Select.Option value={false}>Inactive</Select.Option>
                  </Select>
                )}
              />
            </div>
          </Space>
        )}
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteModal.isOpen}
        title="Xóa người dùng"
        content={`Bạn có chắc chắn muốn xóa người dùng "${selectedUser?.username}"? Hành động này không thể hoàn tác.`}
        onConfirm={handleDelete}
        onCancel={() => {
          deleteModal.close();
          setSelectedUser(null);
        }}
        okText="Xóa"
        cancelText="Hủy"
        okType="danger"
      />
    </div>
  );
}

