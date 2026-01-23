/**
 * Image Upload Component
 * Allows uploading featured images for posts
 * Validates Requirement 16.6
 */

'use client';

import { useState, useEffect } from 'react';
import { Upload, message, Image } from 'antd';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload';
import { apiClient } from '@/lib/api-client';

interface ImageUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  disabled?: boolean;
}

/**
 * ImageUpload component
 * Handles image upload to the CMS media endpoint
 */
export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(value);

  // Sync imageUrl with value prop when it changes
  useEffect(() => {
    setImageUrl(value);
  }, [value]);

  const handleChange = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      // Get the uploaded file URL from response
      // The backend returns a mediaFile object with storagePath field
      const response = info.file.response;
      const url = response?.storagePath || response?.url || response?.data?.url;
      if (url) {
        setImageUrl(url);
        setLoading(false);
        if (onChange) {
          onChange(url);
        }
        message.success('Image uploaded successfully');
      } else {
        setLoading(false);
        console.error('Response structure:', response);
        message.error('Failed to get image URL from response');
      }
    }
    if (info.file.status === 'error') {
      setLoading(false);
      const errorMsg = info.file.error?.message || 'Image upload failed';
      message.error(errorMsg);
    }
  };

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('Image must be smaller than 10MB!');
      return false;
    }
    return true;
  };

  const customUpload = async ({ file, onSuccess, onError }: any) => {
    try {
      // Create native browser FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // Use axios directly to upload with proper FormData
      const response = await apiClient.post('/api/cms/media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Upload failed';
      message.error(errorMessage);
      if (onError) {
        onError(error);
      }
    }
  };

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  return (
    <div>
      <Upload
        name="file"
        listType="picture-card"
        className="image-uploader"
        showUploadList={false}
        customRequest={customUpload}
        beforeUpload={beforeUpload}
        onChange={handleChange}
        disabled={disabled}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Featured"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            preview={false}
          />
        ) : (
          uploadButton
        )}
      </Upload>
      {imageUrl && (
        <div style={{ marginTop: '8px' }}>
          <a href={imageUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px' }}>
            View full image
          </a>
        </div>
      )}
    </div>
  );
}
