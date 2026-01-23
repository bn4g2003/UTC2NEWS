'use client';

/**
 * Import Students Modal Component
 * Excel import functionality integrated into Students Management page
 * Supports full 21-column template matching backend requirements
 */

import React, { useState, useCallback, useEffect } from 'react';
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
  Select,
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
import {
  importStudentSchema,
  type ImportPreviewRecord,
  type ImportResult,
  EXCEL_HEADERS,
  EXCEL_COLUMN_MAP,
} from '../import/schema';
import { ProgramsService } from '@/api/services/ProgramsService';

const { Dragger } = Upload;
const { Text, Title } = Typography;

interface ImportStudentsModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportStudentsModal({
  open,
  onClose,
  onSuccess,
}: ImportStudentsModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewRecord[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  /**
   * Load admission sessions from API
   */
  useEffect(() => {
    if (open) {
      loadSessions();
    }
  }, [open]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const response = await ProgramsService.programControllerFindAllSessions();
      setSessions(response || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      message.error('Không thể tải danh sách đợt tuyển sinh');
    } finally {
      setLoadingSessions(false);
    }
  };

  /**
   * Validate Excel file format
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
      message.error('Định dạng file không hợp lệ. Vui lòng tải lên file Excel (.xlsx hoặc .xls)');
      return false;
    }

    return true;
  };

  /**
   * Parse Excel file and extract data
   */
  const parseExcelFile = useCallback(
    async (file: File): Promise<ImportPreviewRecord[]> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });

            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              defval: '',
            }) as string[][];

            if (jsonData.length === 0) {
              reject(new Error('File Excel trống'));
              return;
            }

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
                  `Thiếu các cột bắt buộc: ${missingFields
                    .map((f) => EXCEL_HEADERS[f])
                    .join(', ')}`
                )
              );
              return;
            }

            const records: ImportPreviewRecord[] = [];

            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];

              if (row.every((cell) => !cell || String(cell).trim() === '')) {
                continue;
              }

              const rowData: any = {};
              headerMap.forEach((field, colIndex) => {
                let value = row[colIndex];

                // Handle ID Card - Excel may remove leading zeros, pad to 12 digits
                if (field === 'idCard' && value) {
                  value = String(value).trim();
                  if (/^\d+$/.test(value) && value.length < 12) {
                    value = value.padStart(12, '0');
                  }
                }

                // Handle Phone - Excel may remove leading zeros, pad to 10 digits
                if (field === 'phone' && value) {
                  value = String(value).trim();
                  if (/^\d+$/.test(value) && value.length < 10) {
                    value = value.padStart(10, '0');
                  }
                }

                // Handle Date of Birth - Excel stores dates as serial numbers
                if (field === 'dateOfBirth' && value) {
                  // Check if it's an Excel serial number (number > 1000)
                  if (typeof value === 'number' && value > 1000) {
                    // Convert Excel serial date to JavaScript Date
                    // Excel dates start from 1/1/1900, but JavaScript Date starts from 1/1/1970
                    const excelEpoch = new Date(1899, 11, 30); // Excel epoch (Dec 30, 1899)
                    const jsDate = new Date(excelEpoch.getTime() + value * 86400000);
                    value = jsDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                  } else if (typeof value === 'string') {
                    // Try to parse various date formats
                    const trimmed = value.trim();
                    // Check if it's DD/MM/YYYY format
                    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
                      const [day, month, year] = trimmed.split('/');
                      value = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    }
                    // Check if it's already YYYY-MM-DD format
                    else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
                      value = trimmed;
                    }
                  }
                }

                rowData[field] = value !== undefined ? String(value).trim() : '';
              });

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
          reject(new Error('Không thể đọc file'));
        };

        reader.readAsBinaryString(file);
      });
    },
    []
  );

  /**
   * Handle file upload
   */
  const handleFileUpload: UploadProps['customRequest'] = async (options) => {
    const { file } = options;
    const uploadedFile = file as File;

    if (!validateFileFormat(uploadedFile)) {
      return;
    }

    setFile(uploadedFile);
    setIsValidating(true);
    setPreviewData([]);
    setImportResult(null);

    try {
      const records = await parseExcelFile(uploadedFile);
      setPreviewData(records);
      setStep('preview');

      const validCount = records.filter((r) => r.isValid).length;
      const invalidCount = records.length - validCount;

      if (invalidCount > 0) {
        message.warning(
          `Đã phân tích file. ${validCount} bản ghi hợp lệ, ${invalidCount} bản ghi không hợp lệ.`
        );
      } else {
        message.success(`Đã phân tích file. ${validCount} bản ghi hợp lệ.`);
      }
    } catch (error) {
      message.error(
        `Không thể phân tích file Excel: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
      );
      setFile(null);
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Handle import execution
   */
  const handleImport = async () => {
    if (!file || !sessionId) {
      message.error('Vui lòng chọn file và đợt tuyển sinh trước khi import');
      return;
    }

    const validRecords = previewData.filter((r) => r.isValid);

    if (validRecords.length === 0) {
      message.error('Không có bản ghi hợp lệ để import');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);

      // Use apiClient directly to ensure authentication headers are included
      const { apiClient } = await import('@/lib/api-client');
      const response = await apiClient.post('/api/import/students', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = response.data;

      clearInterval(progressInterval);
      setImportProgress(100);

      const importResult: ImportResult = {
        totalRecords: previewData.length,
        successCount: result.successCount || validRecords.length,
        failureCount: result.failureCount || 0,
        errors: result.errors || [],
      };

      setImportResult(importResult);
      setStep('result');

      message.success(
        `Import hoàn tất! ${importResult.successCount} bản ghi đã được import thành công.`
      );

      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error: any) {
      message.error(
        `Import thất bại: ${error.response?.data?.message || error.message || 'Lỗi không xác định'}`
      );
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * Download error report
   */
  const handleDownloadErrorReport = () => {
    const invalidRecords = previewData.filter((r) => !r.isValid);

    if (invalidRecords.length === 0) {
      message.info('Không có lỗi để tải xuống');
      return;
    }

    const errorData = invalidRecords.map((record) => ({
      'Dòng': record.row,
      'ID Card': record.data.idCard || '',
      'Full Name': record.data.fullName || '',
      'Date of Birth': record.data.dateOfBirth || '',
      'Email': record.data.email || '',
      'Phone': record.data.phone || '',
      'Lỗi': record.errors.join('; '),
    }));

    const worksheet = XLSX.utils.json_to_sheet(errorData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Errors');

    XLSX.writeFile(workbook, `import-errors-${Date.now()}.xlsx`);
    message.success('Đã tải xuống báo cáo lỗi');
  };

  /**
   * Download template file with all 21 columns
   */
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'ID Card': '001234567890',
        'Full Name': 'Nguyen Van A',
        'Date of Birth': '2005-03-15',
        'Email': 'nguyenvana@email.com',
        'Phone': '0901234567',
        'Address': '123 Le Loi Street, HCM',
        'Priority Points': '0.5',
        'Math': '8.5',
        'Physics': '9.0',
        'Chemistry': '8.0',
        'Biology': '7.5',
        'Literature': '7.0',
        'History': '8.0',
        'Geography': '8.5',
        'English': '9.0',
        'Civic Education': '9.5',
        'Informatics': '10',
        'Technology': '9',
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 25 }, { wch: 12 },
      { wch: 30 }, { wch: 15 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
      { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
      { wch: 15 }, { wch: 12 }, { wch: 12 }
    ];

    // Format ID Card and Phone columns as text to preserve leading zeros
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      // Column A (ID Card) - index 0
      const idCardCell = XLSX.utils.encode_cell({ r: R, c: 0 });
      if (worksheet[idCardCell]) {
        worksheet[idCardCell].z = '@'; // Text format
        worksheet[idCardCell].t = 's'; // String type
      }

      // Column C (Date of Birth) - index 2
      const dobCell = XLSX.utils.encode_cell({ r: R, c: 2 });
      if (worksheet[dobCell] && R > 0) { // Skip header
        worksheet[dobCell].z = 'yyyy-mm-dd'; // Date format
        worksheet[dobCell].t = 's'; // String type to prevent Excel conversion
      }

      // Column E (Phone) - index 4
      const phoneCell = XLSX.utils.encode_cell({ r: R, c: 4 });
      if (worksheet[phoneCell]) {
        worksheet[phoneCell].z = '@'; // Text format
        worksheet[phoneCell].t = 's'; // String type
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Data');

    XLSX.writeFile(workbook, 'student-import-template.xlsx');
    message.success('Đã tải xuống file mẫu');
  };

  /**
   * Reset modal state
   */
  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setImportResult(null);
    setSessionId('');
    setStep('upload');
    setImportProgress(0);
    onClose();
  };

  const validCount = previewData.filter((r) => r.isValid).length;
  const invalidCount = previewData.length - validCount;

  return (
    <Modal
      title="Import thí sinh từ Excel"
      open={open}
      onCancel={handleClose}
      width={1400}
      footer={
        step === 'upload' ? (
          <Button onClick={handleClose}>Đóng</Button>
        ) : step === 'preview' ? (
          <Space>
            <Button onClick={() => setStep('upload')}>Quay lại</Button>
            <Button onClick={handleClose}>Hủy</Button>
            <Button
              type="primary"
              onClick={handleImport}
              disabled={validCount === 0 || isImporting || !sessionId}
              loading={isImporting}
            >
              Import {validCount} bản ghi hợp lệ
            </Button>
          </Space>
        ) : (
          <Button type="primary" onClick={handleClose}>
            Đóng
          </Button>
        )
      }
    >
      {/* Upload Step */}
      {step === 'upload' && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message="Hướng dẫn"
            description="Tải lên file Excel bao gồm: thông tin thí sinh (CCCD, Họ tên, Ngày sinh, SĐT, Email, Địa chỉ, Điểm cộng), điểm tất cả các môn, và đường dẫn ảnh/hồ sơ (tùy chọn). Hệ thống sẽ tự động liên kết thí sinh vào đợt tuyển sinh đang chọn."
            type="info"
            showIcon
          />

          <div>
            <Text strong>Cần file mẫu?</Text>
            <br />
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownloadTemplate}
              style={{ marginTop: 8 }}
            >
              Tải xuống file Excel mẫu (.xlsx)
            </Button>
          </div>

          <Dragger
            name="file"
            multiple={false}
            accept=".xlsx,.xls"
            customRequest={handleFileUpload}
            showUploadList={false}
            disabled={isValidating}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Nhấp hoặc kéo file Excel vào đây để tải lên
            </p>
            <p className="ant-upload-hint">
              Hỗ trợ file .xlsx và .xls. Kích thước tối đa: 10MB
            </p>
          </Dragger>

          {file && (
            <Alert
              message={`File đã chọn: ${file.name}`}
              type="info"
              showIcon
            />
          )}

          {isValidating && (
            <div>
              <Text>Đang kiểm tra file Excel...</Text>
              <Progress percent={50} status="active" />
            </div>
          )}
        </Space>
      )}

      {/* Preview Step */}
      {step === 'preview' && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Space size="large">
            <div>
              <Text type="secondary">Tổng số bản ghi:</Text>
              <Title level={4} style={{ margin: 0 }}>
                {previewData.length}
              </Title>
            </div>
            <Divider type="vertical" style={{ height: '40px' }} />
            <div>
              <Text type="success">Hợp lệ:</Text>
              <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                <CheckCircleOutlined /> {validCount}
              </Title>
            </div>
            <Divider type="vertical" style={{ height: '40px' }} />
            <div>
              <Text type="danger">Không hợp lệ:</Text>
              <Title level={4} style={{ margin: 0, color: '#ff4d4f' }}>
                <CloseCircleOutlined /> {invalidCount}
              </Title>
            </div>
          </Space>

          {invalidCount > 0 && (
            <Alert
              message="Một số bản ghi có lỗi"
              description="Các bản ghi không hợp lệ được đánh dấu màu đỏ. Bạn có thể tải xuống báo cáo lỗi để xem chi tiết."
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              action={
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadErrorReport}
                >
                  Tải báo cáo lỗi
                </Button>
              }
            />
          )}

          <div>
            <Text strong>Chọn đợt tuyển sinh: <span style={{ color: 'red' }}>*</span></Text>
            <Select
              placeholder="Chọn đợt tuyển sinh"
              style={{ width: '100%', marginTop: 8 }}
              value={sessionId}
              onChange={setSessionId}
              loading={loadingSessions}
            >
              {sessions.map((session) => (
                <Select.Option key={session.id} value={session.id}>
                  {session.name} ({session.year})
                </Select.Option>
              ))}
            </Select>
          </div>

          <Table
            dataSource={previewData}
            rowKey="row"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 2000, y: 400 }}
            rowClassName={(record) => (!record.isValid ? 'error-row' : '')}
            size="small"
            columns={[
              { title: 'Dòng', dataIndex: 'row', key: 'row', width: 60, fixed: 'left' },
              {
                title: 'Trạng thái',
                key: 'status',
                width: 100,
                fixed: 'left',
                render: (_, record) =>
                  record.isValid ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>Hợp lệ</Tag>
                  ) : (
                    <Tag color="error" icon={<CloseCircleOutlined />}>Lỗi</Tag>
                  ),
              },
              { title: 'CMND/CCCD', dataIndex: ['data', 'idCard'], key: 'idCard', width: 120, fixed: 'left' },
              { title: 'Họ tên', dataIndex: ['data', 'fullName'], key: 'fullName', width: 160, fixed: 'left' },
              { title: 'Ngày sinh', dataIndex: ['data', 'dateOfBirth'], key: 'dob', width: 110 },
              { title: 'Email', dataIndex: ['data', 'email'], key: 'email', width: 180 },
              { title: 'SĐT', dataIndex: ['data', 'phone'], key: 'phone', width: 110 },
              { title: 'Điểm cộng', dataIndex: ['data', 'priorityPoints'], key: 'priorityPoints', width: 100 },
              { title: 'Toán', dataIndex: ['data', 'math'], key: 'math', width: 70 },
              { title: 'Lý', dataIndex: ['data', 'physics'], key: 'physics', width: 70 },
              { title: 'Hóa', dataIndex: ['data', 'chemistry'], key: 'chemistry', width: 70 },
              { title: 'Sinh', dataIndex: ['data', 'biology'], key: 'biology', width: 70 },
              { title: 'Văn', dataIndex: ['data', 'literature'], key: 'literature', width: 70 },
              { title: 'Sử', dataIndex: ['data', 'history'], key: 'history', width: 70 },
              { title: 'Địa', dataIndex: ['data', 'geography'], key: 'geography', width: 70 },
              { title: 'Anh', dataIndex: ['data', 'english'], key: 'english', width: 70 },
              { title: 'GDCD', dataIndex: ['data', 'civic_education'], key: 'civic_education', width: 70 },
              { title: 'Tin học', dataIndex: ['data', 'informatics'], key: 'informatics', width: 80 },
              { title: 'Công nghệ', dataIndex: ['data', 'technology'], key: 'technology', width: 100 },
              {
                title: 'Lỗi chi tiết',
                dataIndex: 'errors',
                key: 'errors',
                width: 300,
                fixed: 'right',
                render: (errors: string[]) =>
                  errors.length > 0 ? (
                    <Text type="danger" style={{ fontSize: 11 }}>{errors.join('; ')}</Text>
                  ) : (
                    <Tag color="success">OK</Tag>
                  ),
              },
            ]}
          />

          {isImporting && (
            <div>
              <Text>Đang import dữ liệu thí sinh...</Text>
              <Progress percent={importProgress} status="active" />
            </div>
          )}
        </Space>
      )}

      {/* Result Step */}
      {step === 'result' && importResult && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message="Import hoàn tất"
            description={`Đã import thành công ${importResult.successCount} trong tổng số ${importResult.totalRecords} bản ghi.`}
            type={importResult.failureCount === 0 ? 'success' : 'warning'}
            showIcon
          />

          <Space size="large">
            <div>
              <Text type="secondary">Tổng số:</Text>
              <Title level={4}>{importResult.totalRecords}</Title>
            </div>
            <div>
              <Text type="success">Thành công:</Text>
              <Title level={4} style={{ color: '#52c41a' }}>
                {importResult.successCount}
              </Title>
            </div>
            <div>
              <Text type="danger">Thất bại:</Text>
              <Title level={4} style={{ color: '#ff4d4f' }}>
                {importResult.failureCount}
              </Title>
            </div>
          </Space>

          {importResult.errors.length > 0 && (
            <div>
              <Text strong>Lỗi:</Text>
              <ul>
                {importResult.errors.map((error, index) => (
                  <li key={index}>
                    Dòng {error.row}: {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Space>
      )}

      <style jsx global>{`
        .error-row {
          background-color: #fff1f0 !important;
        }
        .error-row:hover {
          background-color: #ffe7e6 !important;
        }
      `}</style>
    </Modal>
  );
}
