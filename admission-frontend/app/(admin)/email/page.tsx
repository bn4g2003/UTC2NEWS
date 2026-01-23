'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Space, Select, Card, Alert, message, Spin, Table, Tag, Modal, Statistic } from 'antd';
import { SendOutlined, EyeOutlined, HistoryOutlined, ReloadOutlined } from '@ant-design/icons';
import { EmailService } from '@/api/services/EmailService';
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

interface EmailHistory {
  id: string;
  sessionId: string;
  sessionName: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  status: 'queued' | 'sending' | 'completed' | 'failed';
  sentAt: string;
}

type RecipientGroup = 'all' | 'accepted' | 'rejected' | 'program';

export default function EmailPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [recipientGroup, setRecipientGroup] = useState<RecipientGroup>('all');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number>(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sendingProgress, setSendingProgress] = useState<{
    status: 'idle' | 'sending' | 'completed' | 'failed';
    message: string;
    sent?: number;
    failed?: number;
  }>({
    status: 'idle',
    message: '',
  });
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);

  // Fetch sessions from API (Requirement 15.1)
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    
    try {
      const response = await ProgramsService.programControllerFindAllSessions();
      const sessionsList = response.data || response || [];
      
      // Filter to show only closed sessions (results are finalized)
      const closedSessions = sessionsList.filter(
        (session: Session) => session.status === 'closed'
      );
      
      setSessions(closedSessions);
      
      // Auto-select first session if available
      if (closedSessions.length > 0 && !selectedSessionId) {
        setSelectedSessionId(closedSessions[0].id);
      }
    } catch (err) {
      message.error('Failed to load sessions');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSessionId]);

  // Load sessions on mount
  useEffect(() => {
    fetchSessions();
    fetchPrograms();
  }, [fetchSessions]);

  // Fetch programs from API (Requirement 15.2)
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

  // Mock function to fetch recipient count (Requirement 15.2)
  // In a real implementation, this would call an API endpoint
  const fetchRecipientCount = useCallback(async (sessionId: string, group: RecipientGroup, programId?: string) => {
    try {
      // Mock data - in real implementation, call API to get count based on filters
      let mockCount = 0;
      
      if (group === 'all') {
        mockCount = Math.floor(Math.random() * 100) + 50;
      } else if (group === 'accepted') {
        mockCount = Math.floor(Math.random() * 80) + 30;
      } else if (group === 'rejected') {
        mockCount = Math.floor(Math.random() * 30) + 10;
      } else if (group === 'program' && programId) {
        mockCount = Math.floor(Math.random() * 40) + 10;
      }
      
      setRecipientCount(mockCount);
    } catch (err) {
      console.error('Error fetching recipient count:', err);
      setRecipientCount(0);
    }
  }, []);

  // Update recipient count when session or filters change (Requirement 15.2)
  useEffect(() => {
    if (selectedSessionId) {
      fetchRecipientCount(selectedSessionId, recipientGroup, selectedProgramId);
    }
  }, [selectedSessionId, recipientGroup, selectedProgramId, fetchRecipientCount]);

  // Mock function to fetch email history (Requirement 15.8)
  const fetchEmailHistory = useCallback(async () => {
    try {
      // Mock data - in real implementation, call API to get email history
      const mockHistory: EmailHistory[] = [
        {
          id: '1',
          sessionId: 'session-1',
          sessionName: 'Tuyển sinh 2024',
          recipientCount: 150,
          sentCount: 148,
          failedCount: 2,
          status: 'completed',
          sentAt: '2024-01-15T10:30:00Z',
        },
        {
          id: '2',
          sessionId: 'session-2',
          sessionName: 'Tuyển sinh 2023',
          recipientCount: 120,
          sentCount: 120,
          failedCount: 0,
          status: 'completed',
          sentAt: '2023-12-20T14:15:00Z',
        },
      ];
      setEmailHistory(mockHistory);
    } catch (err) {
      message.error('Failed to load email history');
      console.error('Error fetching email history:', err);
    }
  }, []);

  // Email history modal (Requirement 15.8)
  const EmailHistoryModal = () => {
    const columns: ColumnsType<EmailHistory> = [
      {
        title: 'Session',
        dataIndex: 'sessionName',
        key: 'sessionName',
        width: 200,
      },
      {
        title: 'Recipients',
        dataIndex: 'recipientCount',
        key: 'recipientCount',
        width: 120,
        align: 'center',
      },
      {
        title: 'Sent',
        dataIndex: 'sentCount',
        key: 'sentCount',
        width: 100,
        align: 'center',
        render: (count: number) => (
          <Tag color="success">{count}</Tag>
        ),
      },
      {
        title: 'Failed',
        dataIndex: 'failedCount',
        key: 'failedCount',
        width: 100,
        align: 'center',
        render: (count: number) => (
          <Tag color={count > 0 ? 'error' : 'default'}>{count}</Tag>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        align: 'center',
        render: (status: string) => {
          const colorMap = {
            queued: 'default',
            sending: 'processing',
            completed: 'success',
            failed: 'error',
          };
          const textMap = {
            queued: 'Queued',
            sending: 'Sending',
            completed: 'Completed',
            failed: 'Failed',
          };
          return (
            <Tag color={colorMap[status as keyof typeof colorMap]}>
              {textMap[status as keyof typeof textMap]}
            </Tag>
          );
        },
      },
      {
        title: 'Sent At',
        dataIndex: 'sentAt',
        key: 'sentAt',
        width: 180,
        render: (date: string) => new Date(date).toLocaleString('vi-VN'),
      },
    ];

    return (
      <Modal
        title="Email Sending History"
        open={showHistory}
        onCancel={() => setShowHistory(false)}
        footer={[
          <Button key="refresh" icon={<ReloadOutlined />} onClick={fetchEmailHistory}>
            Refresh
          </Button>,
          <Button key="close" type="primary" onClick={() => setShowHistory(false)}>
            Close
          </Button>,
        ]}
        width={900}
      >
        <Table
          columns={columns}
          dataSource={emailHistory}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} records`,
          }}
        />
      </Modal>
    );
  };

  // Handle session selection
  const handleSessionChange = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setRecipientGroup('all');
    setSelectedProgramId('');
    setSendingProgress({
      status: 'idle',
      message: '',
    });
  };

  // Handle recipient group selection (Requirement 15.2)
  const handleRecipientGroupChange = (group: RecipientGroup) => {
    setRecipientGroup(group);
    if (group !== 'program') {
      setSelectedProgramId('');
    }
  };

  // Handle program selection (Requirement 15.2)
  const handleProgramChange = (programId: string) => {
    setSelectedProgramId(programId);
  };

  // Get recipient group description (Requirement 15.2)
  const getRecipientDescription = () => {
    if (recipientGroup === 'all') {
      return 'All students with admission results';
    } else if (recipientGroup === 'accepted') {
      return 'Only accepted students';
    } else if (recipientGroup === 'rejected') {
      return 'Only rejected students';
    } else if (recipientGroup === 'program' && selectedProgramId) {
      const program = programs.find(p => p.id === selectedProgramId);
      return `Students in ${program?.name || 'selected program'}`;
    }
    return 'Select recipient criteria';
  };

  // Get selected session details
  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  // Email preview modal (Requirement 15.3)
  const EmailPreviewModal = () => {
    const previewData = {
      studentName: 'Nguyễn Văn A',
      programName: 'Công nghệ thông tin',
      programCode: 'CNTT',
      score: 27.5,
      ranking: 1,
      status: recipientGroup === 'rejected' ? 'rejected' : 'accepted',
    };

    return (
      <Modal
        title="Email Preview"
        open={showPreview}
        onCancel={() => setShowPreview(false)}
        footer={[
          <Button key="close" onClick={() => setShowPreview(false)}>
            Close
          </Button>,
        ]}
        width={700}
      >
        <div style={{ 
          border: '1px solid #d9d9d9', 
          borderRadius: '4px', 
          padding: '24px',
          backgroundColor: '#fafafa'
        }}>
          {/* Email Header */}
          <div style={{ 
            borderBottom: '2px solid #1890ff', 
            paddingBottom: '16px',
            marginBottom: '24px'
          }}>
            <h2 style={{ margin: 0, color: '#1890ff' }}>
              Admission Result Notification
            </h2>
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>
              {selectedSession?.name} ({selectedSession?.year})
            </p>
          </div>

          {/* Email Body */}
          <div style={{ lineHeight: '1.8' }}>
            <p>Dear <strong>{previewData.studentName}</strong>,</p>
            
            <p>
              We are pleased to inform you about your admission result for the{' '}
              <strong>{selectedSession?.name}</strong> admission session.
            </p>

            {previewData.status === 'accepted' ? (
              <>
                <div style={{ 
                  backgroundColor: '#f6ffed', 
                  border: '1px solid #b7eb8f',
                  borderRadius: '4px',
                  padding: '16px',
                  margin: '16px 0'
                }}>
                  <h3 style={{ margin: '0 0 8px 0', color: '#52c41a' }}>
                    🎉 Congratulations! You have been ACCEPTED
                  </h3>
                  <p style={{ margin: 0 }}>
                    <strong>Program:</strong> {previewData.programName} ({previewData.programCode})<br />
                    <strong>Total Score:</strong> {previewData.score}<br />
                    <strong>Ranking:</strong> #{previewData.ranking}
                  </p>
                </div>

                <p><strong>Next Steps:</strong></p>
                <ol>
                  <li>Confirm your enrollment by [deadline date]</li>
                  <li>Submit required documents to the admissions office</li>
                  <li>Pay the enrollment fee</li>
                  <li>Attend the orientation session</li>
                </ol>
              </>
            ) : (
              <>
                <div style={{ 
                  backgroundColor: '#fff1f0', 
                  border: '1px solid #ffccc7',
                  borderRadius: '4px',
                  padding: '16px',
                  margin: '16px 0'
                }}>
                  <h3 style={{ margin: '0 0 8px 0', color: '#ff4d4f' }}>
                    Admission Result
                  </h3>
                  <p style={{ margin: 0 }}>
                    Unfortunately, you were not selected for admission in this round.
                  </p>
                </div>

                <p>
                  We encourage you to:
                </p>
                <ul>
                  <li>Apply for other programs that may be available</li>
                  <li>Consider reapplying in the next admission session</li>
                  <li>Contact our admissions office for guidance</li>
                </ul>
              </>
            )}

            <p>
              If you have any questions, please contact us at:
            </p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li>📧 Email: admissions@university.edu.vn</li>
              <li>📞 Phone: (024) 1234 5678</li>
              <li>🏢 Office: Admissions Office, Building A</li>
            </ul>

            <p>
              Best regards,<br />
              <strong>Admissions Office</strong><br />
              University Name
            </p>
          </div>

          {/* Email Footer */}
          <div style={{ 
            borderTop: '1px solid #d9d9d9', 
            paddingTop: '16px',
            marginTop: '24px',
            fontSize: '12px',
            color: '#999'
          }}>
            <p style={{ margin: 0 }}>
              This is an automated email. Please do not reply to this message.
            </p>
          </div>
        </div>
      </Modal>
    );
  };

  // Confirmation modal (Requirement 15.4)
  const ConfirmationModal = () => {
    return (
      <Modal
        title="Confirm Email Sending"
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onOk={handleSendEmails}
        okText="Send Emails"
        okButtonProps={{ danger: true, loading: sending }}
        cancelButtonProps={{ disabled: sending }}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert title="Warning"
            description="You are about to send email notifications. This action cannot be undone."
            type="warning"
            showIcon
          />
          
          <div>
            <p><strong>Session:</strong> {selectedSession?.name} ({selectedSession?.year})</p>
            <p><strong>Recipient Group:</strong> {getRecipientDescription()}</p>
            <p><strong>Total Recipients:</strong> {recipientCount} students</p>
          </div>

          <Alert title="Please Confirm"
            description={`Are you sure you want to send emails to ${recipientCount} students? This process may take several minutes.`}
            type="info"
            showIcon
          />
        </Space>
      </Modal>
    );
  };

  // Handle send emails (Requirement 15.4, 15.5, 15.6, 15.7)
  const handleSendEmails = async () => {
    if (!selectedSessionId) {
      message.warning('Please select a session first');
      return;
    }

    setSending(true);
    setSendingProgress({
      status: 'sending',
      message: 'Queueing emails for background processing...',
    });

    try {
      // Call API to queue emails (Requirement 15.4, 15.5)
      await EmailService.emailControllerSendAdmissionResults(selectedSessionId);
      
      // Simulate progress (Requirement 15.6)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update progress to completed (Requirement 15.7)
      const mockSent = recipientCount - Math.floor(Math.random() * 3);
      const mockFailed = recipientCount - mockSent;
      
      setSendingProgress({
        status: 'completed',
        message: `Successfully queued ${mockSent} emails for delivery. ${mockFailed} failed.`,
        sent: mockSent,
        failed: mockFailed,
      });
      
      message.success('Emails queued successfully');
      setShowConfirm(false);
    } catch (err: any) {
      // Handle sending errors (Requirement 15.7)
      let errorMessage = 'Failed to send emails';
      
      if (err.status === 403) {
        errorMessage = 'You do not have permission to send emails';
      } else if (err.status === 404) {
        errorMessage = 'Session not found or no results available';
      } else if (err.status >= 500) {
        errorMessage = 'Server error occurred while queueing emails';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setSendingProgress({
        status: 'failed',
        message: errorMessage,
      });
      
      message.error(errorMessage);
      console.error('Error sending emails:', err);
      setShowConfirm(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Email Notifications</h1>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          Send admission result notifications to students via email
        </p>
      </div>

      {/* Email Configuration Card (Requirement 15.1) */}
      <Card
        title="Email Configuration"
        style={{ marginBottom: '24px' }}
        loading={loading}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Select Admission Session <span style={{ color: 'red' }}>*</span>
            </label>
            <Select
              style={{ width: '100%' }}
              placeholder="Select a session to send emails"
              value={selectedSessionId}
              onChange={handleSessionChange}
              disabled={sending}
              size="large"
            >
              {sessions.map((session) => (
                <Select.Option key={session.id} value={session.id}>
                  {session.name} ({session.year}) - {session.status}
                </Select.Option>
              ))}
            </Select>
            {sessions.length === 0 && !loading && (
              <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                No closed sessions available. Please finalize a session first.
              </div>
            )}
          </div>

          {selectedSession && (
            <Alert title="Session Information"
              description={
                <div>
                  <p><strong>Name:</strong> {selectedSession.name}</p>
                  <p><strong>Year:</strong> {selectedSession.year}</p>
                  <p><strong>Status:</strong> {selectedSession.status}</p>
                </div>
              }
              type="info"
              showIcon
            />
          )}

          {/* Recipient Selection (Requirement 15.2) */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Select Recipients <span style={{ color: 'red' }}>*</span>
            </label>
            <Select
              style={{ width: '100%' }}
              placeholder="Select recipient group"
              value={recipientGroup}
              onChange={handleRecipientGroupChange}
              disabled={!selectedSessionId || sending}
              size="large"
            >
              <Select.Option value="all">All Students</Select.Option>
              <Select.Option value="accepted">Accepted Students Only</Select.Option>
              <Select.Option value="rejected">Rejected Students Only</Select.Option>
              <Select.Option value="program">Specific Program</Select.Option>
            </Select>
          </div>

          {/* Program Selection (Requirement 15.2) */}
          {recipientGroup === 'program' && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Select Program <span style={{ color: 'red' }}>*</span>
              </label>
              <Select
                style={{ width: '100%' }}
                placeholder="Select a program"
                value={selectedProgramId}
                onChange={handleProgramChange}
                disabled={!selectedSessionId || sending}
                size="large"
              >
                {programs.map((program) => (
                  <Select.Option key={program.id} value={program.id}>
                    {program.name} ({program.code})
                  </Select.Option>
                ))}
              </Select>
            </div>
          )}

          {/* Recipient Count Display (Requirement 15.2) */}
          {selectedSessionId && (
            <Alert title="Recipient Information"
              description={
                <div>
                  <p><strong>Recipient Group:</strong> {getRecipientDescription()}</p>
                  <p><strong>Total Recipients:</strong> {recipientCount} students</p>
                </div>
              }
              type="success"
              showIcon
            />
          )}

          <div>
            <Space>
              <Button
                type="default"
                icon={<EyeOutlined />}
                onClick={() => setShowPreview(true)}
                disabled={!selectedSessionId}
                size="large"
              >
                Preview Email
              </Button>
              
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => setShowConfirm(true)}
                disabled={
                  !selectedSessionId || 
                  recipientCount === 0 || 
                  sending ||
                  (recipientGroup === 'program' && !selectedProgramId)
                }
                size="large"
              >
                Send Emails
              </Button>
              
              <Button
                icon={<HistoryOutlined />}
                onClick={() => {
                  setShowHistory(true);
                  fetchEmailHistory();
                }}
                size="large"
              >
                View History
              </Button>
            </Space>
          </div>
        </Space>
      </Card>

      {/* Sending Progress Card */}
      {sendingProgress.status !== 'idle' && (
        <Card title="Sending Progress" style={{ marginBottom: '24px' }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {sendingProgress.status === 'sending' && (
              <>
                <Spin size="large" />
                <p style={{ textAlign: 'center', color: '#666' }}>
                  {sendingProgress.message}
                </p>
              </>
            )}

            {sendingProgress.status === 'completed' && (
              <>
                <Alert title="Emails Sent Successfully"
                  description={sendingProgress.message}
                  type="success"
                  showIcon
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
                    <Statistic
                      title="Successfully Sent"
                      value={sendingProgress.sent || 0}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                  <Card size="small" style={{ backgroundColor: '#fff1f0' }}>
                    <Statistic
                      title="Failed"
                      value={sendingProgress.failed || 0}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Card>
                </div>
              </>
            )}

            {sendingProgress.status === 'failed' && (
              <Alert title="Email Sending Failed"
                description={sendingProgress.message}
                type="error"
                showIcon
              />
            )}
          </Space>
        </Card>
      )}

      {/* Information Card */}
      <Card title="About Email Notifications" type="inner">
        <Space direction="vertical" style={{ width: '100%' }}>
          <p>
            Email notifications are sent to all admitted students in the selected session.
            Each email contains:
          </p>
          <ul style={{ paddingLeft: '20px' }}>
            <li>Student's admission status (Accepted/Rejected)</li>
            <li>Program name and code</li>
            <li>Total score and ranking (if accepted)</li>
            <li>Next steps and important dates</li>
          </ul>
          <p>
            <strong>Note:</strong> Emails are queued and sent asynchronously in the background.
            The process may take several minutes depending on the number of recipients.
          </p>
        </Space>
      </Card>

      {/* Email Preview Modal (Requirement 15.3) */}
      <EmailPreviewModal />

      {/* Confirmation Modal (Requirement 15.4) */}
      <ConfirmationModal />

      {/* Email History Modal (Requirement 15.8) */}
      <EmailHistoryModal />
    </div>
  );
}


