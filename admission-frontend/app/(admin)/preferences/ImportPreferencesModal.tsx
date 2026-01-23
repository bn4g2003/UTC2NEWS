'use client';

import React, { useState, useCallback } from 'react';
import {
    Modal,
    Upload,
    Button,
    Table,
    Alert,
    Progress,
    Space,
    Typography,
    Tag,
    Divider,
    message,
} from 'antd';
import {
    InboxOutlined,
    DownloadOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import * as XLSX from 'xlsx';

const { Dragger } = Upload;
const { Text, Title } = Typography;

interface ImportPreferencesModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    sessionId: string;
}

export default function ImportPreferencesModal({
    open,
    onClose,
    onSuccess,
    sessionId,
}: ImportPreferencesModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [isValidating, setIsValidating] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
    const [importResult, setImportResult] = useState<any>(null);

    const parseExcelFile = useCallback(
        async (file: File): Promise<any[]> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = e.target?.result;
                        const workbook = XLSX.read(data, { type: 'binary' });
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet);

                        const processed = jsonData.map((row: any, index) => {
                            // Normalize headers: lowercase and remove spaces/underscores
                            const normalizedRow: any = {};
                            Object.keys(row).forEach(key => {
                                const normalizedKey = key.toLowerCase().replace(/[\s_]/g, '');
                                normalizedRow[normalizedKey] = row[key];
                            });

                            let idCard = String(normalizedRow['idcard'] || normalizedRow['cmnd'] || normalizedRow['cccd'] || '').trim();
                            if (idCard && /^\d+$/.test(idCard) && idCard.length < 12) {
                                idCard = idCard.padStart(12, '0');
                            }

                            const majorCode = String(normalizedRow['majorcode'] || normalizedRow['mãngành'] || '').trim();
                            const priority = parseInt(normalizedRow['preferenceorder'] || normalizedRow['stt'] || normalizedRow['sốthứtự'] || normalizedRow['priority'] || '1');
                            const block = String(normalizedRow['block'] || normalizedRow['tổhợp'] || '').trim();
                            const method = String(normalizedRow['method'] || normalizedRow['phươngthức'] || 'entrance_exam').trim();

                            const isValid = !!(idCard && idCard.length === 12 && majorCode);
                            const errors = [];
                            if (!idCard) errors.push('Thiếu số CCCD');
                            else if (idCard.length !== 12) errors.push('Số CCCD phải có đúng 12 chữ số');
                            if (!majorCode) errors.push('Thiếu mã ngành');

                            return {
                                row: index + 2,
                                idCard,
                                majorCode,
                                priority: isNaN(priority) ? 1 : priority,
                                block,
                                method,
                                isValid,
                                errors,
                            };
                        });
                        resolve(processed);
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.readAsBinaryString(file);
            });
        },
        []
    );

    const handleFileUpload: UploadProps['customRequest'] = async (options) => {
        const { file } = options;
        setIsValidating(true);
        try {
            const records = await parseExcelFile(file as File);
            setFile(file as File);
            setPreviewData(records);
            setStep('preview');
        } catch (error) {
            message.error('Lỗi khi đọc file Excel');
        } finally {
            setIsValidating(false);
        }
    };

    const handleImport = async () => {
        if (!file || !sessionId) return;
        setIsImporting(true);
        setImportProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('sessionId', sessionId);

            const { apiClient } = await import('@/lib/api-client');
            const response = await apiClient.post('/api/import/preferences', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setImportResult(response.data);
            setStep('result');
            message.success('Import nguyện vọng hoàn tất');
            setTimeout(onSuccess, 1500);
        } catch (error: any) {
            message.error(`Lỗi import: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsImporting(false);
        }
    };

    const handleDownloadTemplate = () => {
        const data = [
            { 'ID Card': '001234567890', 'Major Code': 'CS01', 'Priority': 1, 'Method': 'entrance_exam' },
            { 'ID Card': '001234567890', 'Major Code': 'EE01', 'Priority': 2, 'Method': 'entrance_exam' },
        ];
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Preferences');
        XLSX.writeFile(workbook, 'preference-import-template.xlsx');
    };

    const validCount = previewData.filter(r => r.isValid).length;
    const invalidCount = previewData.length - validCount;

    return (
        <Modal
            title="Import Nguyện vọng từ Excel"
            open={open}
            onCancel={onClose}
            width={1000}
            footer={[
                step === 'preview' && (
                    <Button key="import" type="primary" onClick={handleImport} loading={isImporting} disabled={validCount === 0}>
                        Import {validCount} bản ghi
                    </Button>
                ),
                <Button key="close" onClick={onClose}>Đóng</Button>,
            ]}
        >
            {step === 'upload' && (
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Alert message="Hướng dẫn" description="Tải lên file Excel có 4 cột: CCCD, Mã ngành, Thứ tự NV, Phương thức (tùy chọn)." type="info" showIcon />
                    <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>Tải file mẫu</Button>
                    <Dragger customRequest={handleFileUpload} showUploadList={false}>
                        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                        <p className="ant-upload-text">Kéo thả hoặc nhấn để chọn file</p>
                    </Dragger>
                </Space>
            )}

            {step === 'preview' && (
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Title level={5}>Bản xem trước ({previewData.length} dòng)</Title>
                    <Table
                        dataSource={previewData}
                        columns={[
                            { title: 'Dòng', dataIndex: 'row', width: 70 },
                            { title: 'CCCD', dataIndex: 'idCard', width: 140 },
                            { title: 'Mã ngành', dataIndex: 'majorCode', width: 100 },
                            { title: 'Ưu tiên', dataIndex: 'priority', width: 80 },
                            { title: 'Tổ hợp', dataIndex: 'block', width: 80 },
                            { title: 'Phương thức', dataIndex: 'method', width: 130 },
                            { title: 'Trạng thái', width: 100, render: (_, r) => r.isValid ? <Tag color="success">Hợp lệ</Tag> : <Tag color="error">Lỗi</Tag> },
                            { title: 'Lỗi', dataIndex: 'errors', render: (errs) => errs.join(', ') },
                        ]}
                        size="small"
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: 800 }}
                    />
                </Space>
            )}

            {step === 'result' && importResult && (
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Alert
                        message="Kết quả Import"
                        description={
                            <div>
                                <p>Tổng số bản ghi: {importResult.totalRecords}</p>
                                <p>Thành công: <Text type="success" strong>{importResult.successCount}</Text></p>
                                <p>Thất bại: <Text type="danger" strong>{importResult.failureCount}</Text></p>
                                {importResult.errors && importResult.errors.length > 0 && (
                                    <div style={{ marginTop: '10px' }}>
                                        <Text strong>Chi tiết lỗi:</Text>
                                        <ul style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            {importResult.errors.map((err: any, idx: number) => (
                                                <li key={idx}>
                                                    {err.row > 0 ? `Dòng ${err.row}: ` : ''}{err.message}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        }
                        type={importResult.failureCount > 0 ? (importResult.successCount > 0 ? 'warning' : 'error') : 'success'}
                        showIcon
                    />
                </Space>
            )}
        </Modal>
    );
}
