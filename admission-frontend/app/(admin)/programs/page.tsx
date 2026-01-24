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
import { ProgramsService } from '@/api/services/ProgramsService';
import { createProgramSchema, updateProgramSchema, type CreateProgramFormData, type UpdateProgramFormData } from './schema';
import type { Column, DataGridAction } from '@/components/admin/DataGrid/types';

interface Program {
  id: string;
  code: string;
  name: string;
  description?: string;
  subjectCombinations: Record<string, any>;
  isActive: boolean;
  quota?: number;
  currentEnrollment?: number;
  createdAt: string;
  updatedAt: string;
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const pagination = usePagination(10);
  const createModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();
  
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  // Fetch programs from API
  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ProgramsService.programControllerFindAllMajors(
        statusFilter !== 'all' ? statusFilter : undefined
      );
      
      let filteredPrograms = response.data || response || [];
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredPrograms = filteredPrograms.filter((program: Program) =>
          program.name.toLowerCase().includes(query) ||
          program.code.toLowerCase().includes(query) ||
          (program.description && program.description.toLowerCase().includes(query))
        );
      }
      
      setPrograms(filteredPrograms);
      pagination.setTotal(filteredPrograms.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Failed to fetch programs');
      setError(errorMessage);
      message.error('Failed to load programs');
      console.error('Error fetching programs:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  // Load programs on mount and when dependencies change
  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  // Handle create program
  const handleCreate = async (data: CreateProgramFormData) => {
    try {
      await ProgramsService.programControllerCreateMajor(data);
      message.success('Tạo ngành thành công');
      fetchPrograms();
      createModal.close();
    } catch (err: any) {
      let errorMessage = 'Không thể tạo ngành';
      
      // Handle specific error cases
      if (err.status === 409) {
        errorMessage = 'Mã ngành đã tồn tại';
      } else if (err.status === 403) {
        errorMessage = 'Bạn không có quyền tạo ngành';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      message.error(errorMessage);
      throw err;
    }
  };

  // Handle edit program
  const handleEdit = async (data: UpdateProgramFormData) => {
    if (!selectedProgram) return;
    
    try {
      await ProgramsService.programControllerUpdateMajor(selectedProgram.id, data);
      message.success('Cập nhật ngành thành công');
      fetchPrograms();
      editModal.close();
      setSelectedProgram(null);
    } catch (err: any) {
      let errorMessage = 'Không thể cập nhật ngành';
      
      // Handle specific error cases
      if (err.status === 404) {
        errorMessage = 'Không tìm thấy ngành';
      } else if (err.status === 403) {
        errorMessage = 'Bạn không có quyền cập nhật ngành';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      message.error(errorMessage);
      throw err;
    }
  };

  // Handle delete program
  const handleDelete = async () => {
    if (!selectedProgram) return;
    
    try {
      await ProgramsService.programControllerDeleteMajor(selectedProgram.id);
      message.success('Xóa ngành thành công');
      fetchPrograms();
      deleteModal.close();
      setSelectedProgram(null);
    } catch (err: any) {
      let errorMessage = 'Không thể xóa ngành';
      
      // Handle specific error cases (Requirement 10.6)
      if (err.status === 409) {
        errorMessage = `Không thể xóa ngành "${selectedProgram.name}" vì có thí sinh liên quan`;
      } else if (err.status === 404) {
        errorMessage = 'Không tìm thấy ngành';
      } else if (err.status === 403) {
        errorMessage = 'Bạn không có quyền xóa ngành';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      message.error(errorMessage);
    }
  };

  // Open edit modal with program data
  const openEditModal = (program: Program) => {
    setSelectedProgram(program);
    editModal.open();
  };

  // Open delete confirmation
  const openDeleteModal = (program: Program) => {
    setSelectedProgram(program);
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

  // Define table columns (Requirement 10.1, 10.7)
  const columns: Column<Program>[] = [
    {
      key: 'code',
      title: 'Mã ngành',
      dataIndex: 'code',
      sortable: true,
      width: '120px',
    },
    {
      key: 'name',
      title: 'Tên ngành',
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
      key: 'quota',
      title: 'Chỉ tiêu',
      dataIndex: 'quota',
      render: (value: number | undefined, record: Program) => {
        const quota = value || 0;
        const enrollment = record.currentEnrollment || 0;
        const percentage = quota > 0 ? Math.round((enrollment / quota) * 100) : 0;
        
        return (
          <div>
            <div>{`${enrollment} / ${quota}`}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {percentage}% đã tuyển
            </div>
          </div>
        );
      },
      width: '120px',
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
      width: '100px',
    },
    {
      key: 'createdAt',
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      render: (value: string) => new Date(value).toLocaleDateString('vi-VN'),
      width: '120px',
    },
  ];

  // Define row actions
  const actions: DataGridAction<Program>[] = [
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
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Quản lý Ngành học</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={createModal.open}
        >
          Thêm ngành
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Space style={{ marginBottom: '16px', width: '100%' }} size="middle">
        <Input
          placeholder="Tìm kiếm theo mã, tên hoặc mô tả"
          prefix={<SearchOutlined />}
          style={{ width: 350 }}
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
          <Select.Option value="true">Hoạt động</Select.Option>
          <Select.Option value="false">Không hoạt động</Select.Option>
        </Select>
      </Space>

      {/* Programs DataGrid */}
      <DataGrid
        columns={columns}
        data={programs}
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

      {/* Create Program Modal */}
      <FormModal
        open={createModal.isOpen}
        title="Thêm ngành"
        schema={createProgramSchema}
        onClose={createModal.close}
        onSubmit={handleCreate}
        initialValues={{
          code: '',
          name: '',
          description: '',
          subjectCombinations: {},
          isActive: true,
        }}
        width={600}
      >
        {(form) => (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Program Code <span style={{ color: 'red' }}>*</span>
              </label>
              <Controller
                name="code"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter program code (e.g., CS, EE, ME)"
                    style={{ textTransform: 'uppercase' }}
                    status={form.formState.errors.code ? 'error' : ''}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                )}
              />
              {form.formState.errors.code && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {form.formState.errors.code.message}
                </div>
              )}
              <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                Uppercase letters, numbers, underscores, or hyphens only
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Program Name <span style={{ color: 'red' }}>*</span>
              </label>
              <Controller
                name="name"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter program name"
                    status={form.formState.errors.name ? 'error' : ''}
                  />
                )}
              />
              {form.formState.errors.name && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {form.formState.errors.name.message}
                </div>
              )}
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
                    placeholder="Enter program description"
                    rows={4}
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
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Status
              </label>
              <Select
                style={{ width: '100%' }}
                defaultValue={true}
                onChange={(value) => form.setValue('isActive', value)}
              >
                <Select.Option value={true}>Active</Select.Option>
                <Select.Option value={false}>Inactive</Select.Option>
              </Select>
            </div>
          </Space>
        )}
      </FormModal>

      {/* Edit Program Modal */}
      <FormModal
        open={editModal.isOpen}
        title="Sửa ngành"
        schema={updateProgramSchema}
        onClose={() => {
          editModal.close();
          setSelectedProgram(null);
        }}
        onSubmit={handleEdit}
        initialValues={{
          code: selectedProgram?.code || '',
          name: selectedProgram?.name || '',
          description: selectedProgram?.description || '',
          subjectCombinations: selectedProgram?.subjectCombinations || {},
          isActive: selectedProgram?.isActive ?? true,
        }}
        width={600}
      >
        {(form) => (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Program Code <span style={{ color: 'red' }}>*</span>
              </label>
              <Controller
                name="code"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter program code"
                    disabled
                    style={{ textTransform: 'uppercase' }}
                    status={form.formState.errors.code ? 'error' : ''}
                  />
                )}
              />
              {form.formState.errors.code && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {form.formState.errors.code.message}
                </div>
              )}
              <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                Program code cannot be changed after creation
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Program Name <span style={{ color: 'red' }}>*</span>
              </label>
              <Controller
                name="name"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter program name"
                    status={form.formState.errors.name ? 'error' : ''}
                  />
                )}
              />
              {form.formState.errors.name && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {form.formState.errors.name.message}
                </div>
              )}
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
                    placeholder="Enter program description"
                    rows={4}
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
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Status
              </label>
              <Select
                style={{ width: '100%' }}
                value={form.watch('isActive')}
                onChange={(value) => form.setValue('isActive', value)}
              >
                <Select.Option value={true}>Active</Select.Option>
                <Select.Option value={false}>Inactive</Select.Option>
              </Select>
            </div>
          </Space>
        )}
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteModal.isOpen}
        title="Xóa ngành"
        content={`Bạn có chắc chắn muốn xóa ngành "${selectedProgram?.name}" (${selectedProgram?.code})? Hành động này không thể hoàn tác.`}
        onConfirm={handleDelete}
        onCancel={() => {
          deleteModal.close();
          setSelectedProgram(null);
        }}
        okText="Xóa"
        cancelText="Hủy"
        okType="danger"
      />
    </div>
  );
}

