'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Space, Input, Switch, InputNumber, message, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, MenuOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { Controller } from 'react-hook-form';
import { DataGrid } from '@/components/admin/DataGrid';
import { FormModal } from '@/components/admin/FormModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { usePagination } from '@/hooks/usePagination';
import { useModal } from '@/hooks/useModal';
import { CmsService } from '@/api/services/CmsService';
import { 
  createFaqSchema, 
  updateFaqSchema,
  type CreateFaqFormData, 
  type UpdateFaqFormData 
} from './schema';
import type { Column, DataGridAction } from '@/components/admin/DataGrid/types';

interface Faq {
  id: string;
  question: string;
  answer: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type ViewMode = 'create' | 'edit';

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const pagination = usePagination(10);
  const formModal = useModal();
  const deleteModal = useModal();
  
  const [selectedFaq, setSelectedFaq] = useState<Faq | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('create');

  // Fetch FAQs from API
  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await CmsService.cmsControllerFindAllFaqs();
      
      let filteredFaqs = response || [];
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredFaqs = filteredFaqs.filter((faq: Faq) =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query)
        );
      }
      
      // Sort by display order
      filteredFaqs.sort((a: Faq, b: Faq) => a.displayOrder - b.displayOrder);
      
      setFaqs(filteredFaqs);
      pagination.setTotal(filteredFaqs.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Failed to fetch FAQs');
      setError(errorMessage);
      message.error('Failed to load FAQs');
      console.error('Error fetching FAQs:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // Load FAQs on mount
  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  // Handle create FAQ
  const handleCreate = async (data: CreateFaqFormData) => {
    try {
      await CmsService.cmsControllerCreateFaq(data);
      message.success('FAQ created successfully');
      fetchFaqs();
      formModal.close();
      setSelectedFaq(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create FAQ';
      message.error(errorMessage);
      throw err;
    }
  };

  // Handle edit FAQ
  const handleEdit = async (data: UpdateFaqFormData) => {
    if (!selectedFaq) return;
    
    try {
      await CmsService.cmsControllerUpdateFaq(selectedFaq.id, data);
      message.success('FAQ updated successfully');
      fetchFaqs();
      formModal.close();
      setSelectedFaq(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update FAQ';
      message.error(errorMessage);
      throw err;
    }
  };

  // Handle delete FAQ
  const handleDelete = async () => {
    if (!selectedFaq) return;
    
    try {
      await CmsService.cmsControllerDeleteFaq(selectedFaq.id);
      message.success('FAQ deleted successfully');
      fetchFaqs();
      deleteModal.close();
      setSelectedFaq(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete FAQ';
      message.error(errorMessage);
    }
  };

  // Open create modal
  const openCreateModal = () => {
    setViewMode('create');
    setSelectedFaq(null);
    formModal.open();
  };

  // Open edit modal with FAQ data
  const openEditModal = (faq: Faq) => {
    setViewMode('edit');
    setSelectedFaq(faq);
    formModal.open();
  };

  // Open delete confirmation
  const openDeleteModal = (faq: Faq) => {
    setSelectedFaq(faq);
    deleteModal.open();
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    pagination.goToPage(1);
  };

  // Handle move up
  const handleMoveUp = async (faq: Faq) => {
    const currentIndex = faqs.findIndex(f => f.id === faq.id);
    if (currentIndex <= 0) return; // Already at the top
    
    const previousFaq = faqs[currentIndex - 1];
    
    try {
      // Swap display orders
      await Promise.all([
        CmsService.cmsControllerUpdateFaq(faq.id, { displayOrder: previousFaq.displayOrder }),
        CmsService.cmsControllerUpdateFaq(previousFaq.id, { displayOrder: faq.displayOrder }),
      ]);
      
      message.success('FAQ moved up successfully');
      fetchFaqs();
    } catch (err) {
      message.error('Failed to reorder FAQ');
      console.error('Error reordering FAQ:', err);
    }
  };

  // Handle move down
  const handleMoveDown = async (faq: Faq) => {
    const currentIndex = faqs.findIndex(f => f.id === faq.id);
    if (currentIndex >= faqs.length - 1) return; // Already at the bottom
    
    const nextFaq = faqs[currentIndex + 1];
    
    try {
      // Swap display orders
      await Promise.all([
        CmsService.cmsControllerUpdateFaq(faq.id, { displayOrder: nextFaq.displayOrder }),
        CmsService.cmsControllerUpdateFaq(nextFaq.id, { displayOrder: faq.displayOrder }),
      ]);
      
      message.success('FAQ moved down successfully');
      fetchFaqs();
    } catch (err) {
      message.error('Failed to reorder FAQ');
      console.error('Error reordering FAQ:', err);
    }
  };

  // Define table columns
  const columns: Column<Faq>[] = [
    {
      key: 'displayOrder',
      title: 'Order',
      dataIndex: 'displayOrder',
      sortable: true,
      width: '80px',
      render: (value: number) => (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          color: '#666',
          fontWeight: 500
        }}>
          <MenuOutlined style={{ fontSize: '12px' }} />
          {value}
        </div>
      ),
    },
    {
      key: 'reorder',
      title: 'Reorder',
      dataIndex: 'id',
      width: '100px',
      render: (_: string, record: Faq) => {
        const currentIndex = faqs.findIndex(f => f.id === record.id);
        const isFirst = currentIndex === 0;
        const isLast = currentIndex === faqs.length - 1;
        
        return (
          <Space size="small">
            <Tooltip title="Move up">
              <Button
                type="text"
                size="small"
                icon={<ArrowUpOutlined />}
                onClick={() => handleMoveUp(record)}
                disabled={isFirst}
                style={{ 
                  color: isFirst ? '#d9d9d9' : '#1890ff',
                  cursor: isFirst ? 'not-allowed' : 'pointer'
                }}
              />
            </Tooltip>
            <Tooltip title="Move down">
              <Button
                type="text"
                size="small"
                icon={<ArrowDownOutlined />}
                onClick={() => handleMoveDown(record)}
                disabled={isLast}
                style={{ 
                  color: isLast ? '#d9d9d9' : '#1890ff',
                  cursor: isLast ? 'not-allowed' : 'pointer'
                }}
              />
            </Tooltip>
          </Space>
        );
      },
    },
    {
      key: 'question',
      title: 'Question',
      dataIndex: 'question',
      sortable: true,
      render: (value: string) => (
        <div style={{ fontWeight: 500 }}>{value}</div>
      ),
    },
    {
      key: 'answer',
      title: 'Answer',
      dataIndex: 'answer',
      render: (value: string) => (
        <div style={{ color: '#666', fontSize: '13px' }}>
          {value.length > 150 ? `${value.substring(0, 150)}...` : value}
        </div>
      ),
    },
    {
      key: 'isActive',
      title: 'Status',
      dataIndex: 'isActive',
      width: '100px',
      render: (value: boolean) => (
        <span style={{ 
          padding: '4px 12px', 
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 500,
          backgroundColor: value ? '#f6ffed' : '#fff1f0',
          color: value ? '#52c41a' : '#ff4d4f',
          border: `1px solid ${value ? '#b7eb8f' : '#ffccc7'}`
        }}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      width: '150px',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  // Define row actions
  const actions: DataGridAction<Faq>[] = [
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

  // Render form fields
  const renderFormFields = (form: any) => {
    return (
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Question <span style={{ color: 'red' }}>*</span>
          </label>
          <Controller
            name="question"
            control={form.control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                placeholder="Enter FAQ question"
                rows={2}
                status={form.formState.errors.question ? 'error' : ''}
              />
            )}
          />
          {form.formState.errors.question && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {form.formState.errors.question.message}
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Answer <span style={{ color: 'red' }}>*</span>
          </label>
          <Controller
            name="answer"
            control={form.control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                placeholder="Enter FAQ answer"
                rows={6}
                status={form.formState.errors.answer ? 'error' : ''}
              />
            )}
          />
          {form.formState.errors.answer && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {form.formState.errors.answer.message}
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Display Order
          </label>
          <Controller
            name="displayOrder"
            control={form.control}
            render={({ field }) => (
              <InputNumber
                {...field}
                placeholder="0"
                min={0}
                style={{ width: '100%' }}
                status={form.formState.errors.displayOrder ? 'error' : ''}
                onChange={(value) => field.onChange(value || 0)}
              />
            )}
          />
          {form.formState.errors.displayOrder && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {form.formState.errors.displayOrder.message}
            </div>
          )}
          <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
            Lower numbers appear first in the list
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Active Status
          </label>
          <Switch
            checked={form.watch('isActive')}
            onChange={(checked) => form.setValue('isActive', checked)}
            checkedChildren="Active"
            unCheckedChildren="Inactive"
          />
          <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
            Only active FAQs will be displayed on the public website
          </div>
        </div>
      </Space>
    );
  };

  // Get modal title based on view mode
  const getModalTitle = () => {
    return viewMode === 'create' ? 'Create FAQ' : 'Edit FAQ';
  };

  // Get initial values for form
  const getInitialValues = () => {
    if (viewMode === 'create') {
      return {
        question: '',
        answer: '',
        displayOrder: 0,
        isActive: true,
      };
    }
    
    return {
      question: selectedFaq?.question || '',
      answer: selectedFaq?.answer || '',
      displayOrder: selectedFaq?.displayOrder || 0,
      isActive: selectedFaq?.isActive ?? true,
    };
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>FAQs Management</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
        >
          Add FAQ
        </Button>
      </div>

      {/* Search Bar */}
      <Space style={{ marginBottom: '16px', width: '100%' }} size="middle">
        <Input
          placeholder="Search by question or answer"
          prefix={<SearchOutlined />}
          style={{ width: 400 }}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
        />
      </Space>

      {/* FAQs DataGrid */}
      <DataGrid
        columns={columns}
        data={faqs}
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

      {/* Create/Edit FAQ Modal */}
      <FormModal
        open={formModal.isOpen}
        title={getModalTitle()}
        schema={viewMode === 'create' ? createFaqSchema : (updateFaqSchema as any)}
        onClose={() => {
          formModal.close();
          setSelectedFaq(null);
        }}
        onSubmit={viewMode === 'create' ? handleCreate : (handleEdit as any)}
        initialValues={getInitialValues() as any}
        width={700}
        okText={viewMode === 'create' ? 'Create' : 'Update'}
        cancelText="Cancel"
      >
        {renderFormFields}
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteModal.isOpen}
        title="Delete FAQ"
        content={`Are you sure you want to delete this FAQ? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => {
          deleteModal.close();
          setSelectedFaq(null);
        }}
        okText="Delete"
        cancelText="Cancel"
        okType="danger"
      />
    </div>
  );
}
