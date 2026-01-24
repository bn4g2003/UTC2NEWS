'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Space, Input, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { Controller } from 'react-hook-form';
import { DataGrid } from '@/components/admin/DataGrid';
import { FormModal } from '@/components/admin/FormModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { usePagination } from '@/hooks/usePagination';
import { useModal } from '@/hooks/useModal';
import { CmsService } from '@/api/services/CmsService';
import { 
  createCategorySchema, 
  updateCategorySchema, 
  generateSlug,
  type CreateCategoryFormData, 
  type UpdateCategoryFormData 
} from './schema';
import type { Column, DataGridAction } from '@/components/admin/DataGrid/types';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    posts: number;
  };
}

type ViewMode = 'create' | 'edit';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const pagination = usePagination(10);
  const formModal = useModal();
  const deleteModal = useModal();
  
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('create');

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await CmsService.cmsControllerFindAllCategories();
      
      let filteredCategories = response || [];
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredCategories = filteredCategories.filter((category: Category) =>
          category.name.toLowerCase().includes(query) ||
          category.slug.toLowerCase().includes(query) ||
          (category.description && category.description.toLowerCase().includes(query))
        );
      }
      
      setCategories(filteredCategories);
      pagination.setTotal(filteredCategories.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Failed to fetch categories');
      setError(errorMessage);
      message.error('Failed to load categories');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle create category
  const handleCreate = async (data: CreateCategoryFormData) => {
    try {
      // Remove empty optional fields
      const cleanData = {
        ...data,
        description: data.description || undefined,
      };
      
      await CmsService.cmsControllerCreateCategory(cleanData);
      message.success('Tạo danh mục thành công');
      fetchCategories();
      formModal.close();
      setSelectedCategory(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tạo danh mục';
      message.error(errorMessage);
      throw err;
    }
  };

  // Handle edit category
  const handleEdit = async (data: UpdateCategoryFormData) => {
    if (!selectedCategory) return;
    
    try {
      // Remove empty optional fields
      const cleanData = {
        ...data,
        description: data.description || undefined,
      };
      
      await CmsService.cmsControllerUpdateCategory(selectedCategory.id, cleanData);
      message.success('Cập nhật danh mục thành công');
      fetchCategories();
      formModal.close();
      setSelectedCategory(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể cập nhật danh mục';
      message.error(errorMessage);
      throw err;
    }
  };

  // Handle delete category
  const handleDelete = async () => {
    if (!selectedCategory) return;
    
    // Check if category has posts
    if (selectedCategory._count && selectedCategory._count.posts > 0) {
      message.error(`Không thể xóa danh mục "${selectedCategory.name}" vì có ${selectedCategory._count.posts} bài viết liên quan`);
      deleteModal.close();
      setSelectedCategory(null);
      return;
    }
    
    try {
      await CmsService.cmsControllerDeleteCategory(selectedCategory.id);
      message.success('Xóa danh mục thành công');
      fetchCategories();
      deleteModal.close();
      setSelectedCategory(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể xóa danh mục';
      message.error(errorMessage);
    }
  };

  // Open create modal
  const openCreateModal = () => {
    setViewMode('create');
    setSelectedCategory(null);
    formModal.open();
  };

  // Open edit modal with category data
  const openEditModal = (category: Category) => {
    setViewMode('edit');
    setSelectedCategory(category);
    formModal.open();
  };

  // Open delete confirmation
  const openDeleteModal = (category: Category) => {
    setSelectedCategory(category);
    deleteModal.open();
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    pagination.goToPage(1);
  };

  // Define table columns
  const columns: Column<Category>[] = [
    {
      key: 'name',
      title: 'Tên',
      dataIndex: 'name',
      sortable: true,
      render: (value: string) => (
        <div style={{ fontWeight: 500 }}>{value}</div>
      ),
    },
    {
      key: 'slug',
      title: 'Slug',
      dataIndex: 'slug',
      render: (value: string) => (
        <code style={{ 
          padding: '2px 6px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '3px',
          fontSize: '12px'
        }}>
          {value}
        </code>
      ),
    },
    {
      key: 'description',
      title: 'Mô tả',
      dataIndex: 'description',
      render: (value: string | undefined) => (
        <div style={{ color: '#666', fontSize: '13px' }}>
          {value ? (value.length > 100 ? `${value.substring(0, 100)}...` : value) : '-'}
        </div>
      ),
    },
    {
      key: 'posts',
      title: 'Bài viết',
      dataIndex: '_count',
      render: (count: Category['_count']) => count?.posts || 0,
    },
    {
      key: 'updatedAt',
      title: 'Cập nhật lần cuối',
      dataIndex: 'updatedAt',
      render: (value: string) => new Date(value).toLocaleDateString('vi-VN'),
    },
  ];

  // Define row actions
  const actions: DataGridAction<Category>[] = [
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

  // Render form fields
  const renderFormFields = (form: any) => {
    return (
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Name <span style={{ color: 'red' }}>*</span>
          </label>
          <Controller
            name="name"
            control={form.control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Enter category name"
                status={form.formState.errors.name ? 'error' : ''}
                onChange={(e) => {
                  field.onChange(e);
                  // Auto-generate slug from name
                  if (viewMode === 'create') {
                    form.setValue('slug', generateSlug(e.target.value));
                  }
                }}
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
            Slug <span style={{ color: 'red' }}>*</span>
          </label>
          <Controller
            name="slug"
            control={form.control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="url-friendly-slug"
                status={form.formState.errors.slug ? 'error' : ''}
              />
            )}
          />
          {form.formState.errors.slug && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {form.formState.errors.slug.message}
            </div>
          )}
          <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
            URL-friendly identifier (lowercase, hyphens only)
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
                placeholder="Brief description of the category"
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
      </Space>
    );
  };

  // Get modal title based on view mode
  const getModalTitle = () => {
    return viewMode === 'create' ? 'Thêm danh mục' : 'Sửa danh mục';
  };

  // Get initial values for form
  const getInitialValues = () => {
    if (viewMode === 'create') {
      return {
        name: '',
        slug: '',
        description: '',
      };
    }
    
    return {
      name: selectedCategory?.name || '',
      slug: selectedCategory?.slug || '',
      description: selectedCategory?.description || '',
    };
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Quản lý Danh mục</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
        >
          Thêm danh mục
        </Button>
      </div>

      {/* Search Bar */}
      <Space style={{ marginBottom: '16px', width: '100%' }} size="middle">
        <Input
          placeholder="Tìm kiếm theo tên, slug hoặc mô tả"
          prefix={<SearchOutlined />}
          style={{ width: 400 }}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
        />
      </Space>

      {/* Categories DataGrid */}
      <DataGrid
        columns={columns}
        data={categories}
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

      {/* Create/Edit Category Modal */}
      <FormModal
        open={formModal.isOpen}
        title={getModalTitle()}
        schema={viewMode === 'create' ? createCategorySchema : (updateCategorySchema as any)}
        onClose={() => {
          formModal.close();
          setSelectedCategory(null);
        }}
        onSubmit={viewMode === 'create' ? handleCreate : (handleEdit as any)}
        initialValues={getInitialValues() as any}
        width={600}
        okText={viewMode === 'create' ? 'Create' : 'Update'}
        cancelText="Cancel"
      >
        {renderFormFields}
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteModal.isOpen}
        title="Delete Category"
        content={
          selectedCategory?._count && selectedCategory._count.posts > 0
            ? `Cannot delete category "${selectedCategory?.name}" because it has ${selectedCategory._count.posts} associated post(s). Please remove or reassign the posts first.`
            : `Are you sure you want to delete category "${selectedCategory?.name}"? This action cannot be undone.`
        }
        onConfirm={handleDelete}
        onCancel={() => {
          deleteModal.close();
          setSelectedCategory(null);
        }}
        okText="Delete"
        cancelText="Cancel"
        okType="danger"
      />
    </div>
  );
}
