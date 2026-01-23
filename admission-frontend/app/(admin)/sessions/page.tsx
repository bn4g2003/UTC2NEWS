'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Space, Input, Select, Tag, DatePicker, InputNumber, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { Controller } from 'react-hook-form';
import dayjs from 'dayjs';
import { DataGrid } from '@/components/admin/DataGrid';
import { FormModal } from '@/components/admin/FormModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { usePagination } from '@/hooks/usePagination';
import { useModal } from '@/hooks/useModal';
import { ProgramsService } from '@/api/services/ProgramsService';
import type { CreateSessionDto } from '@/api/models/CreateSessionDto';
import type { UpdateSessionDto } from '@/api/models/UpdateSessionDto';
import { createSessionSchema, updateSessionSchema, type CreateSessionFormData, type UpdateSessionFormData } from './schema';
import type { Column, DataGridAction } from '@/components/admin/DataGrid/types';

interface Session {
  id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const pagination = usePagination(10);
  const createModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();

  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  // Fetch sessions from API (Requirement 11.1)
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await ProgramsService.programControllerFindAllSessions();

      let filteredSessions = response.data || response || [];

      // Apply status filter
      if (statusFilter !== 'all') {
        filteredSessions = filteredSessions.filter((session: Session) =>
          session.status === statusFilter
        );
      }

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredSessions = filteredSessions.filter((session: Session) =>
          session.name.toLowerCase().includes(query) ||
          session.year.toString().includes(query)
        );
      }

      setSessions(filteredSessions);
      pagination.setTotal(filteredSessions.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Failed to fetch sessions');
      setError(errorMessage);
      message.error('Failed to load sessions');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  // Load sessions on mount and when dependencies change
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Handle create session (Requirement 11.2)
  const handleCreate = async (data: CreateSessionFormData) => {
    try {
      // Convert to API DTO format
      const dto: CreateSessionDto = {
        name: data.name,
        year: data.year,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status as CreateSessionDto.status,
      };

      await ProgramsService.programControllerCreateSession(dto);
      message.success('Session created successfully');
      fetchSessions();
      createModal.close();
    } catch (err: any) {
      let errorMessage = 'Failed to create session';

      // Handle specific error cases
      if (err.status === 403) {
        errorMessage = 'You do not have permission to create sessions';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      message.error(errorMessage);
      throw err;
    }
  };

  // Handle edit session (Requirement 11.3)
  const handleEdit = async (data: UpdateSessionFormData) => {
    if (!selectedSession) return;

    try {
      // Convert to API DTO format
      const dto: UpdateSessionDto = {
        name: data.name,
        year: data.year,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status as UpdateSessionDto.status | undefined,
      };

      await ProgramsService.programControllerUpdateSession(selectedSession.id, dto);
      message.success('Session updated successfully');
      fetchSessions();
      editModal.close();
      setSelectedSession(null);
    } catch (err: any) {
      let errorMessage = 'Failed to update session';

      // Handle specific error cases
      if (err.status === 404) {
        errorMessage = 'Session not found';
      } else if (err.status === 403) {
        errorMessage = 'You do not have permission to update sessions';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      message.error(errorMessage);
      throw err;
    }
  };

  // Handle delete session (Requirement 11.5, 11.6)
  const handleDelete = async () => {
    if (!selectedSession) return;

    try {
      await ProgramsService.programControllerDeleteSession(selectedSession.id);
      message.success('Session deleted successfully');
      fetchSessions();
      deleteModal.close();
      setSelectedSession(null);
    } catch (err: any) {
      let errorMessage = 'Failed to delete session';

      // Handle specific error cases (Requirement 11.6)
      if (err.status === 409) {
        errorMessage = `Cannot delete session "${selectedSession.name}" because it has associated students`;
      } else if (err.status === 404) {
        errorMessage = 'Session not found';
      } else if (err.status === 403) {
        errorMessage = 'You do not have permission to delete sessions';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      message.error(errorMessage);
    }
  };

  // Open edit modal with session data
  const openEditModal = (session: Session) => {
    setSelectedSession(session);
    editModal.open();
  };

  // Open delete confirmation
  const openDeleteModal = (session: Session) => {
    setSelectedSession(session);
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

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'blue';
      case 'active':
        return 'green';
      case 'closed':
        return 'red';
      default:
        return 'default';
    }
  };

  // Define table columns (Requirement 11.1)
  const columns: Column<Session>[] = [
    {
      key: 'name',
      title: 'Session Name',
      dataIndex: 'name',
      sortable: true,
      render: (text, record) => (
        <a
          onClick={(e) => {
            e.preventDefault();
            router.push(`/sessions/${record.id}`);
          }}
          className="text-blue-600 hover:underline font-medium cursor-pointer"
        >
          {text}
        </a>
      ),
    },
    {
      key: 'year',
      title: 'Year',
      dataIndex: 'year',
      sortable: true,
      width: '100px',
    },
    {
      key: 'startDate',
      title: 'Start Date',
      dataIndex: 'startDate',
      render: (value: string) => new Date(value).toLocaleDateString(),
      width: '120px',
    },
    {
      key: 'endDate',
      title: 'End Date',
      dataIndex: 'endDate',
      render: (value: string) => new Date(value).toLocaleDateString(),
      width: '120px',
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'status',
      render: (value: string) => (
        <Tag color={getStatusColor(value)}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Tag>
      ),
      width: '100px',
    },
    {
      key: 'createdAt',
      title: 'Created At',
      dataIndex: 'createdAt',
      render: (value: string) => new Date(value).toLocaleDateString(),
      width: '120px',
    },
  ];

  // Define row actions
  const actions: DataGridAction<Session>[] = [
    {
      key: 'details',
      label: 'Manage',
      icon: <SearchOutlined />, // Using SearchOutlined as a generic "view details" icon as requested
      onClick: (session) => router.push(`/sessions/${session.id}`),
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: openEditModal,
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
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Sessions Management</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={createModal.open}
        >
          Add Session
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Space style={{ marginBottom: '16px', width: '100%' }} size="middle">
        <Input
          placeholder="Search by name or year"
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
        />
        <Select
          placeholder="Filter by status"
          style={{ width: 150 }}
          value={statusFilter}
          onChange={handleStatusFilterChange}
        >
          <Select.Option value="all">All Status</Select.Option>
          <Select.Option value="upcoming">Upcoming</Select.Option>
          <Select.Option value="active">Active</Select.Option>
          <Select.Option value="closed">Closed</Select.Option>
        </Select>
      </Space>

      {/* Sessions DataGrid */}
      <DataGrid
        columns={columns}
        data={sessions}
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

      {/* Create Session Modal */}
      <FormModal
        open={createModal.isOpen}
        title="Create Session"
        schema={createSessionSchema}
        onClose={createModal.close}
        onSubmit={handleCreate}
        initialValues={{
          name: '',
          year: new Date().getFullYear(),
          startDate: '',
          endDate: '',
          status: 'upcoming' as const,
        }}
        width={600}
      >
        {(form) => (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Session Name <span style={{ color: 'red' }}>*</span>
              </label>
              <Controller
                name="name"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter session name (e.g., Admission 2024)"
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
                Year <span style={{ color: 'red' }}>*</span>
              </label>
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Enter year"
                min={2000}
                max={2100}
                onChange={(value) => form.setValue('year', value || 2024)}
                status={form.formState.errors.year ? 'error' : ''}
              />
              {form.formState.errors.year && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {form.formState.errors.year.message}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Start Date <span style={{ color: 'red' }}>*</span>
              </label>
              <DatePicker
                style={{ width: '100%' }}
                placeholder="Select start date"
                onChange={(date) => form.setValue('startDate', date ? date.format('YYYY-MM-DD') : '')}
                status={form.formState.errors.startDate ? 'error' : ''}
              />
              {form.formState.errors.startDate && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {form.formState.errors.startDate.message}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                End Date <span style={{ color: 'red' }}>*</span>
              </label>
              <DatePicker
                style={{ width: '100%' }}
                placeholder="Select end date"
                onChange={(date) => form.setValue('endDate', date ? date.format('YYYY-MM-DD') : '')}
                status={form.formState.errors.endDate ? 'error' : ''}
              />
              {form.formState.errors.endDate && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {form.formState.errors.endDate.message}
                </div>
              )}
              <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                End date must be after start date
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Status
              </label>
              <Select
                style={{ width: '100%' }}
                defaultValue={"upcoming" as CreateSessionDto.status}
                onChange={(value: CreateSessionDto.status) => form.setValue('status', value)}
              >
                <Select.Option value={"upcoming" as CreateSessionDto.status}>Upcoming</Select.Option>
                <Select.Option value={"active" as CreateSessionDto.status}>Active</Select.Option>
                <Select.Option value={"closed" as CreateSessionDto.status}>Closed</Select.Option>
              </Select>
            </div>
          </Space>
        )}
      </FormModal>

      {/* Edit Session Modal */}
      <FormModal
        open={editModal.isOpen}
        title="Edit Session"
        schema={updateSessionSchema}
        onClose={() => {
          editModal.close();
          setSelectedSession(null);
        }}
        onSubmit={handleEdit}
        initialValues={{
          name: selectedSession?.name || '',
          year: selectedSession?.year ?? new Date().getFullYear(),
          startDate: selectedSession?.startDate || '',
          endDate: selectedSession?.endDate || '',
          status: selectedSession?.status || 'upcoming' as const,
        }}
        width={600}
      >
        {(form) => (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Session Name <span style={{ color: 'red' }}>*</span>
              </label>
              <Controller
                name="name"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter session name"
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
                Year <span style={{ color: 'red' }}>*</span>
              </label>
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Enter year"
                min={2000}
                max={2100}
                value={form.watch('year')}
                onChange={(value) => form.setValue('year', value || 2024)}
                status={form.formState.errors.year ? 'error' : ''}
              />
              {form.formState.errors.year && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {form.formState.errors.year.message}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Start Date <span style={{ color: 'red' }}>*</span>
              </label>
              <DatePicker
                style={{ width: '100%' }}
                placeholder="Select start date"
                value={form.watch('startDate') ? dayjs(form.watch('startDate')) : null}
                onChange={(date) => form.setValue('startDate', date ? date.format('YYYY-MM-DD') : '')}
                status={form.formState.errors.startDate ? 'error' : ''}
              />
              {form.formState.errors.startDate && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {form.formState.errors.startDate.message}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                End Date <span style={{ color: 'red' }}>*</span>
              </label>
              <DatePicker
                style={{ width: '100%' }}
                placeholder="Select end date"
                value={form.watch('endDate') ? dayjs(form.watch('endDate')) : null}
                onChange={(date) => form.setValue('endDate', date ? date.format('YYYY-MM-DD') : '')}
                status={form.formState.errors.endDate ? 'error' : ''}
              />
              {form.formState.errors.endDate && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {form.formState.errors.endDate.message}
                </div>
              )}
              <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                End date must be after start date
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Status
              </label>
              <Select
                style={{ width: '100%' }}
                value={form.watch('status') as UpdateSessionDto.status | undefined}
                onChange={(value: UpdateSessionDto.status) => form.setValue('status', value)}
              >
                <Select.Option value={"upcoming" as UpdateSessionDto.status}>Upcoming</Select.Option>
                <Select.Option value={"active" as UpdateSessionDto.status}>Active</Select.Option>
                <Select.Option value={"closed" as UpdateSessionDto.status}>Closed</Select.Option>
              </Select>
            </div>
          </Space>
        )}
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteModal.isOpen}
        title="Delete Session"
        content={`Are you sure you want to delete session "${selectedSession?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => {
          deleteModal.close();
          setSelectedSession(null);
        }}
        okText="Delete"
        cancelText="Cancel"
        okType="danger"
      />
    </div>
  );
}

