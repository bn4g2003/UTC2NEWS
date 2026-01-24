'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Space, Input, Select, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { Controller } from 'react-hook-form';
import { DataGrid } from '@/components/admin/DataGrid';
import { FormDrawer } from '@/components/admin/FormDrawer';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { usePagination } from '@/hooks/usePagination';
import { useModal } from '@/hooks/useModal';
import { CmsService } from '@/api/services/CmsService';
import {
  createPostSchema,
  updatePostSchema,
  generateSlug,
  PostStatus,
  type CreatePostFormData,
  type UpdatePostFormData
} from './schema';
import { FileUpload } from '@/components/admin/FileUpload/FileUpload';
import type { Column, DataGridAction } from '@/components/admin/DataGrid/types';

import { serializeAttachments, parseAttachments, stripAttachments } from '@/utils/post-attachments';



interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  status: 'draft' | 'published';
  categoryId?: string;
  category?: {
    id: string;
    name: string;
  };
  authorId?: string;
  author?: {
    id: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

type ViewMode = 'create' | 'edit';

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const pagination = usePagination(10);
  const formDrawer = useModal();
  const deleteModal = useModal();

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('create');

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await CmsService.cmsControllerFindAllCategories();
      setCategories(response || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  // Fetch posts from API
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await CmsService.cmsControllerFindAllPosts();

      let filteredPosts = response || [];

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredPosts = filteredPosts.filter((post: Post) =>
          post.title.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query) ||
          (post.excerpt && post.excerpt.toLowerCase().includes(query))
        );
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        filteredPosts = filteredPosts.filter((post: Post) => post.status === statusFilter);
      }

      // Apply category filter
      if (categoryFilter !== 'all') {
        filteredPosts = filteredPosts.filter((post: Post) => post.categoryId === categoryFilter);
      }

      setPosts(filteredPosts);
      pagination.setTotal(filteredPosts.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Failed to fetch posts');
      setError(errorMessage);
      message.error('Failed to load posts');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, categoryFilter]);

  // Load posts and categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Handle create post
  const handleCreate = async (data: CreatePostFormData) => {
    try {
      // Remove empty optional fields and cast to API type
      const cleanData = {
        title: data.title,
        slug: data.slug,
        content: data.content + serializeAttachments(data.attachments || []),
        categoryId: data.categoryId || undefined,
        excerpt: data.excerpt || undefined,
        featuredImage: data.featuredImage || undefined,
        status: data.status as any, // Cast to API enum type
        authorId: data.authorId,
      };

      await CmsService.cmsControllerCreatePost(cleanData);
      message.success('Tạo bài viết thành công');
      fetchPosts();
      formDrawer.close();
      setSelectedPost(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tạo bài viết';
      message.error(errorMessage);
      throw err;
    }
  };

  // Handle edit post
  const handleEdit = async (data: UpdatePostFormData) => {
    if (!selectedPost) return;

    try {
      // Remove empty optional fields and cast to API type
      const cleanData = {
        title: data.title,
        slug: data.slug,
        content: data.content + serializeAttachments(data.attachments || []),
        categoryId: data.categoryId || undefined,
        excerpt: data.excerpt || undefined,
        featuredImage: data.featuredImage || undefined,
        status: data.status as any, // Cast to API enum type
        authorId: data.authorId,
      };

      await CmsService.cmsControllerUpdatePost(selectedPost.id, cleanData);
      message.success('Cập nhật bài viết thành công');
      fetchPosts();
      formDrawer.close();
      setSelectedPost(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể cập nhật bài viết';
      message.error(errorMessage);
      throw err;
    }
  };

  // Handle delete post
  const handleDelete = async () => {
    if (!selectedPost) return;

    try {
      await CmsService.cmsControllerDeletePost(selectedPost.id);
      message.success('Xóa bài viết thành công');
      fetchPosts();
      deleteModal.close();
      setSelectedPost(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể xóa bài viết';
      message.error(errorMessage);
    }
  };

  // Open create drawer
  const openCreateDrawer = () => {
    setViewMode('create');
    setSelectedPost(null);
    formDrawer.open();
  };

  // Open edit drawer with post data
  const openEditDrawer = (post: Post) => {
    setViewMode('edit');
    setSelectedPost(post);
    formDrawer.open();
  };

  // Open delete confirmation
  const openDeleteModal = (post: Post) => {
    setSelectedPost(post);
    deleteModal.open();
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    pagination.goToPage(1);
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    pagination.goToPage(1);
  };

  // Handle category filter change
  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
    pagination.goToPage(1);
  };

  // Define table columns
  const columns: Column<Post>[] = [
    {
      key: 'title',
      title: 'Tiêu đề',
      dataIndex: 'title',
      sortable: true,
      render: (value: string, record: Post) => (
        <div>
          <div style={{ fontWeight: 500 }}>{value}</div>
          {record.excerpt && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {record.excerpt.substring(0, 100)}...
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      title: 'Danh mục',
      dataIndex: 'category',
      render: (category: Post['category']) => (
        category ? <Tag color="blue">{category.name}</Tag> : <Tag>Chưa phân loại</Tag>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (value: string) => (
        <Tag color={value === 'published' ? 'green' : 'orange'}>
          {value === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
        </Tag>
      ),
    },
    {
      key: 'author',
      title: 'Tác giả',
      dataIndex: 'author',
      render: (author: Post['author']) => author?.fullName || '-',
    },
    {
      key: 'publishedAt',
      title: 'Ngày xuất bản',
      dataIndex: 'publishedAt',
      render: (value: string | undefined) =>
        value ? new Date(value).toLocaleDateString('vi-VN') : '-',
    },
    {
      key: 'updatedAt',
      title: 'Cập nhật lần cuối',
      dataIndex: 'updatedAt',
      render: (value: string) => new Date(value).toLocaleDateString('vi-VN'),
    },
  ];

  // Define row actions
  const actions: DataGridAction<Post>[] = [
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

  // Render form fields
  const renderFormFields = (form: any) => {
    const watchTitle = form.watch('title');

    return (
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Title <span style={{ color: 'red' }}>*</span>
          </label>
          <Controller
            name="title"
            control={form.control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Enter post title"
                status={form.formState.errors.title ? 'error' : ''}
                onChange={(e) => {
                  field.onChange(e);
                  // Auto-generate slug from title
                  if (viewMode === 'create') {
                    form.setValue('slug', generateSlug(e.target.value));
                  }
                }}
              />
            )}
          />
          {form.formState.errors.title && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {form.formState.errors.title.message}
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
            Excerpt
          </label>
          <Controller
            name="excerpt"
            control={form.control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                placeholder="Brief summary of the post"
                rows={3}
                status={form.formState.errors.excerpt ? 'error' : ''}
              />
            )}
          />
          {form.formState.errors.excerpt && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {form.formState.errors.excerpt.message}
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Content <span style={{ color: 'red' }}>*</span>
          </label>
          <RichTextEditor
            value={form.watch('content')}
            onChange={(value) => form.setValue('content', value)}
            status={form.formState.errors.content ? 'error' : ''}
          />
          {form.formState.errors.content && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {form.formState.errors.content.message}
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Featured Image
          </label>
          <Controller
            name="featuredImage"
            control={form.control}
            render={({ field }) => (
              <ImageUpload
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {form.formState.errors.featuredImage && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {form.formState.errors.featuredImage.message}
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Tài liệu đính kèm (Attachments)
          </label>
          <Controller
            name="attachments"
            control={form.control}
            render={({ field }) => (
              <FileUpload
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
            Upload content like PDF, DOCX, etc.
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Category
          </label>
          <Select
            style={{ width: '100%' }}
            placeholder="Select category"
            value={form.watch('categoryId') || undefined}
            onChange={(value) => form.setValue('categoryId', value)}
            allowClear
          >
            {categories.map((category) => (
              <Select.Option key={category.id} value={category.id}>
                {category.name}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Status <span style={{ color: 'red' }}>*</span>
          </label>
          <Select
            style={{ width: '100%' }}
            value={form.watch('status')}
            onChange={(value) => form.setValue('status', value)}
          >
            <Select.Option value={PostStatus.DRAFT}>Draft</Select.Option>
            <Select.Option value={PostStatus.PUBLISHED}>Published</Select.Option>
          </Select>
        </div>
      </Space>
    );
  };

  // Get drawer title based on view mode
  const getDrawerTitle = () => {
    return viewMode === 'create' ? 'Thêm bài viết' : 'Sửa bài viết';
  };

  // Get initial values for form
  const getInitialValues = () => {
    if (viewMode === 'create') {
      return {
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        categoryId: '',
        featuredImage: '',
        status: PostStatus.DRAFT,
        attachments: [],
      };
    }

    return {
      title: selectedPost?.title || '',
      slug: selectedPost?.slug || '',
      content: stripAttachments(selectedPost?.content || ''),
      excerpt: selectedPost?.excerpt || '',
      categoryId: selectedPost?.categoryId || '',
      featuredImage: selectedPost?.featuredImage || '',
      status: selectedPost?.status || PostStatus.DRAFT,
      attachments: parseAttachments(selectedPost?.content || ''),
    };
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Quản lý Bài viết</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateDrawer}
        >
          Thêm bài viết
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Space style={{ marginBottom: '16px', width: '100%' }} size="middle">
        <Input
          placeholder="Tìm kiếm theo tiêu đề hoặc nội dung"
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
          <Select.Option value="draft">Bản nháp</Select.Option>
          <Select.Option value="published">Đã xuất bản</Select.Option>
        </Select>
        <Select
          placeholder="Lọc theo danh mục"
          style={{ width: 200 }}
          value={categoryFilter}
          onChange={handleCategoryFilterChange}
        >
          <Select.Option value="all">Tất cả danh mục</Select.Option>
          {categories.map((category) => (
            <Select.Option key={category.id} value={category.id}>
              {category.name}
            </Select.Option>
          ))}
        </Select>
      </Space>

      {/* Posts DataGrid */}
      <DataGrid
        columns={columns}
        data={posts}
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

      {/* Create/Edit Post Drawer */}
      <FormDrawer
        open={formDrawer.isOpen}
        title={getDrawerTitle()}
        schema={(viewMode === 'create' ? createPostSchema : updatePostSchema) as any}
        onClose={() => {
          formDrawer.close();
          setSelectedPost(null);
        }}
        onSubmit={viewMode === 'create' ? handleCreate : handleEdit}
        initialValues={getInitialValues()}
        width={800}
        okText={viewMode === 'create' ? 'Tạo' : 'Cập nhật'}
        cancelText="Hủy"
      >
        {renderFormFields}
      </FormDrawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteModal.isOpen}
        title="Xóa bài viết"
        content={`Bạn có chắc chắn muốn xóa bài viết "${selectedPost?.title}"? Hành động này không thể hoàn tác.`}
        onConfirm={handleDelete}
        onCancel={() => {
          deleteModal.close();
          setSelectedPost(null);
        }}
        okText="Xóa"
        cancelText="Hủy"
        okType="danger"
      />
    </div>
  );
}
