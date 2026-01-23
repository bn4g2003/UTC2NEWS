'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Space, Select, Card, Table, Tag, message, Spin, Empty } from 'antd';
import { DownloadOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { ResultsService } from '@/api/services/ResultsService';
import { ProgramsService } from '@/api/services/ProgramsService';
import type { ColumnsType } from 'antd/es/table';

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
  const [previewVisible, setPreviewVisible] = useState(false);

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
      const data = response.data || response || [];

      const formattedResults: ResultRecord[] = data.map((item: any) => ({
        id: `${item.studentId}-${item.majorCode}`,
        studentId: item.studentId,
        fullName: item.fullName,
        idCardNumber: item.idCard,
        program: item.majorName,
        programCode: item.majorCode,
        admissionMethod: item.admissionMethod,
        score: item.finalScore,
        ranking: item.ranking,
        preference: item.preference,
        status: 'accepted',
      }));

      setResults(formattedResults);
    } catch (err) {
      message.error('Failed to load results');
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
    setPreviewVisible(false);
  };

  // Handle program filter (Requirement 14.2)
  const handleProgramChange = (programId: string) => {
    setSelectedProgramId(programId);
  };

  // Handle status filter (Requirement 14.2)
  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
  };

  // Filter results based on selected filters (Requirement 14.2)
  const filteredResults = results.filter((result) => {
    if (selectedProgramId !== 'all') {
      const program = programs.find(p => p.id === selectedProgramId);
      if (program && result.programCode !== program.code) {
        return false;
      }
    }

    if (selectedStatus !== 'all' && result.status !== selectedStatus) {
      return false;
    }

    return true;
  });

  // Handle preview results (Requirement 14.7)
  const handlePreview = () => {
    setPreviewVisible(true);
  };

  // Handle export to Excel (Requirement 14.3, 14.4, 14.5, 14.6)
  const handleExport = async () => {
    if (!selectedSessionId) {
      message.warning('Please select a session first');
      return;
    }

    setExporting(true);

    try {
      // Call API to generate Excel file (Requirement 14.3)
      const blob = await ResultsService.resultControllerExportResults(selectedSessionId);

      // Create download link and trigger download (Requirement 14.5)
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Get session name for filename
      const session = sessions.find(s => s.id === selectedSessionId);
      const filename = `admission_results_${session?.name || 'session'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      window.URL.revokeObjectURL(url);

      message.success('Results exported successfully');
    } catch (err: any) {
      // Handle export errors (Requirement 14.6)
      let errorMessage = 'Failed to export results';

      if (err.status === 403) {
        errorMessage = 'You do not have permission to export results';
      } else if (err.status === 404) {
        errorMessage = 'Session not found or no results available';
      } else if (err.status >= 500) {
        errorMessage = 'Server error occurred while generating export';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      message.error(errorMessage);
      console.error('Error exporting results:', err);
    } finally {
      setExporting(false);
    }
  };

  // Table columns for results preview
  const columns: ColumnsType<ResultRecord> = [
    {
      title: 'Student ID',
      dataIndex: 'studentId',
      key: 'studentId',
      width: 120,
    },
    {
      title: 'Full Name',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 200,
    },
    {
      title: 'ID Card',
      dataIndex: 'idCardNumber',
      key: 'idCardNumber',
      width: 150,
    },
    {
      title: 'Program',
      dataIndex: 'program',
      key: 'program',
      width: 200,
      render: (text, record) => `${text} (${record.programCode})`,
    },
    {
      title: 'Khối/Tổ hợp',
      dataIndex: 'admissionMethod',
      key: 'admissionMethod',
      width: 120,
      align: 'center',
    },
    {
      title: 'Preference',
      dataIndex: 'preference',
      key: 'preference',
      width: 100,
      align: 'center',
      render: (pref: number) => `NV${pref}`,
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.score - b.score,
    },
    {
      title: 'Ranking',
      dataIndex: 'ranking',
      key: 'ranking',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.ranking - b.ranking,
    },
    {
      title: 'Status',
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
          accepted: 'Accepted',
          rejected: 'Rejected',
          pending: 'Pending',
        };
        return (
          <Tag color={colorMap[status as keyof typeof colorMap]}>
            {textMap[status as keyof typeof textMap]}
          </Tag>
        );
      },
      filters: [
        { text: 'Accepted', value: 'accepted' },
        { text: 'Rejected', value: 'rejected' },
        { text: 'Pending', value: 'pending' },
      ],
      onFilter: (value, record) => record.status === value,
    },
  ];

  // Get selected session details
  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  // Calculate statistics
  const stats = {
    total: filteredResults.length,
    accepted: filteredResults.filter(r => r.status === 'accepted').length,
    rejected: filteredResults.filter(r => r.status === 'rejected').length,
    pending: filteredResults.filter(r => r.status === 'pending').length,
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Results Export</h1>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          View and export admission results to Excel
        </p>
      </div>

      {/* Filter Configuration Card (Requirement 14.1, 14.2) */}
      <Card
        title="Filter Results"
        style={{ marginBottom: '24px' }}
        loading={loading && !selectedSessionId}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Admission Session <span style={{ color: 'red' }}>*</span>
              </label>
              <Select
                style={{ width: '100%' }}
                placeholder="Select a session"
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

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Program
              </label>
              <Select
                style={{ width: '100%' }}
                placeholder="All programs"
                value={selectedProgramId}
                onChange={handleProgramChange}
                size="large"
              >
                <Select.Option value="all">All Programs</Select.Option>
                {programs.map((program) => (
                  <Select.Option key={program.id} value={program.id}>
                    {program.name} ({program.code})
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Status
              </label>
              <Select
                style={{ width: '100%' }}
                placeholder="All statuses"
                value={selectedStatus}
                onChange={handleStatusChange}
                size="large"
              >
                <Select.Option value="all">All Statuses</Select.Option>
                <Select.Option value="accepted">Accepted</Select.Option>
                <Select.Option value="rejected">Rejected</Select.Option>
                <Select.Option value="pending">Pending</Select.Option>
              </Select>
            </div>
          </div>

          <div>
            <Space>
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={handlePreview}
                disabled={!selectedSessionId || filteredResults.length === 0}
                size="large"
              >
                Preview Results
              </Button>

              <Button
                type="default"
                icon={<DownloadOutlined />}
                onClick={handleExport}
                disabled={!selectedSessionId}
                loading={exporting}
                size="large"
              >
                Export to Excel
              </Button>

              <Button
                icon={<ReloadOutlined />}
                onClick={fetchResults}
                disabled={!selectedSessionId}
                size="large"
              >
                Refresh
              </Button>
            </Space>
          </div>
        </Space>
      </Card>

      {/* Statistics Card */}
      {selectedSessionId && (
        <Card title="Statistics" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <Card size="small" style={{ backgroundColor: '#f0f5ff' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 600, color: '#1890ff' }}>
                  {stats.total}
                </div>
                <div style={{ color: '#666', marginTop: '8px' }}>Total Results</div>
              </div>
            </Card>

            <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 600, color: '#52c41a' }}>
                  {stats.accepted}
                </div>
                <div style={{ color: '#666', marginTop: '8px' }}>Accepted</div>
              </div>
            </Card>

            <Card size="small" style={{ backgroundColor: '#fff1f0' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 600, color: '#ff4d4f' }}>
                  {stats.rejected}
                </div>
                <div style={{ color: '#666', marginTop: '8px' }}>Rejected</div>
              </div>
            </Card>

            <Card size="small" style={{ backgroundColor: '#fffbe6' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 600, color: '#faad14' }}>
                  {stats.pending}
                </div>
                <div style={{ color: '#666', marginTop: '8px' }}>Pending</div>
              </div>
            </Card>
          </div>
        </Card>
      )}

      {/* Results Preview Card (Requirement 14.7) */}
      {previewVisible && selectedSessionId && (
        <Card title="Results Preview">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <p style={{ marginTop: '16px', color: '#666' }}>Loading results...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <Empty
              description="No results found for the selected filters"
              style={{ padding: '40px' }}
            />
          ) : (
            <Table
              columns={columns}
              dataSource={filteredResults}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} results`,
              }}
              scroll={{ x: 1000 }}
            />
          )}
        </Card>
      )}

      {/* Information Card */}
      {!selectedSessionId && (
        <Card title="Getting Started" type="inner">
          <Space direction="vertical" style={{ width: '100%' }}>
            <p>
              To view and export admission results:
            </p>
            <ol style={{ paddingLeft: '20px' }}>
              <li>Select an admission session from the dropdown above</li>
              <li>Optionally filter by program or status</li>
              <li>Click "Preview Results" to view the results in a table</li>
              <li>Click "Export to Excel" to download the results as an Excel file</li>
            </ol>
            <p>
              <strong>Note:</strong> You must run the Virtual Filter first to generate results
              for a session before you can export them.
            </p>
          </Space>
        </Card>
      )}
    </div>
  );
}

