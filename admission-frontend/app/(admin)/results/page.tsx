'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Space, Select, Card, Table, Tag, message, Spin, Empty, Input, Row, Col, Tabs } from 'antd';
import { DownloadOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { ResultsService } from '@/api/services/ResultsService';
import { ProgramsService } from '@/api/services/ProgramsService';
import type { ColumnsType } from 'antd/es/table';
import * as XLSX from 'xlsx';

interface Session {
  id: string;
  name: string;
  year: number;
  status: 'upcoming' | 'active' | 'closed';
}

interface Program {
  id: string;
  name: string;
  code: string;
}

interface ResultRecord {
  id: string;
  studentId: string;
  fullName: string;
  idCardNumber: string;
  program: string;
  programCode: string;
  admissionMethod: string;
  score: number;
  ranking: number;
  preference: number;
  status: 'accepted' | 'rejected' | 'pending';
}

export default function ResultsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'accepted' | 'rejected' | 'all'>('accepted');
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [filterMajor, setFilterMajor] = useState<string>('');
  const [filterPreference, setFilterPreference] = useState<string>('');
  const [filterMinScore, setFilterMinScore] = useState<string>('');
  const [filterMaxScore, setFilterMaxScore] = useState<string>('');
  const [filterAdmissionMethod, setFilterAdmissionMethod] = useState<string>('');

  // Fetch sessions from API (Requirement 14.1)
  const fetchSessions = useCallback(async () => {
    setLoading(true);

    try {
      const response = await ProgramsService.programControllerFindAllSessions();
      const sessionsList = response.data || response || [];

      setSessions(sessionsList);

      // Auto-select first session if available
      if (sessionsList.length > 0 && !selectedSessionId) {
        setSelectedSessionId(sessionsList[0].id);
      }
    } catch (err) {
      message.error('Failed to load sessions');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSessionId]);

  // Fetch programs from API
  const fetchPrograms = useCallback(async () => {
    try {
      const response = await ProgramsService.programControllerFindAllMajors();
      const programsList = response.data || response || [];
      setPrograms(programsList);
    } catch (err) {
      message.error('Failed to load programs');
      console.error('Error fetching programs:', err);
    }
  }, []);

  // Load sessions and programs on mount
  useEffect(() => {
    fetchSessions();
    fetchPrograms();
  }, [fetchSessions, fetchPrograms]);

  // Mock function to fetch results (since API doesn't have a list endpoint)
  // In a real implementation, this would call an API endpoint
  const fetchResults = useCallback(async () => {
    if (!selectedSessionId) return;

    setLoading(true);

    try {
      const response = await ResultsService.resultControllerGetResults(selectedSessionId);
      
      // Response structure: { admitted: [], notAdmitted: [], all: [] }
      const data = response.all || [];

      const formattedResults: ResultRecord[] = data.map((item: any) => ({
        id: item.studentId,
        studentId: item.studentId,
        fullName: item.fullName,
        idCardNumber: item.idCard,
        program: item.majorName,
        programCode: item.majorCode,
        admissionMethod: item.admissionMethod,
        score: item.finalScore,
        ranking: item.ranking,
        preference: item.preference,
        status: item.status === 'admitted' ? 'accepted' : 'rejected',
      }));

      setResults(formattedResults);
    } catch (err) {
      message.error('Không thể tải kết quả');
      console.error('Error fetching results:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSessionId]);

  // Load results when session changes
  useEffect(() => {
    if (selectedSessionId) {
      fetchResults();
    }
  }, [selectedSessionId, fetchResults]);

  // Handle session selection (Requirement 14.2)
  const handleSessionChange = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setSearchText('');
    setFilterMajor('');
    setFilterPreference('');
    setFilterMinScore('');
    setFilterMaxScore('');
    setFilterAdmissionMethod('');
    setActiveTab('accepted');
  };

  // Get data based on active tab
  const getTabData = () => {
    switch (activeTab) {
      case 'accepted':
        return results.filter(r => r.status === 'accepted');
      case 'rejected':
        return results.filter(r => r.status === 'rejected');
      case 'all':
      default:
        return results;
    }
  };

  // Filter results based on selected filters (Requirement 14.2)
  const getFilteredResults = () => {
    let filtered = getTabData();

    // Search by name or ID card
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(r => 
        r.fullName.toLowerCase().includes(search) ||
        r.idCardNumber.toLowerCase().includes(search) ||
        r.studentId.toLowerCase().includes(search)
      );
    }

    // Filter by major
    if (filterMajor) {
      filtered = filtered.filter(r => r.programCode === filterMajor);
    }

    // Filter by preference
    if (filterPreference) {
      filtered = filtered.filter(r => r.preference === parseInt(filterPreference));
    }

    // Filter by admission method
    if (filterAdmissionMethod) {
      filtered = filtered.filter(r => r.admissionMethod.includes(filterAdmissionMethod));
    }

    // Filter by score range
    if (filterMinScore) {
      filtered = filtered.filter(r => r.score >= parseFloat(filterMinScore));
    }
    if (filterMaxScore) {
      filtered = filtered.filter(r => r.score <= parseFloat(filterMaxScore));
    }

    return filtered;
  };

  // Handle export to Excel (Requirement 14.3, 14.4, 14.5, 14.6)
  const handleExport = async () => {
    const dataToExport = getFilteredResults();
    
    if (dataToExport.length === 0) {
      message.warning('Không có dữ liệu để xuất');
      return;
    }

    setExporting(true);

    try {
      // Prepare data for Excel
      const excelData = dataToExport.map((result, index) => ({
        'STT': index + 1,
        'Mã SV': result.studentId,
        'Họ tên': result.fullName,
        'Số CCCD': result.idCardNumber,
        'Mã ngành': result.programCode,
        'Tên ngành': result.program,
        'Nguyện vọng': result.preference,
        'Khối/Tổ hợp': result.admissionMethod,
        'Điểm': result.score?.toFixed(2) || '0',
        'Xếp hạng': result.ranking || '',
        'Trạng thái': result.status === 'accepted' ? 'Trúng tuyển' : result.status === 'rejected' ? 'Không đậu' : 'Chờ xử lý',
      }));

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Kết quả');

      // Set column widths
      ws['!cols'] = [
        { wch: 5 },  // STT
        { wch: 12 }, // Mã SV
        { wch: 25 }, // Họ tên
        { wch: 15 }, // CCCD
        { wch: 10 }, // Mã ngành
        { wch: 35 }, // Tên ngành
        { wch: 12 }, // Nguyện vọng
        { wch: 12 }, // Khối
        { wch: 10 }, // Điểm
        { wch: 10 }, // Xếp hạng
        { wch: 15 }, // Trạng thái
      ];

      // Get session name for filename
      const session = sessions.find(s => s.id === selectedSessionId);
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `ket-qua-tuyen-sinh_${session?.name || 'session'}_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
      message.success('Đã xuất file Excel thành công!');
    } catch (err: any) {
      message.error('Không thể xuất file Excel');
      console.error('Error exporting results:', err);
    } finally {
      setExporting(false);
    }
  };

  // Table columns for results preview
  const columns: ColumnsType<ResultRecord> = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Mã SV',
      dataIndex: 'studentId',
      key: 'studentId',
      width: 120,
    },
    {
      title: 'Họ tên',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 200,
    },
    {
      title: 'Số CCCD',
      dataIndex: 'idCardNumber',
      key: 'idCardNumber',
      width: 150,
    },
    {
      title: 'Ngành',
      dataIndex: 'program',
      key: 'program',
      width: 250,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Mã: {record.programCode}</div>
        </div>
      ),
    },
    {
      title: 'Khối/Tổ hợp',
      dataIndex: 'admissionMethod',
      key: 'admissionMethod',
      width: 120,
      align: 'center',
      render: (method: string) => <Tag color="cyan">{method}</Tag>,
    },
    {
      title: 'Nguyện vọng',
      dataIndex: 'preference',
      key: 'preference',
      width: 100,
      align: 'center',
      render: (pref: number) => <Tag color="blue">NV{pref}</Tag>,
    },
    {
      title: 'Điểm',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.score - b.score,
      render: (score: number) => score?.toFixed(2) || 'N/A',
    },
    {
      title: 'Xếp hạng',
      dataIndex: 'ranking',
      key: 'ranking',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.ranking - b.ranking,
      render: (rank: number) => rank ? <Tag color="green">#{rank}</Tag> : <span style={{ color: '#999' }}>-</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status: string) => {
        const colorMap = {
          accepted: 'success',
          rejected: 'error',
          pending: 'warning',
        };
        const textMap = {
          accepted: 'Trúng tuyển',
          rejected: 'Không đậu',
          pending: 'Chờ xử lý',
        };
        return (
          <Tag color={colorMap[status as keyof typeof colorMap]}>
            {textMap[status as keyof typeof textMap]}
          </Tag>
        );
      },
      filters: [
        { text: 'Trúng tuyển', value: 'accepted' },
        { text: 'Không đậu', value: 'rejected' },
        { text: 'Chờ xử lý', value: 'pending' },
      ],
      onFilter: (value, record) => record.status === value,
    },
  ];

  // Get selected session details
  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  // Calculate statistics
  const stats = {
    total: results.length,
    accepted: results.filter(r => r.status === 'accepted').length,
    rejected: results.filter(r => r.status === 'rejected').length,
    pending: results.filter(r => r.status === 'pending').length,
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Kết quả tuyển sinh</h1>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          Xem và xuất kết quả tuyển sinh ra file Excel
        </p>
      </div>

      {/* Filter Configuration Card (Requirement 14.1, 14.2) */}
      <Card
        title="Chọn đợt tuyển sinh"
        style={{ marginBottom: '24px' }}
        loading={loading && !selectedSessionId}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Đợt tuyển sinh <span style={{ color: 'red' }}>*</span>
            </label>
            <Select
              style={{ width: '100%' }}
              placeholder="Chọn đợt tuyển sinh"
              value={selectedSessionId}
              onChange={handleSessionChange}
              size="large"
            >
              {sessions.map((session) => (
                <Select.Option key={session.id} value={session.id}>
                  {session.name} ({session.year})
                </Select.Option>
              ))}
            </Select>
          </div>

          {selectedSessionId && (
            <div>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchResults}
                size="large"
              >
                Làm mới
              </Button>
            </div>
          )}
        </Space>
      </Card>

      {/* Statistics Card */}
      {selectedSessionId && results.length > 0 && (
        <Card title="Thống kê" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <Card size="small" style={{ backgroundColor: '#f0f5ff' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 600, color: '#1890ff' }}>
                  {stats.total}
                </div>
                <div style={{ color: '#666', marginTop: '8px' }}>Tổng số</div>
              </div>
            </Card>

            <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 600, color: '#52c41a' }}>
                  {stats.accepted}
                </div>
                <div style={{ color: '#666', marginTop: '8px' }}>Trúng tuyển</div>
              </div>
            </Card>

            <Card size="small" style={{ backgroundColor: '#fff1f0' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 600, color: '#ff4d4f' }}>
                  {stats.rejected}
                </div>
                <div style={{ color: '#666', marginTop: '8px' }}>Không đậu</div>
              </div>
            </Card>

            <Card size="small" style={{ backgroundColor: '#fffbe6' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 600, color: '#faad14' }}>
                  {stats.pending}
                </div>
                <div style={{ color: '#666', marginTop: '8px' }}>Chờ xử lý</div>
              </div>
            </Card>
          </div>
        </Card>
      )}

      {/* Results Table with Filters */}
      {selectedSessionId && results.length > 0 && (
        <Card title="Kết quả tuyển sinh">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* Filter Section */}
            <Card size="small">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Input
                    placeholder="Tìm theo tên, CCCD, mã SV"
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                  />
                </Col>
                <Col xs={12} sm={8} md={5}>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Chọn ngành"
                    value={filterMajor}
                    onChange={setFilterMajor}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {programs.map((program) => (
                      <Select.Option key={program.id} value={program.code}>
                        {program.code} - {program.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={12} sm={8} md={4}>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Nguyện vọng"
                    value={filterPreference}
                    onChange={setFilterPreference}
                    allowClear
                  >
                    {[1, 2, 3, 4, 5].map((pref) => (
                      <Select.Option key={pref} value={pref.toString()}>
                        NV{pref}
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={12} sm={8} md={4}>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Phương thức"
                    value={filterAdmissionMethod}
                    onChange={setFilterAdmissionMethod}
                    allowClear
                  >
                    <Select.Option value="A00">Khối A00</Select.Option>
                    <Select.Option value="A01">Khối A01</Select.Option>
                    <Select.Option value="B00">Khối B00</Select.Option>
                    <Select.Option value="C00">Khối C00</Select.Option>
                    <Select.Option value="D01">Khối D01</Select.Option>
                    <Select.Option value="D07">Khối D07</Select.Option>
                  </Select>
                </Col>
                <Col xs={8} sm={6} md={3}>
                  <Input
                    placeholder="Điểm từ"
                    type="number"
                    step="0.1"
                    value={filterMinScore}
                    onChange={(e) => setFilterMinScore(e.target.value)}
                    allowClear
                  />
                </Col>
                <Col xs={8} sm={6} md={3}>
                  <Input
                    placeholder="Điểm đến"
                    type="number"
                    step="0.1"
                    value={filterMaxScore}
                    onChange={(e) => setFilterMaxScore(e.target.value)}
                    allowClear
                  />
                </Col>
                <Col xs={8} sm={6} md={5}>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleExport}
                    loading={exporting}
                    block
                  >
                    Xuất Excel
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* Results Tabs */}
            <Tabs
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key as any)}
              items={[
                {
                  key: 'accepted',
                  label: (
                    <span>
                      <Tag color="success">Trúng tuyển</Tag>
                      <span style={{ marginLeft: 8 }}>
                        ({results.filter(r => r.status === 'accepted').length})
                      </span>
                    </span>
                  ),
                  children: (
                    <Table
                      columns={columns}
                      dataSource={getFilteredResults()}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng ${total} kết quả`,
                      }}
                      scroll={{ x: 1200 }}
                    />
                  ),
                },
                {
                  key: 'rejected',
                  label: (
                    <span>
                      <Tag color="error">Không đậu</Tag>
                      <span style={{ marginLeft: 8 }}>
                        ({results.filter(r => r.status === 'rejected').length})
                      </span>
                    </span>
                  ),
                  children: (
                    <Table
                      columns={columns}
                      dataSource={getFilteredResults()}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng ${total} kết quả`,
                      }}
                      scroll={{ x: 1200 }}
                    />
                  ),
                },
                {
                  key: 'all',
                  label: (
                    <span>
                      <Tag color="default">Tất cả</Tag>
                      <span style={{ marginLeft: 8 }}>
                        ({results.length})
                      </span>
                    </span>
                  ),
                  children: (
                    <Table
                      columns={columns}
                      dataSource={getFilteredResults()}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng ${total} kết quả`,
                      }}
                      scroll={{ x: 1200 }}
                      rowClassName={(record) => 
                        record.status === 'accepted' ? 'bg-green-50' : ''
                      }
                    />
                  ),
                },
              ]}
            />
          </Space>
        </Card>
      )}

      {/* Information Card */}
      {!selectedSessionId && (
        <Card title="Hướng dẫn" type="inner">
          <Space direction="vertical" style={{ width: '100%' }}>
            <p>
              Để xem và xuất kết quả tuyển sinh:
            </p>
            <ol style={{ paddingLeft: '20px' }}>
              <li>Chọn đợt tuyển sinh từ dropdown phía trên</li>
              <li>Kết quả sẽ tự động hiển thị sau khi chọn</li>
              <li>Sử dụng các bộ lọc để tìm kiếm kết quả cụ thể</li>
              <li>Nhấn "Xuất Excel" để tải kết quả đã lọc</li>
            </ol>
            <p>
              <strong>Lưu ý:</strong> Bạn phải chạy Lọc ảo trước để tạo kết quả
              cho đợt tuyển sinh.
            </p>
          </Space>
        </Card>
      )}

      {/* Empty State */}
      {selectedSessionId && results.length === 0 && !loading && (
        <Card>
          <Empty
            description="Chưa có kết quả tuyển sinh cho đợt này. Vui lòng chạy Lọc ảo trước."
            style={{ padding: '40px' }}
          />
        </Card>
      )}
    </div>
  );
}

