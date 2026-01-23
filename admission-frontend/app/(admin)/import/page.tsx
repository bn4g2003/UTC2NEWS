'use client';

/**
 * Import Page Component - DEPRECATED
 * 
 * @deprecated This standalone import page has been deprecated.
 * Import functionality is now integrated into the Students Management page.
 * Please use the "Import từ Excel" button in /students page instead.
 * 
 * This file is kept for backward compatibility and will be removed in future versions.
 */

import React, { useState, useCallback } from 'react';
import {
  Upload,
  Button,
  Card,
  Table,
  Alert,
  Progress,
  Space,
  Typography,
  Tag,
  Divider,
  message,
  Modal,
} from 'antd';
import {
  InboxOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  FileExcelOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { UploadProps } from 'antd';
import * as XLSX from 'xlsx';
import {
  importStudentSchema,
  type ImportStudentData,
  type ImportPreviewRecord,
  type ImportResult,
  EXCEL_HEADERS,
  EXCEL_COLUMN_MAP,
} from './schema';
import { ImportService } from '@/api/services/ImportService';

const { Dragger } = Upload;
const { Title, Text, Paragraph } = Typography;

/**
 * Import Page Component
 * Handles Excel file upload, validation, preview, and import execution
 */
export default function ImportPage() {
  const router = useRouter();
  
  // State management
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewRecord[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

  // Show deprecation notice
  React.useEffect(() => {
    Modal.info({
      title: 'Trang này đã được di chuyển',
      icon: <InfoCircleOutlined />,
      content: (
        <div>
          <p>Chức năng Import thí sinh đã được tích hợp vào trang Quản lý thí sinh.</p>
          <p>Bạn có muốn chuyển đến trang Quản lý thí sinh không?</p>
        </div>
      ),
      okText: 'Chuyển đến Quản lý thí sinh',
      cancelText: 'Ở lại trang này',
      onOk: () => {
        router.push('/students');
      },
    });
  }, [router]);

  /**
   * Validate Excel file format
   * Requirement 12.2
   */
  const validateFileFormat = (file: File): boolean => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    const validExtensions = ['.xlsx', '.xls'];
    
    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidType && !hasValidExtension) {
      message.error(
        'Invalid file format. Please upload an Excel file (.xlsx or .xls)'
      );
      return false;
    }

    return true;
  };

  /**
   * Parse Excel file and extract data
   * Requirement 12.4
   */
  const parseExcelFile = useCallback(
    async (file: File): Promise<ImportPreviewRecord[]> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            
            // Get first sheet
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              defval: '',
            }) as string[][];

            if (jsonData.length === 0) {
              reject(new Error('Excel file is empty'));
              return;
            }

            // Extract headers and map to schema fields
            const headers = jsonData[0].map((h) =>
              String(h).toLowerCase().trim()
            );
            const headerMap = new Map<number, keyof typeof EXCEL_HEADERS>();
            
            headers.forEach((header, index) => {
              const mappedField = EXCEL_COLUMN_MAP[header];
              if (mappedField) {
                headerMap.set(index, mappedField);
              }
            });

            // Validate required headers
            const requiredFields: (keyof typeof EXCEL_HEADERS)[] = [
              'idCard',
              'fullName',
              'dateOfBirth',
            ];
            const missingFields = requiredFields.filter(
              (field) => !Array.from(headerMap.values()).includes(field)
            );

            if (missingFields.length > 0) {
              reject(
                new Error(
                  `Missing required columns: ${missingFields
                    .map((f) => EXCEL_HEADERS[f])
                    .join(', ')}`
                )
              );
              return;
            }

            // Parse data rows
            const records: ImportPreviewRecord[] = [];
            
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];
              
              // Skip empty rows
              if (row.every((cell) => !cell || String(cell).trim() === '')) {
                continue;
              }

              // Map row data to schema fields
              const rowData: any = {};
              headerMap.forEach((field, colIndex) => {
                const value = row[colIndex];
                rowData[field] = value !== undefined ? String(value).trim() : '';
              });

              // Validate row data
              const validation = importStudentSchema.safeParse(rowData);
              
              records.push({
                row: i + 1,
                data: rowData,
                isValid: validation.success,
                errors: validation.success
                  ? []
                  : validation.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
              });
            }

            resolve(records);
          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };

        reader.readAsBinaryString(file);
      });
    },
    []
  );

  /**
   * Handle file upload
   * Requirements 12.1, 12.2, 12.3
   */
  const handleFileUpload: UploadProps['customRequest'] = async (options) => {
    const { file } = options;
    const uploadedFile = file as File;

    // Validate file format
    if (!validateFileFormat(uploadedFile)) {
      return;
    }

    setFile(uploadedFile);
    setIsValidating(true);
    setPreviewData([]);
    setImportResult(null);

    try {
      // Parse and validate Excel data
      const records = await parseExcelFile(uploadedFile);
      setPreviewData(records);
      
      const validCount = records.filter((r) => r.isValid).length;
      const invalidCount = records.length - validCount;
      
      if (invalidCount > 0) {
        message.warning(
          `File parsed successfully. ${validCount} valid records, ${invalidCount} invalid records.`
        );
      } else {
        message.success(`File parsed successfully. ${validCount} valid records.`);
      }
    } catch (error) {
      message.error(
        `Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setFile(null);
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Handle import confirmation and execution
   * Requirements 12.6, 12.7, 12.8
   */
  const handleImport = async () => {
    if (!file || !sessionId) {
      message.error('Please select a file and session before importing');
      return;
    }

    const validRecords = previewData.filter((r) => r.isValid);
    
    if (validRecords.length === 0) {
      message.error('No valid records to import');
      return;
    }

    Modal.confirm({
      title: 'Confirm Import',
      content: `Are you sure you want to import ${validRecords.length} student records?`,
      okText: 'Import',
      cancelText: 'Cancel',
      onOk: async () => {
        setIsImporting(true);
        setImportProgress(0);

        try {
          // Simulate progress
          const progressInterval = setInterval(() => {
            setImportProgress((prev) => Math.min(prev + 10, 90));
          }, 200);

          // Call API to import students
          const result = await ImportService.importControllerImportStudents({
            file: file,
            sessionId: sessionId,
          });

          clearInterval(progressInterval);
          setImportProgress(100);

          // Set import result
          const importResult: ImportResult = {
            totalRecords: previewData.length,
            successCount: result.successCount || validRecords.length,
            failureCount: result.failureCount || 0,
            errors: result.errors || [],
          };
          
          setImportResult(importResult);
          
          message.success(
            `Import completed! ${importResult.successCount} records imported successfully.`
          );
        } catch (error: any) {
          message.error(
            `Import failed: ${error.message || 'Unknown error'}`
          );
        } finally {
          setIsImporting(false);
        }
      },
    });
  };

  /**
   * Download error report
   * Requirement 12.9
   */
  const handleDownloadErrorReport = () => {
    const invalidRecords = previewData.filter((r) => !r.isValid);
    
    if (invalidRecords.length === 0) {
      message.info('No errors to download');
      return;
    }

    // Create error report data
    const errorData = invalidRecords.map((record) => ({
      Row: record.row,
      'ID Card': record.data.idCard || '',
      'Full Name': record.data.fullName || '',
      'Date of Birth': record.data.dateOfBirth || '',
      Email: record.data.email || '',
      Phone: record.data.phone || '',
      Address: record.data.address || '',
      'Priority Points': record.data.priorityPoints || '',
      Errors: record.errors.join('; '),
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(errorData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Errors');

    // Download file
    XLSX.writeFile(workbook, `import-errors-${Date.now()}.xlsx`);
    message.success('Error report downloaded');
  };

  /**
   * Download template file
   */
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'ID Card Number': '123456789',
        'Full Name': 'Nguyen Van A',
        'Date of Birth': '2005-01-15',
        Email: 'nguyenvana@example.com',
        Phone: '0912345678',
        Address: '123 Main St, Hanoi',
        'Priority Points': '0',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    XLSX.writeFile(workbook, 'student-import-template.xlsx');
    message.success('Template downloaded');
  };

  // Calculate statistics
  const validCount = previewData.filter((r) => r.isValid).length;
  const invalidCount = previewData.length - validCount;

  return (
    <div style={{ padding: '24px' }}>
      {/* Deprecation Notice */}
      <Alert
        message="Trang này đã được di chuyển"
        description={
          <div>
            <p>Chức năng Import thí sinh đã được tích hợp vào trang <strong>Quản lý thí sinh</strong> để cải thiện trải nghiệm người dùng.</p>
            <p>Vui lòng sử dụng nút "Import từ Excel" trong trang Quản lý thí sinh.</p>
            <Button type="primary" onClick={() => router.push('/students')} style={{ marginTop: 8 }}>
              Chuyển đến Quản lý thí sinh
            </Button>
          </div>
        }
        type="warning"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 24 }}
      />

      <Title level={2}>
        <FileExcelOutlined /> Import Students from Excel (Deprecated)
      </Title>
      <Paragraph>
        Upload an Excel file containing student data. The file will be validated
        before import.
      </Paragraph>

      {/* Download Template */}
      <Card style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>Need a template?</Text>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadTemplate}
          >
            Download Excel Template
          </Button>
        </Space>
      </Card>

      {/* File Upload */}
      <Card style={{ marginBottom: '24px' }}>
        <Dragger
          name="file"
          multiple={false}
          accept=".xlsx,.xls"
          customRequest={handleFileUpload}
          showUploadList={false}
          disabled={isValidating || isImporting}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            Click or drag Excel file to this area to upload
          </p>
          <p className="ant-upload-hint">
            Support for .xlsx and .xls files. Maximum file size: 10MB
          </p>
        </Dragger>

        {file && (
          <Alert title={`File selected: ${file.name}`}
            type="info"
            showIcon
            style={{ marginTop: '16px' }}
          />
        )}
      </Card>

      {/* Validation Progress */}
      {isValidating && (
        <Card style={{ marginBottom: '24px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>Validating Excel file...</Text>
            <Progress percent={50} status="active" />
          </Space>
        </Card>
      )}

      {/* Preview Statistics */}
      {previewData.length > 0 && !isValidating && (
        <Card style={{ marginBottom: '24px' }}>
          <Space size="large">
            <div>
              <Text type="secondary">Total Records:</Text>
              <Title level={3} style={{ margin: 0 }}>
                {previewData.length}
              </Title>
            </div>
            <Divider type="vertical" style={{ height: '60px' }} />
            <div>
              <Text type="success">Valid Records:</Text>
              <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                <CheckCircleOutlined /> {validCount}
              </Title>
            </div>
            <Divider type="vertical" style={{ height: '60px' }} />
            <div>
              <Text type="danger">Invalid Records:</Text>
              <Title level={3} style={{ margin: 0, color: '#ff4d4f' }}>
                <CloseCircleOutlined /> {invalidCount}
              </Title>
            </div>
          </Space>

          {invalidCount > 0 && (
            <Alert title="Some records have validation errors"
              description="Invalid records are highlighted in red in the preview table below. You can download an error report for details."
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              style={{ marginTop: '16px' }}
              action={
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadErrorReport}
                >
                  Download Error Report
                </Button>
              }
            />
          )}
        </Card>
      )}

      {/* Preview Table */}
      {previewData.length > 0 && !isValidating && (
        <Card
          title="Preview Data"
          style={{ marginBottom: '24px' }}
          extra={
            <Space>
              <Button
                type="primary"
                onClick={handleImport}
                disabled={validCount === 0 || isImporting}
                loading={isImporting}
              >
                Import {validCount} Valid Records
              </Button>
            </Space>
          }
        >
          <Table
            dataSource={previewData}
            rowKey="row"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
            rowClassName={(record) => (!record.isValid ? 'error-row' : '')}
            columns={[
              {
                title: 'Row',
                dataIndex: 'row',
                key: 'row',
                width: 60,
                fixed: 'left',
              },
              {
                title: 'Status',
                key: 'status',
                width: 80,
                fixed: 'left',
                render: (_, record) =>
                  record.isValid ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                      Valid
                    </Tag>
                  ) : (
                    <Tag color="error" icon={<CloseCircleOutlined />}>
                      Invalid
                    </Tag>
                  ),
              },
              {
                title: 'ID Card',
                dataIndex: ['data', 'idCard'],
                key: 'idCard',
                width: 120,
              },
              {
                title: 'Full Name',
                dataIndex: ['data', 'fullName'],
                key: 'fullName',
                width: 150,
              },
              {
                title: 'Date of Birth',
                dataIndex: ['data', 'dateOfBirth'],
                key: 'dateOfBirth',
                width: 120,
              },
              {
                title: 'Email',
                dataIndex: ['data', 'email'],
                key: 'email',
                width: 180,
              },
              {
                title: 'Phone',
                dataIndex: ['data', 'phone'],
                key: 'phone',
                width: 120,
              },
              {
                title: 'Address',
                dataIndex: ['data', 'address'],
                key: 'address',
                width: 200,
              },
              {
                title: 'Priority Points',
                dataIndex: ['data', 'priorityPoints'],
                key: 'priorityPoints',
                width: 120,
              },
              {
                title: 'Errors',
                dataIndex: 'errors',
                key: 'errors',
                width: 300,
                render: (errors: string[]) =>
                  errors.length > 0 ? (
                    <Text type="danger">{errors.join('; ')}</Text>
                  ) : (
                    <Text type="success">No errors</Text>
                  ),
              },
            ]}
          />
        </Card>
      )}

      {/* Import Progress */}
      {isImporting && (
        <Card style={{ marginBottom: '24px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>Importing student records...</Text>
            <Progress percent={importProgress} status="active" />
          </Space>
        </Card>
      )}

      {/* Import Result */}
      {importResult && (
        <Card title="Import Summary">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Alert title="Import Completed"
              description={`Successfully imported ${importResult.successCount} out of ${importResult.totalRecords} records.`}
              type={importResult.failureCount === 0 ? 'success' : 'warning'}
              showIcon
            />

            <Space size="large">
              <div>
                <Text type="secondary">Total Records:</Text>
                <Title level={4}>{importResult.totalRecords}</Title>
              </div>
              <div>
                <Text type="success">Success:</Text>
                <Title level={4} style={{ color: '#52c41a' }}>
                  {importResult.successCount}
                </Title>
              </div>
              <div>
                <Text type="danger">Failed:</Text>
                <Title level={4} style={{ color: '#ff4d4f' }}>
                  {importResult.failureCount}
                </Title>
              </div>
            </Space>

            {importResult.errors.length > 0 && (
              <div>
                <Text strong>Errors:</Text>
                <ul>
                  {importResult.errors.map((error, index) => (
                    <li key={index}>
                      Row {error.row}: {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Space>
        </Card>
      )}

      <style jsx global>{`
        .error-row {
          background-color: #fff1f0 !important;
        }
        .error-row:hover {
          background-color: #ffe7e6 !important;
        }
      `}</style>
    </div>
  );
}


