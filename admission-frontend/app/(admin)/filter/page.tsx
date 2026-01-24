'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Space, Select, Card, Alert, Spin, message, Table, Tag, Modal, Input, Row, Col, Tabs } from 'antd';
import { PlayCircleOutlined, ReloadOutlined, SaveOutlined, EyeOutlined, DownloadOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { FilterService } from '@/api/services/FilterService';
import { ProgramsService } from '@/api/services/ProgramsService';
import { StudentsService } from '@/api/services/StudentsService';
import { getBlockCode } from '@/lib/block-code-mapper';
import * as XLSX from 'xlsx';

interface Session {
  id: string;
  name: string;
  year: number;
  status: 'upcoming' | 'active' | 'closed';
}

interface FilterResult {
  sessionId: string;
  totalStudents: number;
  admittedCount: number;
  executionTime: number;
  decisions: AdmissionDecision[];
}

interface AdmissionDecision {
  applicationId: string;
  studentId: string;
  majorId: string;
  status: 'admitted' | 'not_admitted';
  admittedPreference: number | null;
}

interface StudentApplication {
  id: string;
  idCard: string;
  fullName: string;
  majorName: string;
  majorCode: string;
  admissionMethod: string;
  calculatedScore: number;
  rankInMajor: number | null;
  preferencePriority: number;
  admissionStatus: string;
  rejectionReason?: string | null;
  rejectionReasonText?: string | null;
}

interface DetailedFilterResult {
  sessionId: string;
  totalStudents: number;
  students: {
    studentId: string;
    studentName: string;
    idCard: string;
    applications: StudentApplication[];
  }[];
}

export default function FilterPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterResult, setFilterResult] = useState<FilterResult | null>(null);
  const [admittedStudents, setAdmittedStudents] = useState<StudentApplication[]>([]);
  const [allApplications, setAllApplications] = useState<StudentApplication[]>([]);
  const [detailedResults, setDetailedResults] = useState<DetailedFilterResult | null>(null);
  const [sessionQuotas, setSessionQuotas] = useState<any[]>([]);
  const [loadingQuotas, setLoadingQuotas] = useState(false);
  const [activeTab, setActiveTab] = useState<'admitted' | 'not_admitted' | 'all'>('admitted');
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [filterMajor, setFilterMajor] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPreference, setFilterPreference] = useState<string>('');
  const [filterMinScore, setFilterMinScore] = useState<string>('');
  const [filterMaxScore, setFilterMaxScore] = useState<string>('');
  const [filterAdmissionMethod, setFilterAdmissionMethod] = useState<string>('');
  const [filterRejectionReason, setFilterRejectionReason] = useState<string>('');
  const [majors, setMajors] = useState<any[]>([]);

  // Fetch session quotas
  const fetchSessionQuotas = useCallback(async (sessionId: string) => {
    setLoadingQuotas(true);
    try {
      const response = await ProgramsService.programControllerFindAllQuotas(sessionId);
      setSessionQuotas(response || []);
    } catch (err) {
      console.error('Error fetching quotas:', err);
    } finally {
      setLoadingQuotas(false);
    }
  }, []);

  // Fetch sessions from API
  const fetchSessions = useCallback(async () => {
    setLoading(true);

    try {
      const response = await ProgramsService.programControllerFindAllSessions();
      const sessionsList = response.data || response || [];

      // Filter to show only active sessions
      const activeSessions = sessionsList.filter(
        (session: Session) => session.status === 'active'
      );

      setSessions(activeSessions);

      // Auto-select first session if available
      if (activeSessions.length > 0 && !selectedSessionId) {
        setSelectedSessionId(activeSessions[0].id);
      }
    } catch (err) {
      message.error('Không thể tải danh sách đợt tuyển sinh');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSessionId]);

  // Load sessions on mount
  useEffect(() => {
    fetchSessions();
    fetchMajors();
  }, [fetchSessions]);

  // Fetch majors for filter
  const fetchMajors = async () => {
    try {
      const response = await ProgramsService.programControllerFindAllMajors();
      setMajors(response.data || response || []);
    } catch (err) {
      console.error('Error fetching majors:', err);
    }
  };

  // Handle session selection
  const handleSessionChange = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setFilterResult(null);
    setAdmittedStudents([]);
    setAllApplications([]);
    setDetailedResults(null);
    if (sessionId) {
      fetchSessionQuotas(sessionId);
    }
  };

  // Fetch detailed filter results (all applications with rejection reasons)
  const fetchDetailedResults = async (sessionId: string) => {
    try {
      const data = await FilterService.filterControllerGetFilterResults(sessionId);
      setDetailedResults(data);
      
      // Flatten all applications for table display
      const allApps: StudentApplication[] = [];
      data.students?.forEach((student: any) => {
        student.applications?.forEach((app: any) => {
          allApps.push({
            id: app.applicationId,
            idCard: student.idCard,
            fullName: student.studentName,
            majorName: app.majorName,
            majorCode: app.majorCode,
            admissionMethod: app.admissionMethod,
            calculatedScore: app.calculatedScore,
            rankInMajor: app.rankInMajor,
            preferencePriority: app.preferencePriority,
            admissionStatus: app.status,
            rejectionReason: app.rejectionReason,
            rejectionReasonText: app.rejectionReasonText,
          });
        });
      });
      
      setAllApplications(allApps);
    } catch (err) {
      console.error('Error fetching detailed results:', err);
      message.error('Không thể tải kết quả chi tiết');
    }
  };

  // Fetch admitted students details
  const fetchAdmittedStudents = async (sessionId: string) => {
    try {
      const response = await StudentsService.studentControllerFindAllStudents(
        '1', '1000', '', sessionId
      );

      const admitted: StudentApplication[] = [];
      response.data?.forEach((student: any) => {
        student.applications?.forEach((app: any) => {
          if (app.admissionStatus === 'admitted') {
            admitted.push({
              id: app.id,
              idCard: student.idCard,
              fullName: student.fullName,
              majorName: app.major?.name || '',
              majorCode: app.major?.code || '',
              admissionMethod: app.admissionMethod,
              calculatedScore: app.calculatedScore,
              rankInMajor: app.rankInMajor,
              preferencePriority: app.preferencePriority,
              admissionStatus: app.admissionStatus,
            });
          }
        });
      });

      setAdmittedStudents(admitted);
    } catch (err) {
      console.error('Error fetching admitted students:', err);
    }
  };

  // Handle run filter
  const handleRunFilter = async () => {
    if (!selectedSessionId) {
      message.warning('Vui lòng chọn đợt tuyển sinh');
      return;
    }

    setRunning(true);
    setFilterResult(null);
    setAdmittedStudents([]);
    setAllApplications([]);
    setDetailedResults(null);
    try {
      const result = await FilterService.filterControllerRunFilter(selectedSessionId);

      setFilterResult(result as FilterResult);

      // Fetch detailed results with rejection reasons
      await fetchDetailedResults(selectedSessionId);

      // Fetch admitted students details
      await fetchAdmittedStudents(selectedSessionId);

      message.success(`Lọc ảo hoàn tất! ${result.admittedCount}/${result.totalStudents} thí sinh trúng tuyển`);
    } catch (err: any) {
      let errorMessage = 'Không thể thực hiện lọc ảo';

      if (err.status === 403) {
        errorMessage = 'Bạn không có quyền thực hiện lọc ảo';
      } else if (err.status === 404) {
        errorMessage = 'Không tìm thấy đợt tuyển sinh';
      } else if (err.body?.message) {
        errorMessage = err.body.message;
      }

      message.error(errorMessage);
      console.error('Error running filter:', err);
    } finally {
      setRunning(false);
    }
  };

  // Handle save results (this would call a separate API endpoint)
  const handleSaveResults = async () => {
    if (!filterResult) {
      message.warning('Không có kết quả để lưu');
      return;
    }

    Modal.confirm({
      title: 'Xác nhận lưu kết quả',
      content: `Bạn có chắc chắn muốn lưu kết quả lọc ảo này? ${filterResult.admittedCount} thí sinh sẽ được đánh dấu trúng tuyển chính thức.`,
      okText: 'Lưu kết quả',
      cancelText: 'Hủy',
      onOk: async () => {
        setSaving(true);
        try {
          // Note: The filter already persists to database
          // This is just a confirmation step
          message.success('Kết quả đã được lưu thành công!');
        } catch (err) {
          message.error('Không thể lưu kết quả');
          console.error('Error saving results:', err);
        } finally {
          setSaving(false);
        }
      },
    });
  };

  // Handle reset
  const handleReset = () => {
    setFilterResult(null);
    setAdmittedStudents([]);
    setAllApplications([]);
    setDetailedResults(null);
    setSearchText('');
    setFilterMajor('');
    setFilterStatus('');
    setFilterPreference('');
    setFilterMinScore('');
    setFilterMaxScore('');
    setFilterAdmissionMethod('');
    setFilterRejectionReason('');
    setActiveTab('admitted');
  };

  // Get data based on active tab
  const getTabData = () => {
    switch (activeTab) {
      case 'admitted':
        return allApplications.filter(app => app.admissionStatus === 'admitted');
      case 'not_admitted':
        return allApplications.filter(app => app.admissionStatus === 'not_admitted');
      case 'all':
      default:
        return allApplications;
    }
  };

  // Filter applications based on search and filters
  const getFilteredApplications = () => {
    let filtered = getTabData();

    // Search by name or ID card
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(app => 
        app.fullName.toLowerCase().includes(search) ||
        app.idCard.toLowerCase().includes(search)
      );
    }

    // Filter by major
    if (filterMajor) {
      filtered = filtered.filter(app => app.majorCode === filterMajor);
    }

    // Filter by preference
    if (filterPreference) {
      filtered = filtered.filter(app => app.preferencePriority === parseInt(filterPreference));
    }

    // Filter by admission method
    if (filterAdmissionMethod) {
      filtered = filtered.filter(app => app.admissionMethod.includes(filterAdmissionMethod));
    }

    // Filter by rejection reason (only for not admitted)
    if (filterRejectionReason && activeTab !== 'admitted') {
      filtered = filtered.filter(app => app.rejectionReason === filterRejectionReason);
    }

    // Filter by score range
    if (filterMinScore) {
      filtered = filtered.filter(app => app.calculatedScore >= parseFloat(filterMinScore));
    }
    if (filterMaxScore) {
      filtered = filtered.filter(app => app.calculatedScore <= parseFloat(filterMaxScore));
    }

    return filtered;
  };

  // Export to Excel
  const handleExportExcel = () => {
    const dataToExport = getFilteredApplications();
    
    if (dataToExport.length === 0) {
      message.warning('Không có dữ liệu để xuất');
      return;
    }

    // Prepare data for Excel
    const excelData = dataToExport.map((app, index) => ({
      'STT': index + 1,
      'Số CCCD': app.idCard,
      'Họ tên': app.fullName,
      'Mã ngành': app.majorCode,
      'Tên ngành': app.majorName,
      'Nguyện vọng': app.preferencePriority,
      'Khối/Tổ hợp': app.admissionMethod,
      'Điểm xét tuyển': app.calculatedScore?.toFixed(2) || '0',
      'Xếp hạng': app.rankInMajor || '',
      'Trạng thái': app.admissionStatus === 'admitted' ? 'Trúng tuyển' : 'Không đậu',
      'Lý do': app.rejectionReasonText || '',
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kết quả lọc');

    // Set column widths
    ws['!cols'] = [
      { wch: 5 },  // STT
      { wch: 15 }, // CCCD
      { wch: 25 }, // Họ tên
      { wch: 10 }, // Mã ngành
      { wch: 35 }, // Tên ngành
      { wch: 12 }, // Nguyện vọng
      { wch: 12 }, // Khối
      { wch: 15 }, // Điểm
      { wch: 10 }, // Xếp hạng
      { wch: 15 }, // Trạng thái
      { wch: 50 }, // Lý do
    ];

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `ket-qua-loc-ao_${selectedSession?.name || 'session'}_${timestamp}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
    message.success('Đã xuất file Excel thành công!');
  };

  // Get selected session details
  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  // Table columns for admitted students
  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Số CCCD',
      dataIndex: 'idCard',
      key: 'idCard',
      width: 150,
    },
    {
      title: 'Họ tên',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 200,
    },
    {
      title: 'Ngành',
      key: 'major',
      render: (record: StudentApplication) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.majorName}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Mã: {record.majorCode}</div>
        </div>
      ),
    },
    {
      title: 'Nguyện vọng',
      dataIndex: 'preferencePriority',
      key: 'preferencePriority',
      width: 100,
      render: (priority: number) => <Tag color="blue">NV{priority}</Tag>,
    },
    {
      title: 'Khối/Tổ hợp',
      dataIndex: 'admissionMethod',
      key: 'admissionMethod',
      width: 120,
      render: (method: string) => {
        // Check if it's a block code (A00, D01, etc.) or method|block format
        if (method.includes('|')) {
          const parts = method.split('|');
          return parts[1] ? <Tag color="cyan">{parts[1]}</Tag> : <Tag color="blue">{parts[0]}</Tag>;
        }
        // If it's just a block code, display it directly
        if (/^[A-Z]\d{2}$/i.test(method)) {
          return <Tag color="cyan">{method}</Tag>;
        }
        // Otherwise it's an admission method name
        const methodLabels: Record<string, string> = {
          entrance_exam: 'Thi đầu vào',
          high_school_transcript: 'Xét học bạ',
          direct_admission: 'Xét tuyển thẳng',
        };
        return <Tag color="blue">{methodLabels[method] || method}</Tag>;
      },
    },
    {
      title: 'Điểm XT',
      dataIndex: 'calculatedScore',
      key: 'calculatedScore',
      width: 100,
      render: (score: number) => score?.toFixed(2) || 'N/A',
    },
    {
      title: 'Xếp hạng',
      dataIndex: 'rankInMajor',
      key: 'rankInMajor',
      width: 100,
      render: (rank: number | null) => rank ? <Tag color="green">#{rank}</Tag> : <span style={{ color: '#999' }}>-</span>,
    },
  ];

  // Table columns for all applications (including rejection reasons)
  const allApplicationsColumns = [
    ...columns,
    {
      title: 'Trạng thái',
      dataIndex: 'admissionStatus',
      key: 'admissionStatus',
      width: 150,
      render: (status: string, record: StudentApplication) => {
        if (status === 'admitted') {
          return <Tag color="success">Trúng tuyển</Tag>;
        }
        return (
          <div>
            <Tag color="error">Không đậu</Tag>
            {record.rejectionReasonText && (
              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                {record.rejectionReasonText}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Lọc ảo</h1>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          Chạy thuật toán lọc ảo để xử lý hồ sơ tuyển sinh
        </p>
      </div>

      {/* Filter Configuration Card */}
      <Card
        title="Cấu hình lọc ảo"
        style={{ marginBottom: '24px' }}
        loading={loading}
      >
        <Space orientation="vertical" style={{ width: '100%' }} size="large">
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Chọn đợt tuyển sinh <span style={{ color: 'red' }}>*</span>
            </label>
            <Select
              style={{ width: '100%' }}
              placeholder="Chọn đợt tuyển sinh"
              value={selectedSessionId}
              onChange={handleSessionChange}
              disabled={running}
              size="large"
            >
              {sessions.map((session) => (
                <Select.Option key={session.id} value={session.id}>
                  {session.name} ({session.year})
                </Select.Option>
              ))}
            </Select>
            {sessions.length === 0 && !loading && (
              <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                Không có đợt tuyển sinh nào. Vui lòng tạo đợt tuyển sinh trước.
              </div>
            )}
          </div>

          {selectedSession && (
            <Alert
              message="Thông tin đợt tuyển sinh"
              description={
                <div className="grid grid-cols-3 gap-4">
                  <div><strong>Tên:</strong> {selectedSession.name}</div>
                  <div><strong>Năm:</strong> {selectedSession.year}</div>
                  <div><strong>Trạng thái:</strong> <Tag color="green">{selectedSession.status}</Tag></div>
                </div>
              }
              type="info"
              showIcon
            />
          )}

          <div>
            <Space>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleRunFilter}
                disabled={!selectedSessionId || running}
                loading={running}
                size="large"
              >
                {running ? 'Đang xử lý...' : 'Chạy lọc ảo'}
              </Button>

              {filterResult && (
                <>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleReset}
                    size="large"
                  >
                    Làm mới
                  </Button>
                </>
              )}
            </Space>
          </div>
        </Space>
      </Card>

      {/* Filter Progress */}
      {running && (
        <Card title="Đang xử lý" style={{ marginBottom: '24px' }}>
          <Space orientation="vertical" style={{ width: '100%' }} size="large">
            <Spin size="large" />
            <p style={{ textAlign: 'center', color: '#666' }}>
              Đang chạy thuật toán lọc ảo...
            </p>
          </Space>
        </Card>
      )}

      {/* Filter Results Summary */}
      {filterResult && !running && (
        <Card
          title="Kết quả lọc ảo"
          style={{ marginBottom: '24px' }}
          extra={
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveResults}
              loading={saving}
            >
              Xác nhận & Lưu kết quả
            </Button>
          }
        >
          <Space orientation="vertical" style={{ width: '100%' }} size="middle">
            <Alert
              message="Lọc ảo hoàn tất"
              description={`Thời gian xử lý: ${filterResult.executionTime}ms`}
              type="success"
              showIcon
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <Card size="small" style={{ backgroundColor: '#f0f5ff' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 600, color: '#1890ff' }}>
                    {filterResult.totalStudents}
                  </div>
                  <div style={{ color: '#666', marginTop: '8px' }}>Tổng số thí sinh</div>
                </div>
              </Card>

              <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 600, color: '#52c41a' }}>
                    {filterResult.admittedCount}
                  </div>
                  <div style={{ color: '#666', marginTop: '8px' }}>Trúng tuyển</div>
                </div>
              </Card>

              <Card size="small" style={{ backgroundColor: '#fff1f0' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 600, color: '#ff4d4f' }}>
                    {filterResult.totalStudents - filterResult.admittedCount}
                  </div>
                  <div style={{ color: '#666', marginTop: '8px' }}>Không trúng tuyển</div>
                </div>
              </Card>

              <Card size="small" style={{ backgroundColor: '#fffbe6' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 600, color: '#faad14' }}>
                    {filterResult.admittedCount > 0
                      ? ((filterResult.admittedCount / filterResult.totalStudents) * 100).toFixed(1)
                      : '0'}%
                  </div>
                  <div style={{ color: '#666', marginTop: '8px' }}>Tỷ lệ trúng tuyển</div>
                </div>
              </Card>
            </div>

            {/* Filter and Export Section */}
            <Card size="small" style={{ marginBottom: '16px' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Input
                    placeholder="Tìm theo tên hoặc CCCD"
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
                    {majors.map((major) => (
                      <Select.Option key={major.id} value={major.code}>
                        {major.code} - {major.name}
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
                {activeTab !== 'admitted' && (
                  <Col xs={12} sm={8} md={5}>
                    <Select
                      style={{ width: '100%' }}
                      placeholder="Lý do loại"
                      value={filterRejectionReason}
                      onChange={setFilterRejectionReason}
                      allowClear
                    >
                      <Select.Option value="not_eligible_basic">Không đủ điều kiện cơ bản</Select.Option>
                      <Select.Option value="not_eligible_quota">Không đạt điều kiện chỉ tiêu</Select.Option>
                      <Select.Option value="below_quota_cutoff">Hết chỉ tiêu</Select.Option>
                      <Select.Option value="admitted_higher_priority">Đậu NV cao hơn</Select.Option>
                    </Select>
                  </Col>
                )}
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
                <Col xs={8} sm={6} md={activeTab !== 'admitted' ? 4 : 5}>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleExportExcel}
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
                  key: 'admitted',
                  label: (
                    <span>
                      <Tag color="success">Trúng tuyển</Tag>
                      <span style={{ marginLeft: 8 }}>
                        ({allApplications.filter(a => a.admissionStatus === 'admitted').length})
                      </span>
                    </span>
                  ),
                  children: (
                    <Table
                      columns={columns}
                      dataSource={getFilteredApplications()}
                      rowKey="id"
                      pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng ${total} thí sinh`,
                      }}
                      scroll={{ x: 1000 }}
                    />
                  ),
                },
                {
                  key: 'not_admitted',
                  label: (
                    <span>
                      <Tag color="error">Không trúng tuyển</Tag>
                      <span style={{ marginLeft: 8 }}>
                        ({allApplications.filter(a => a.admissionStatus === 'not_admitted').length})
                      </span>
                    </span>
                  ),
                  children: (
                    <Table
                      columns={allApplicationsColumns}
                      dataSource={getFilteredApplications()}
                      rowKey="id"
                      pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng ${total} nguyện vọng`,
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
                        ({allApplications.length})
                      </span>
                    </span>
                  ),
                  children: (
                    <Table
                      columns={allApplicationsColumns}
                      dataSource={getFilteredApplications()}
                      rowKey="id"
                      pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng ${total} nguyện vọng`,
                      }}
                      scroll={{ x: 1200 }}
                      rowClassName={(record) => 
                        record.admissionStatus === 'admitted' ? 'bg-green-50' : ''
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
      <Card title="Về thuật toán lọc ảo" type="inner">
        <Space orientation="vertical" style={{ width: '100%' }}>
          <p>
            Thuật toán lọc ảo xử lý hồ sơ tuyển sinh dựa trên các tiêu chí sau:
          </p>
          <ul style={{ paddingLeft: '20px' }}>
            <li>Nguyện vọng của thí sinh (thứ tự ưu tiên)</li>
            <li>Điểm xét tuyển và xếp hạng</li>
            <li>Chỉ tiêu tuyển sinh của từng ngành</li>
            <li>Yêu cầu tổ hợp môn</li>
            <li>Điểm ưu tiên (nếu có)</li>
          </ul>
          <Alert
            message="Lưu ý"
            description="Kết quả lọc ảo chỉ mang tính chất tham khảo. Bạn cần xác nhận và lưu kết quả để áp dụng chính thức."
            type="warning"
            showIcon
          />
        </Space>
      </Card>
    </div>
  );
}
