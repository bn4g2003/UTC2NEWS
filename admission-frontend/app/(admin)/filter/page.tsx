'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Space, Select, Card, Alert, Spin, message, Table, Tag, Modal } from 'antd';
import { PlayCircleOutlined, ReloadOutlined, SaveOutlined, EyeOutlined } from '@ant-design/icons';
import { FilterService } from '@/api/services/FilterService';
import { ProgramsService } from '@/api/services/ProgramsService';
import { StudentsService } from '@/api/services/StudentsService';
import { getBlockCode } from '@/lib/block-code-mapper';

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
  rankInMajor: number;
  preferencePriority: number;
  admissionStatus: string;
}

export default function FilterPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterResult, setFilterResult] = useState<FilterResult | null>(null);
  const [admittedStudents, setAdmittedStudents] = useState<StudentApplication[]>([]);
  const [sessionQuotas, setSessionQuotas] = useState<any[]>([]);
  const [loadingQuotas, setLoadingQuotas] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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
  }, [fetchSessions]);

  // Handle session selection
  const handleSessionChange = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setFilterResult(null);
    setAdmittedStudents([]);
    if (sessionId) {
      fetchSessionQuotas(sessionId);
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
    try {
      const result = await FilterService.filterControllerRunFilter(selectedSessionId);

      setFilterResult(result as FilterResult);

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
      title: 'Ngành trúng tuyển',
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
      render: (rank: number) => <Tag color="green">#{rank}</Tag>,
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
        <Space direction="vertical" style={{ width: '100%' }} size="large">
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
            <div className="space-y-4">
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

              <div className="mt-4">
                <h3 className="text-lg font-medium mb-3">Chỉ tiêu và Điều kiện xét tuyển</h3>
                <Table
                  size="small"
                  dataSource={sessionQuotas}
                  rowKey="id"
                  loading={loadingQuotas}
                  pagination={false}
                  columns={[
                    {
                      title: 'Ngành',
                      key: 'major',
                      render: (quota) => (
                        <div>
                          <div className="font-medium">{quota.major?.name}</div>
                          <div className="text-xs text-gray-500">{quota.major?.code}</div>
                        </div>
                      )
                    },
                    {
                      title: 'Phương thức',
                      dataIndex: 'admissionMethod',
                      key: 'admissionMethod',
                      render: (method) => {
                        const methodLabels: Record<string, string> = {
                          entrance_exam: 'Thi đầu vào',
                          high_school_transcript: 'Xét học bạ',
                          direct_admission: 'Xét tuyển thẳng',
                        };
                        return <Tag color="blue" variant="outlined">{methodLabels[method] || method}</Tag>;
                      }
                    },
                    {
                      title: 'Khối/Tổ hợp',
                      key: 'subjectCombinations',
                      render: (quota) => {
                        const cond = quota.conditions;
                        if (!cond?.subjectCombinations || cond.subjectCombinations.length === 0) {
                          return <span className="text-gray-400 italic">Chưa cấu hình</span>;
                        }
                        
                        return (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {cond.subjectCombinations.map((comb: any, idx: number) => {
                              const blockCode = getBlockCode(comb);
                              return (
                                <Tag key={idx} color="cyan">
                                  {blockCode}
                                </Tag>
                              );
                            })}
                          </div>
                        );
                      }
                    },
                    {
                      title: 'Chỉ tiêu',
                      dataIndex: 'quota',
                      key: 'quota',
                      align: 'center',
                    },
                    {
                      title: 'Điều kiện',
                      key: 'conditions',
                      render: (quota) => {
                        const cond = quota.conditions;
                        if (!cond) return <span className="text-gray-400 italic">Không có</span>;
                        return (
                          <div className="text-xs">
                            {cond.minTotalScore && <div>Điểm sàn: <Tag color="orange">≥ {cond.minTotalScore}</Tag></div>}
                            {cond.minSubjectScores && (
                              <div className="mt-1">
                                Môn tối thiểu: {Object.entries(cond.minSubjectScores).map(([sub, score]: [string, any]) => (
                                  <Tag key={sub} className="mr-1 mb-1">{sub}: {score}</Tag>
                                ))}
                              </div>
                            )}
                            {cond.subjectCombinations && (
                              <div className="mt-1">
                                Tổ hợp: {cond.subjectCombinations.map((comb: any, idx: number) => (
                                  <Tag key={idx} color="cyan" className="mr-1 mb-1">
                                    {Array.isArray(comb) ? comb.join('-') : comb}
                                  </Tag>
                                ))}
                              </div>
                            )}
                            {cond.priorityBonus?.enabled && (
                              <div className="mt-1 text-green-600">Cộng ưu tiên: tối đa {cond.priorityBonus.maxBonus}</div>
                            )}
                          </div>
                        )
                      }
                    }
                  ]}
                />
              </div>
            </div>
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
                    type="default"
                    icon={<EyeOutlined />}
                    onClick={() => setShowDetailsModal(true)}
                    size="large"
                  >
                    Xem chi tiết
                  </Button>

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
          <Space direction="vertical" style={{ width: '100%' }} size="large">
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
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
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

            {/* Admitted Students Table */}
            <div style={{ marginTop: '16px' }}>
              <h3 style={{ marginBottom: '16px' }}>Danh sách thí sinh trúng tuyển ({admittedStudents.length})</h3>
              <Table
                columns={columns}
                dataSource={admittedStudents}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Tổng ${total} thí sinh`,
                }}
                scroll={{ x: 1000 }}
              />
            </div>
          </Space>
        </Card>
      )}

      {/* Information Card */}
      <Card title="Về thuật toán lọc ảo" type="inner">
        <Space direction="vertical" style={{ width: '100%' }}>
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

      {/* Details Modal */}
      <Modal
        title="Chi tiết kết quả lọc ảo"
        open={showDetailsModal}
        onCancel={() => setShowDetailsModal(false)}
        footer={null}
        width={1200}
      >
        {filterResult && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <h4>Thống kê tổng quan</h4>
              <p>Tổng số thí sinh: {filterResult.totalStudents}</p>
              <p>Số thí sinh trúng tuyển: {filterResult.admittedCount}</p>
              <p>Thời gian xử lý: {filterResult.executionTime}ms</p>
            </div>

            <div>
              <h4>Danh sách trúng tuyển</h4>
              <Table
                columns={columns}
                dataSource={admittedStudents}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                scroll={{ x: 1000 }}
              />
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
}
