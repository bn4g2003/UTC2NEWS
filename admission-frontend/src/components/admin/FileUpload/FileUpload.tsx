'use client';

import { useState, useEffect } from 'react';
import { Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload';
import { apiClient } from '@/lib/api-client';

export interface UploadedFile {
    name: string;
    url: string;
}

interface FileUploadProps {
    value?: UploadedFile[];
    onChange?: (files: UploadedFile[]) => void;
    disabled?: boolean;
    maxCount?: number;
}

export function FileUpload({ value = [], onChange, disabled, maxCount = 10 }: FileUploadProps) {
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    useEffect(() => {
        // Stop if any file is currently uploading to prevent overwriting local state
        const isUploading = fileList.some(f => f.status === 'uploading');
        if (isUploading) return;

        const mappedFiles: UploadFile[] = value.map((file, index) => ({
            uid: `-${index}`,
            name: file.name,
            status: 'done',
            url: file.url,
        }));

        // Compare URLs to avoid unnecessary updates
        const currentUrls = fileList.filter(f => f.status === 'done').map(f => f.url);
        const newUrls = mappedFiles.map(f => f.url);

        if (JSON.stringify(currentUrls) !== JSON.stringify(newUrls)) {
            setFileList(mappedFiles);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const customUpload = async ({ file, onSuccess, onError }: any) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await apiClient.post('/api/cms/media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (onSuccess) {
                onSuccess(response.data, file);
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            const errorMessage = error.response?.data?.message || 'Upload failed';
            message.error(errorMessage);
            if (onError) onError(error);
        }
    };

    const handleChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
        setFileList(newFileList);

        // Only trigger onChange if we have a valid state change that parent needs to know
        // We need to filter out files that are still uploading or failed
        // But we also need to keep them in the local fileList display

        const validFiles = newFileList
            .filter(f => f.status === 'done')
            .map(f => ({
                name: f.name,
                url: f.response?.storagePath || f.response?.url || f.url || '',
            }))
            .filter(f => f.url);

        if (onChange) {
            onChange(validFiles);
        }
    };

    return (
        <Upload
            customRequest={customUpload}
            fileList={fileList}
            onChange={handleChange}
            disabled={disabled}
            maxCount={maxCount}
            multiple
        >
            <Button icon={<UploadOutlined />}>Tải lên tài liệu</Button>
        </Upload>
    );
}
