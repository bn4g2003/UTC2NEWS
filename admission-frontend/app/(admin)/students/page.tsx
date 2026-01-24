'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Space, Input, Select, Tag, message, Descriptions, Modal, Divider, Table } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, ImportOutlined } from '@ant-design/icons';
import { Controller } from 'react-hook-form';
import { DataGrid } from '@/components/admin/DataGrid';
import { FormDrawer } from '@/components/admin/FormDrawer';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { usePagination } from '@/hooks/usePagination';
import { useModal } from '@/hooks/useModal';
import { StudentsService } from '@/api/services/StudentsService';
import { createStudentSchema, updateStudentSchema, type CreateStudentFormData, type UpdateStudentFormData } from './schema';
import type { Column, DataGridAction } from '@/components/admin/DataGrid/types';
import dynamic from 'next/dynamic';

import { useRouter } from 'next/navigation';

// Lazy load import component
const ImportStudentsModal = dynamic(() => import('./ImportStudentsModal'), { ssr: false });

interface Student {
  id: string;
  idCard: string;
  fullName: string;
  dateOfBirth: string;
  email?: string;
  phone?: string;
  address?: string;
  priorityPoints: number;
  createdAt: string;
  updatedAt: string;
}

type ViewMode = 'create' | 'edit' | 'view';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const pagination = usePagination(10);
  const formDrawer = useModal();
  const deleteModal = useModal();
  const importModal = useModal();
  const router = useRouter();

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('create');
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Load admission sessions
  useEffect(() => {
    const loadSessions = async () => {
      setLoadingSessions(true);
      try {
        const { ProgramsService } = await import('@/api/services/ProgramsService');
        const response = await ProgramsService.programControllerFindAllSessions();
        const sessionList = response.data || response || [];
        setSessions(sessionList);
        if (sessionList.length > 0) {
          setSelectedSessionId(sessionList[0].id);
        }
      } catch (error) {
        message.error('Không thể tải danh sách đợt tuyển sinh');
      } finally {
        setLoadingSessions(false);
      }
    };
    loadSessions();
  }, []);

  // Fetch students from API
  const fetchStudents = useCallback(async () => {
    if (!selectedSessionId) return;

    setLoading(true);
    setError(null);

    try {
      const pageNum = pagination.currentPage.toString();
      const pageSizeNum = pagination.pageSize.toString();

      const response = await StudentsService.studentControllerFindAllStudents(
        pageNum,
        pageSizeNum,
        searchQuery || '',
        selectedSessionId
      );

      if (response && response.data) {
        setStudents(response.data);
        pagination.setTotal(Number(response.total) || response.data.length);
      } else {
        setStudents([]);
        pagination.setTotal(0);
      }
    } catch (err) {
      console.error('Fetch students error:', err);
      const errorMessage = err instanceof Error ? err : new Error('Không thể tải danh sách thí sinh');
      setError(errorMessage);
      message.error(errorMessage.message);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.pageSize, searchQuery, selectedSessionId, pagination.setTotal]);

  // Load students on mount and when dependencies change
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Handle create student
  const handleCreate = async (data: any) => {
    try {
      await StudentsService.studentControllerCreateStudent({
        ...data,
        sessionId: selectedSessionId,
      });
      message.success('Tạo thí sinh thành công');
      fetchStudents();
      formDrawer.close();
      setSelectedStudent(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tạo thí sinh';
      message.error(errorMessage);
      throw err;
    }
  };

  // Handle edit student
  const handleEdit = async (data: any) => {
    if (!selectedStudent) return;

    try {
      await StudentsService.studentControllerUpdateStudent(selectedStudent.id, {
        ...data,
        sessionId: selectedSessionId,
      });
      message.success('Cập nhật thí sinh thành công');
      fetchStudents();
      formDrawer.close();
      setSelectedStudent(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể cập nhật thí sinh';
      message.error(errorMessage);
      throw err;
    }
  };

  // Handle delete student
  const handleDelete = async () => {
    if (!selectedStudent) return;

    try {
      // Call the real API - Note: Backend doesn't have delete endpoint yet
      // You may need to add this endpoint to the backend
      await fetch(`/api/students/${selectedStudent.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      message.success('Xóa thí sinh thành công');
      fetchStudents();
      deleteModal.close();
      setSelectedStudent(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể xóa thí sinh';
      message.error(errorMessage);
    }
  };

  // Open create drawer
  const openCreateDrawer = () => {
    setViewMode('create');
    setSelectedStudent(null);
    formDrawer.open();
  };

  // Open edit drawer with student data
  const openEditDrawer = (student: Student) => {
    setViewMode('edit');
    setSelectedStudent(student);
    formDrawer.open();
  };

  // Open view drawer with student data (read-only)
  // Open detail page
  const openDetailPage = (student: Student) => {
    router.push(`/students/${student.id}`);
  };

  // Open delete confirmation
  const openDeleteModal = (student: Student) => {
    setSelectedStudent(student);
    deleteModal.open();
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    pagination.goToPage(1); // Reset to first page on search
  };

  // Define table columns
  const columns: Column<Student>[] = [
    {
      key: 'idCard',
      title: 'CMND/CCCD',
      dataIndex: 'idCard',
      sortable: true,
    },
    {
      key: 'fullName',
      title: 'Họ và tên',
      dataIndex: 'fullName',
      sortable: true,
    },
    {
      key: 'dateOfBirth',
      title: 'Ngày sinh',
      dataIndex: 'dateOfBirth',
      render: (value: string) => new Date(value).toLocaleDateString('vi-VN'),
    },
    {
      key: 'email',
      title: 'Email',
      dataIndex: 'email',
      render: (value: string | undefined) => value || '-',
    },
    {
      key: 'phone',
      title: 'Số điện thoại',
      dataIndex: 'phone',
      render: (value: string | undefined) => value || '-',
    },
    {
      key: 'priorityPoints',
      title: 'Điểm ưu tiên',
      dataIndex: 'priorityPoints',
      render: (value: number) => (
        <Tag color={value > 0 ? 'blue' : 'default'}>
          {value}
        </Tag>
      ),
    },
  ];

  // Define row actions
  const actions: DataGridAction<Student>[] = [
    {
      key: 'view',
      label: 'Xem',
      icon: <EyeOutlined />,
      onClick: openDetailPage,
    },
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

  // Render form fields based on view mode
  const renderFormFields = (form: any) => {
    const isReadOnly = viewMode === 'view';

    return (
      <Space orientation="vertical" style={{ width: '100%' }} size="large">
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Số CMND/CCCD <span style={{ color: 'red' }}>*</span>
          </label>
          <Controller
            name="idCard"
            control={form.control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Nhập số CMND/CCCD (9 hoặc 12 số)"
                disabled={isReadOnly || viewMode === 'edit'}
                status={form.formState.errors.idCard ? 'error' : ''}
              />
            )}
          />
          {form.formState.errors.idCard && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {form.formState.errors.idCard.message}
            </div>
          )}
          {viewMode === 'edit' && (
            <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
              Số CMND/CCCD không thể thay đổi sau khi tạo
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Họ và tên <span style={{ color: 'red' }}>*</span>
          </label>
          <Controller
            name="fullName"
            control={form.control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Nhập họ và tên"
                disabled={isReadOnly}
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
            Ngày sinh <span style={{ color: 'red' }}>*</span>
          </label>
          <Controller
            name="dateOfBirth"
            control={form.control}
            render={({ field }) => (
              <Input
                {...field}
                type="date"
                placeholder="Chọn ngày sinh"
                disabled={isReadOnly}
                status={form.formState.errors.dateOfBirth ? 'error' : ''}
              />
            )}
          />
          {form.formState.errors.dateOfBirth && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {form.formState.errors.dateOfBirth.message}
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Email
          </label>
          <Controller
            name="email"
            control={form.control}
            render={({ field }) => (
              <Input
                {...field}
                type="email"
                placeholder="Nhập địa chỉ email"
                disabled={isReadOnly}
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
            Số điện thoại
          </label>
          <Controller
            name="phone"
            control={form.control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Nhập số điện thoại (10 số)"
                disabled={isReadOnly}
                status={form.formState.errors.phone ? 'error' : ''}
              />
            )}
          />
          {form.formState.errors.phone && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {form.formState.errors.phone.message}
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Địa chỉ
          </label>
          <Controller
            name="address"
            control={form.control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                placeholder="Nhập địa chỉ"
                rows={3}
                disabled={isReadOnly}
                status={form.formState.errors.address ? 'error' : ''}
              />
            )}
          />
          {form.formState.errors.address && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {form.formState.errors.address.message}
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Điểm ưu tiên
          </label>
          <Controller
            name="priorityPoints"
            control={form.control}
            render={({ field }) => (
              <Input
                {...field}
                type="number"
                min={0}
                max={3}
                placeholder="Nhập điểm ưu tiên (0-3)"
                disabled={isReadOnly}
                status={form.formState.errors.priorityPoints ? 'error' : ''}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
              />
            )}
          />
          {form.formState.errors.priorityPoints && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {form.formState.errors.priorityPoints.message}
            </div>
          )}
          <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
            Điểm ưu tiên từ 0 đến 3
          </div>
        </div>

        {isReadOnly && selectedStudent && (
          <div style={{ marginTop: '24px' }}>
            <Divider orientation={"left" as any}>Danh sách nguyện vọng</Divider>
            <Table
              dataSource={(selectedStudent as any).applications || []}
              pagination={false}
              size="small"
              rowKey="id"
              columns={[
                { title: 'NV', dataIndex: 'preferencePriority', width: 50 },
                { title: 'Ngành', render: (_: any, r: any) => `${r.major?.name} (${r.major?.code})` },
                { title: 'Phương thức', dataIndex: 'admissionMethod' },
                { title: 'Điểm XT', dataIndex: 'calculatedScore', render: (s: any) => s?.toFixed(2) || 'N/A' },
                {
                  title: 'Trạng thái',
                  dataIndex: 'admissionStatus',
                  render: (s: any) => <Tag color={s === 'admitted' ? 'green' : 'blue'}>{s}</Tag>
                },
              ]}
            />
          </div>
        )}
      </Space>
    );
  };

  // Get drawer title based on view mode
  const getDrawerTitle = () => {
    switch (viewMode) {
      case 'create':
        return 'Thêm thí sinh';
      case 'edit':
        return 'Sửa thông tin thí sinh';
      case 'view':
        return 'Chi tiết thí sinh';
      default:
        return 'Thí sinh';
    }
  };

  // Get initial values for form
  const getInitialValues = () => {
    if (viewMode === 'create') {
      return {
        idCard: '',
        fullName: '',
        dateOfBirth: '',
        email: '',
        phone: '',
        address: '',
        priorityPoints: 0,
      };
    }

    return {
      idCard: selectedStudent?.idCard || '',
      fullName: selectedStudent?.fullName || '',
      dateOfBirth: selectedStudent?.dateOfBirth ? selectedStudent.dateOfBirth.split('T')[0] : '', // Format for date input
      email: selectedStudent?.email || '',
      phone: selectedStudent?.phone || '',
      address: selectedStudent?.address || '',
      priorityPoints: selectedStudent?.priorityPoints || 0,
    };
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Quản lý Thí sinh</h1>
        <Space>
          <Select
            placeholder="Chọn đợt tuyển sinh"
            style={{ width: 250 }}
            value={selectedSessionId}
            onChange={setSelectedSessionId}
            loading={loadingSessions}
          >
            {sessions.map(s => (
              <Select.Option key={s.id} value={s.id}>{s.name} ({s.year})</Select.Option>
            ))}
          </Select>
          <Button
            icon={<ImportOutlined />}
            onClick={importModal.open}
            disabled={!selectedSessionId}
          >
            Import từ Excel
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateDrawer}
            disabled={!selectedSessionId}
          >
            Thêm thí sinh
          </Button>
        </Space>
      </div>

      {/* Search Bar */}
      <Space style={{ marginBottom: '16px', width: '100%' }} size="middle">
        <Input
          placeholder="Tìm kiếm theo CMND, họ tên hoặc email"
          prefix={<SearchOutlined />}
          style={{ width: 400 }}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
        />
      </Space>

      {/* Students DataGrid */}
      <DataGrid
        columns={columns}
        data={students}
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

      {/* Create/Edit/View Student Drawer */}
      {viewMode === 'create' && (
        <FormDrawer
          open={formDrawer.isOpen}
          title={getDrawerTitle()}
          schema={createStudentSchema}
          onClose={() => {
            formDrawer.close();
            setSelectedStudent(null);
          }}
          onSubmit={handleCreate}
          initialValues={getInitialValues()}
          width={720}
          okText="Tạo"
          cancelText="Hủy"
        >
          {renderFormFields}
        </FormDrawer>
      )}

      {(viewMode === 'edit' || viewMode === 'view') && (
        <FormDrawer
          open={formDrawer.isOpen}
          title={getDrawerTitle()}
          schema={updateStudentSchema}
          onClose={() => {
            formDrawer.close();
            setSelectedStudent(null);
          }}
          onSubmit={handleEdit}
          initialValues={getInitialValues()}
          width={720}
          okText={viewMode === 'view' ? 'Đóng' : 'Cập nhật'}
          cancelText={viewMode === 'view' ? undefined : 'Hủy'}
        >
          {renderFormFields}
        </FormDrawer>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteModal.isOpen}
        title="Xóa thí sinh"
        content={`Bạn có chắc chắn muốn xóa thí sinh "${selectedStudent?.fullName}" (CMND: ${selectedStudent?.idCard})? Hành động này không thể hoàn tác.`}
        onConfirm={handleDelete}
        onCancel={() => {
          deleteModal.close();
          setSelectedStudent(null);
        }}
        okText="Xóa"
        cancelText="Hủy"
        okType="danger"
      />

      {/* Import Students Modal */}
      {importModal.isOpen && (
        <ImportStudentsModal
          open={importModal.isOpen}
          onClose={importModal.close}
          onSuccess={() => {
            importModal.close();
            fetchStudents(); // Refresh student list after import
          }}
        />
      )}

    </div>
  );
}
