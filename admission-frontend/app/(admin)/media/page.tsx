'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Space, Input, Empty, Spin, Modal, Typography, message, Image, Upload } from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined, CopyOutlined, EyeOutlined, InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd/es/upload';
import { useModal } from '@/hooks/useModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { CmsService } from '@/api/services/CmsService';

const { Text } = Typography;
const { Dragger } = Upload;

interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedBy?: {
    id: string;
    fullName: string;
  };
  createdAt: string;
}

export default function MediaPage() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  
  const deleteModal = useModal();
  const detailsModal = useModal();
  const uploadModal = useModal();

  // Fetch media files from API
  const fetchMediaFiles = useCallback(async () => {
    setLoading(true);
    
    try {
      const response = await CmsService.cmsControllerFindAllMediaFiles();
      const files = response || [];
      setMediaFiles(files);
      setFilteredFiles(files);
    } catch (err) {
      console.error('Error fetching media files:', err);
      message.error('Failed to load media files');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load media files on mount
  useEffect(() => {
    fetchMediaFiles();
  }, [fetchMediaFiles]);

  // Handle search
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = mediaFiles.filter((file) =>
        file.originalName.toLowerCase().includes(query) ||
        file.filename.toLowerCase().includes(query)
      );
      setFilteredFiles(filtered);
    } else {
      setFilteredFiles(mediaFiles);
    }
  }, [searchQuery, mediaFiles]);

  // Handle delete media file
  const handleDelete = async () => {
    if (!selectedFile) return;
    
    try {
      await CmsService.cmsControllerDeleteMediaFile(selectedFile.id);
      message.success('Media file deleted successfully');
      fetchMediaFiles();
      deleteModal.close();
      setSelectedFile(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete media file';
      message.error(errorMessage);
    }
  };

  // Open delete confirmation
  const openDeleteModal = (file: MediaFile) => {
    setSelectedFile(file);
    deleteModal.open();
  };

  // Open file details
  const openDetailsModal = (file: MediaFile) => {
    setSelectedFile(file);
    detailsModal.open();
  };

  // Copy URL to clipboard
  const copyUrlToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    message.success('URL copied to clipboard');
  };

  // Handle file upload
  const handleUpload = async (file: File): Promise<boolean> => {
    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type)) {
      message.error('Invalid file type. Allowed: images (jpg, png, gif, webp) and documents (pdf, doc, xls)');
      return false;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      message.error('File size must be less than 10MB');
      return false;
    }

    return true;
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    beforeUpload: async (file) => {
      const isValid = await handleUpload(file);
      if (!isValid) {
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        setUploading(true);
        const response = await CmsService.cmsControllerUploadMedia({ file: file as File });
        
        if (onSuccess) {
          onSuccess(response);
        }
        
        message.success(`${(file as File).name} uploaded successfully`);
        
        // Refresh the media files list
        await fetchMediaFiles();
      } catch (error) {
        console.error('Upload error:', error);
        if (onError) {
          onError(error as Error);
        }
        message.error(`${(file as File).name} upload failed`);
      } finally {
        setUploading(false);
      }
    },
    showUploadList: true,
    onChange(info) {
      const { status } = info.file;
      if (status === 'done') {
        // File uploaded successfully
      } else if (status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Check if file is an image
  const isImage = (mimeType: string): boolean => {
    return mimeType.startsWith('image/');
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Media Library</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={uploadModal.open}
          loading={uploading}
        >
          Upload File
        </Button>
      </div>

      {/* Search Bar */}
      <Space style={{ marginBottom: '16px', width: '100%' }} size="middle">
        <Input
          placeholder="Search by filename"
          prefix={<SearchOutlined />}
          style={{ width: 400 }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
        />
      </Space>

      {/* Media Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : filteredFiles.length === 0 ? (
        <Empty
          description={searchQuery ? 'No files found' : 'No media files uploaded yet'}
          style={{ padding: '60px 0' }}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredFiles.map((file) => (
            <Card
              key={file.id}
              hoverable
              cover={
                isImage(file.mimeType) ? (
                  <div
                    style={{
                      height: '200px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f5f5f5',
                    }}
                  >
                    <img
                      alt={file.originalName}
                      src={file.thumbnailUrl || file.url}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      height: '200px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f5f5f5',
                      fontSize: '48px',
                      color: '#999',
                    }}
                  >
                    📄
                  </div>
                )
              }
              actions={[
                <EyeOutlined key="view" onClick={() => openDetailsModal(file)} />,
                <CopyOutlined key="copy" onClick={() => copyUrlToClipboard(file.url)} />,
                <DeleteOutlined key="delete" onClick={() => openDeleteModal(file)} />,
              ]}
            >
              <Card.Meta
                title={
                  <div
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={file.originalName}
                  >
                    {file.originalName}
                  </div>
                }
                description={
                  <div>
                    <div>{formatFileSize(file.size)}</div>
                    <div style={{ fontSize: '11px', color: '#999' }}>
                      {new Date(file.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                }
              />
            </Card>
          ))}
        </div>
      )}

      {/* File Details Modal */}
      <Modal
        open={detailsModal.isOpen}
        title="File Details"
        onCancel={() => {
          detailsModal.close();
          setSelectedFile(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            detailsModal.close();
            setSelectedFile(null);
          }}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {selectedFile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Preview */}
            {isImage(selectedFile.mimeType) && (
              <div style={{ textAlign: 'center' }}>
                <Image
                  src={selectedFile.url}
                  alt={selectedFile.originalName}
                  style={{ maxWidth: '100%', maxHeight: '400px' }}
                />
              </div>
            )}

            {/* File Information */}
            <div>
              <div style={{ marginBottom: '8px' }}>
                <Text strong>Filename:</Text>
                <div>{selectedFile.originalName}</div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <Text strong>File Type:</Text>
                <div>{selectedFile.mimeType}</div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <Text strong>File Size:</Text>
                <div>{formatFileSize(selectedFile.size)}</div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <Text strong>Uploaded:</Text>
                <div>{new Date(selectedFile.createdAt).toLocaleString()}</div>
              </div>
              {selectedFile.uploadedBy && (
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>Uploaded By:</Text>
                  <div>{selectedFile.uploadedBy.fullName}</div>
                </div>
              )}
              <div style={{ marginBottom: '8px' }}>
                <Text strong>URL:</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Input
                    value={selectedFile.url}
                    readOnly
                    style={{ flex: 1 }}
                  />
                  <Button
                    icon={<CopyOutlined />}
                    onClick={() => copyUrlToClipboard(selectedFile.url)}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Upload Modal */}
      <Modal
        open={uploadModal.isOpen}
        title="Upload Files"
        onCancel={uploadModal.close}
        footer={[
          <Button key="close" onClick={uploadModal.close}>
            Close
          </Button>,
        ]}
        width={600}
      >
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag files to this area to upload</p>
          <p className="ant-upload-hint">
            Support for images (jpg, png, gif, webp) and documents (pdf, doc, xls).
            Maximum file size: 10MB per file.
          </p>
        </Dragger>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteModal.isOpen}
        title="Delete Media File"
        content={`Are you sure you want to delete "${selectedFile?.originalName}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => {
          deleteModal.close();
          setSelectedFile(null);
        }}
        okText="Delete"
        cancelText="Cancel"
        okType="danger"
      />
    </div>
  );
}
