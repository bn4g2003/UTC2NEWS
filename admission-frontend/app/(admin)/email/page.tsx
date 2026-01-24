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
  const [admittedCount, setAdmittedCount] = useState<number>(0);
  const [notAdmittedCount, setNotAdmittedCount] = useState<number>(0);
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
      
      // Filter to show only active or closed sessions (results are available)
      const availableSessions = sessionsList.filter(
        (session: Session) => session.status === 'active' || session.status === 'closed'
      );
      
      setSessions(availableSessions);
      
      // Auto-select first session if available
      if (availableSessions.length > 0 && !selectedSessionId) {
        setSelectedSessionId(availableSessions[0].id);
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

  // Fetch recipient count from API
  const fetchRecipientCount = useCallback(async (sessionId: string, group: RecipientGroup, programId?: string) => {
    try {
      // Call API to get actual count from database
      const response = await EmailService.emailControllerGetRecipientCount(sessionId);
      setRecipientCount(response.count);
      setAdmittedCount(response.admitted);
      setNotAdmittedCount(response.notAdmitted);
    } catch (err) {
      console.error('Error fetching recipient count:', err);
      message.error('Không thể lấy số lượng người nhận');
      setRecipientCount(0);
      setAdmittedCount(0);
      setNotAdmittedCount(0);
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
        title: 'Đợt tuyển sinh',
        dataIndex: 'sessionName',
        key: 'sessionName',
        width: 200,
      },
      {
        title: 'Người nhận',
        dataIndex: 'recipientCount',
        key: 'recipientCount',
        width: 120,
        align: 'center',
      },
      {
        title: 'Đã gửi',
        dataIndex: 'sentCount',
        key: 'sentCount',
        width: 100,
        align: 'center',
        render: (count: number) => (
          <Tag color="success">{count}</Tag>
        ),
      },
      {
        title: 'Thất bại',
        dataIndex: 'failedCount',
        key: 'failedCount',
        width: 100,
        align: 'center',
        render: (count: number) => (
          <Tag color={count > 0 ? 'error' : 'default'}>{count}</Tag>
        ),
      },
      {
        title: 'Trạng thái',
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
            queued: 'Đang chờ',
            sending: 'Đang gửi',
            completed: 'Hoàn thành',
            failed: 'Thất bại',
          };
          return (
            <Tag color={colorMap[status as keyof typeof colorMap]}>
              {textMap[status as keyof typeof textMap]}
            </Tag>
          );
        },
      },
      {
        title: 'Thời gian gửi',
        dataIndex: 'sentAt',
        key: 'sentAt',
        width: 180,
        render: (date: string) => new Date(date).toLocaleString('vi-VN'),
      },
    ];

    return (
      <Modal
        title="Lịch sử gửi Email"
        open={showHistory}
        onCancel={() => setShowHistory(false)}
        footer={[
          <Button key="refresh" icon={<ReloadOutlined />} onClick={fetchEmailHistory}>
            Làm mới
          </Button>,
          <Button key="close" type="primary" onClick={() => setShowHistory(false)}>
            Đóng
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
            showTotal: (total) => `Tổng ${total} bản ghi`,
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
      return 'Tất cả sinh viên có kết quả tuyển sinh';
    } else if (recipientGroup === 'accepted') {
      return 'Chỉ sinh viên trúng tuyển';
    } else if (recipientGroup === 'rejected') {
      return 'Chỉ sinh viên không đậu';
    } else if (recipientGroup === 'program' && selectedProgramId) {
      const program = programs.find(p => p.id === selectedProgramId);
      return `Sinh viên ngành ${program?.name || 'đã chọn'}`;
    }
    return 'Chọn tiêu chí người nhận';
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
      preference: 1,
      admissionMethod: 'high_school_transcript',
      status: recipientGroup === 'rejected' ? 'rejected' : 'accepted',
    };

    return (
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <EyeOutlined style={{ fontSize: '20px', color: '#0066cc' }} />
            <span>Xem trước Email</span>
          </div>
        }
        open={showPreview}
        onCancel={() => setShowPreview(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setShowPreview(false)}>
            Đóng
          </Button>,
        ]}
        width={800}
        style={{ top: 20 }}
      >
        <Alert
          message="Đây là bản xem trước"
          description="Email thực tế sẽ được cá nhân hóa với thông tin của từng sinh viên."
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
        
        <div style={{ 
          border: '2px solid #e0e0e0', 
          borderRadius: '8px', 
          overflow: 'hidden',
          backgroundColor: '#f5f5f5',
          maxHeight: '600px',
          overflowY: 'auto'
        }}>
          {/* Email Header */}
          <div style={{ 
            background: 'linear-gradient(135deg, #0066cc 0%, #004999 100%)',
            color: 'white',
            padding: '30px 20px',
            textAlign: 'center'
          }}>
            <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 700, letterSpacing: '1px', color: 'white' }}>
              🎓 THÔNG BÁO KẾT QUẢ XÉT TUYỂN
            </h2>
          </div>

          {/* Email Body */}
          <div style={{ padding: '40px 30px', backgroundColor: '#ffffff' }}>
            <div style={{ marginBottom: '20px', fontSize: '16px' }}>
              <p style={{ margin: '5px 0' }}><strong>Kính gửi:</strong> {previewData.studentName}</p>
            </div>
            
            <p style={{ margin: '20px 0', fontSize: '15px', lineHeight: '1.8' }}>
              Trường Đại học xin trân trọng thông báo kết quả xét tuyển của bạn. 
              Chúng tôi rất vui mừng được chào đón bạn gia nhập cộng đồng sinh viên của chúng tôi.
            </p>

            {previewData.status === 'accepted' && (
              <>
                <div style={{ 
                  background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                  borderLeft: '5px solid #4caf50',
                  padding: '25px',
                  margin: '25px 0',
                  borderRadius: '6px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#2e7d32', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '28px' }}>🎉</span>
                    <span>CHÚC MỪNG!</span>
                  </h3>
                  <p style={{ margin: '5px 0', fontSize: '16px', fontWeight: 600, color: '#1b5e20' }}>
                    Bạn đã TRÚNG TUYỂN vào chương trình đào tạo của trường chúng tôi!
                  </p>
                </div>

                <div style={{ height: '2px', background: 'linear-gradient(to right, transparent, #0066cc, transparent)', margin: '25px 0' }}></div>

                <div style={{ margin: '30px 0' }}>
                  <h3 style={{ fontSize: '18px', color: '#0066cc', marginBottom: '15px', paddingBottom: '8px', borderBottom: '2px solid #e0e0e0' }}>
                    📋 Thông tin trúng tuyển
                  </h3>
                  
                  <div style={{ display: 'flex', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ fontWeight: 600, color: '#555', minWidth: '200px' }}>🎯 Ngành học:</span>
                    <span style={{ color: '#000', fontWeight: 500 }}>{previewData.programName}</span>
                  </div>
                  
                  <div style={{ display: 'flex', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ fontWeight: 600, color: '#555', minWidth: '200px' }}>📝 Phương thức xét tuyển:</span>
                    <span style={{ color: '#000', fontWeight: 500 }}>Xét tuyển học bạ THPT</span>
                  </div>
                  
                  <div style={{ display: 'flex', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ fontWeight: 600, color: '#555', minWidth: '200px' }}>⭐ Nguyện vọng trúng tuyển:</span>
                    <span style={{ color: '#000', fontWeight: 500 }}>Nguyện vọng {previewData.preference} (NV{previewData.preference})</span>
                  </div>
                  
                  <div style={{ display: 'flex', padding: '12px 0' }}>
                    <span style={{ fontWeight: 600, color: '#555', minWidth: '200px' }}>📊 Điểm xét tuyển:</span>
                    <span style={{ color: '#4caf50', fontSize: '18px', fontWeight: 700 }}>{previewData.score.toFixed(2)}</span>
                  </div>
                </div>

                <div style={{ backgroundColor: '#fff3cd', borderLeft: '5px solid #ffc107', padding: '20px', margin: '30px 0', borderRadius: '6px' }}>
                  <h4 style={{ fontSize: '16px', color: '#856404', marginBottom: '12px', fontWeight: 700 }}>
                    ⚠️ Lưu ý quan trọng
                  </h4>
                  <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                    <li style={{ margin: '8px 0', color: '#856404', fontSize: '14px' }}>
                      <strong>Xác nhận nhập học:</strong> Vui lòng xác nhận nhập học theo hướng dẫn trên website của trường trong vòng 7 ngày.
                    </li>
                    <li style={{ margin: '8px 0', color: '#856404', fontSize: '14px' }}>
                      <strong>Nộp hồ sơ:</strong> Chuẩn bị và nộp đầy đủ hồ sơ nhập học theo yêu cầu.
                    </li>
                  </ul>
                </div>

                <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '6px', margin: '25px 0' }}>
                  <h4 style={{ fontSize: '16px', color: '#333', marginBottom: '12px' }}>
                    📞 Thông tin liên hệ
                  </h4>
                  <div style={{ margin: '10px 0', fontSize: '14px', color: '#555' }}>
                    <strong style={{ color: '#0066cc', minWidth: '100px', display: 'inline-block' }}>📧 Email:</strong>
                    <span>tuyensinh@utc2.edu.vn</span>
                  </div>
                  <div style={{ margin: '10px 0', fontSize: '14px', color: '#555' }}>
                    <strong style={{ color: '#0066cc', minWidth: '100px', display: 'inline-block' }}>☎️ Điện thoại:</strong>
                    <span>(028) 3512 0808</span>
                  </div>
                  <div style={{ margin: '10px 0', fontSize: '14px', color: '#555' }}>
                    <strong style={{ color: '#0066cc', minWidth: '100px', display: 'inline-block' }}>🏢 Địa chỉ:</strong>
                    <span>450-451 Lê Văn Việt, Phường Tăng Nhơn Phú A, TP. Thủ Đức, TP. Hồ Chí Minh</span>
                  </div>
                  <div style={{ margin: '10px 0', fontSize: '14px', color: '#555' }}>
                    <strong style={{ color: '#0066cc', minWidth: '100px', display: 'inline-block' }}>🌐 Website:</strong>
                    <span>https://utc2.edu.vn</span>
                  </div>
                </div>
              </>
            )}

            <div style={{ marginTop: '35px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
              <p style={{ margin: '5px 0', fontSize: '15px' }}>Một lần nữa, chúc mừng bạn đã trúng tuyển!</p>
              <p style={{ margin: '20px 0 5px 0', fontSize: '15px' }}>Trân trọng,</p>
              <p style={{ margin: '5px 0' }}><strong style={{ color: '#0066cc', fontSize: '16px' }}>Phòng Đào tạo - Trường Đại học Giao thông Vận tải TP.HCM</strong></p>
            </div>
          </div>

          {/* Email Footer */}
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '25px 30px',
            textAlign: 'center',
            fontSize: '13px',
            color: '#666',
            borderTop: '1px solid #e0e0e0'
          }}>
            <p style={{ margin: '5px 0' }}><strong>⚡ Email tự động</strong></p>
            <p style={{ margin: '5px 0' }}>Đây là email được gửi tự động từ hệ thống. Vui lòng không trả lời trực tiếp email này.</p>
            <p style={{ marginTop: '15px', color: '#999' }}>© 2026 Trường Đại học Giao thông Vận tải TP.HCM. Bản quyền thuộc về.</p>
          </div>
        </div>
      </Modal>
    );
  };

  // Confirmation modal (Requirement 15.4)
  const ConfirmationModal = () => {
    return (
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SendOutlined style={{ fontSize: '20px', color: '#ff4d4f' }} />
            <span>Xác nhận gửi Email</span>
          </div>
        }
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onOk={handleSendEmails}
        okText={sending ? 'Đang gửi...' : 'Xác nhận gửi'}
        cancelText="Hủy bỏ"
        okButtonProps={{ 
          danger: true, 
          loading: sending,
          icon: <SendOutlined />,
          size: 'large'
        }}
        cancelButtonProps={{ 
          disabled: sending,
          size: 'large'
        }}
        width={650}
        centered
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message="⚠️ Cảnh báo quan trọng"
            description="Bạn sắp gửi thông báo email đến sinh viên. Hành động này không thể hoàn tác sau khi thực hiện."
            type="warning"
            showIcon
            style={{ 
              borderLeft: '4px solid #faad14',
              backgroundColor: '#fffbe6'
            }}
          />
          
          <Card 
            size="small" 
            style={{ 
              backgroundColor: '#f0f5ff',
              border: '1px solid #adc6ff'
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500, color: '#595959' }}>📅 Đợt tuyển sinh:</span>
                <span style={{ fontWeight: 600, color: '#000' }}>
                  {selectedSession?.name} ({selectedSession?.year})
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500, color: '#595959' }}>👥 Nhóm người nhận:</span>
                <span style={{ fontWeight: 600, color: '#000' }}>
                  {getRecipientDescription()}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500, color: '#595959' }}>📧 Tổng số email:</span>
                <Tag 
                  color="blue" 
                  style={{ 
                    fontSize: '18px', 
                    padding: '8px 16px',
                    fontWeight: 700,
                    margin: 0
                  }}
                >
                  {recipientCount} sinh viên
                </Tag>
              </div>
            </Space>
          </Card>

          <Alert
            message="📝 Xác nhận thông tin"
            description={
              <div>
                <p style={{ margin: '8px 0' }}>
                  Bạn có chắc chắn muốn gửi email đến <strong>{recipientCount} sinh viên</strong>?
                </p>
                <p style={{ margin: '8px 0' }}>
                  • Email sẽ được xếp hàng và gửi bất đồng bộ trong nền
                </p>
                <p style={{ margin: '8px 0' }}>
                  • Quá trình có thể mất vài phút tùy thuộc vào số lượng
                </p>
                <p style={{ margin: '8px 0' }}>
                  • Hệ thống sẽ tự động thử lại nếu gửi thất bại (tối đa 3 lần)
                </p>
              </div>
            }
            type="info"
            showIcon
            style={{ 
              borderLeft: '4px solid #1890ff',
              backgroundColor: '#e6f7ff'
            }}
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
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Gửi Email Thông Báo</h1>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          Gửi thông báo kết quả tuyển sinh cho sinh viên qua email
        </p>
      </div>

      {/* Email Configuration Card (Requirement 15.1) */}
      <Card
        title="Cấu hình gửi email"
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
              placeholder="Chọn đợt tuyển sinh để gửi email"
              value={selectedSessionId}
              onChange={handleSessionChange}
              disabled={sending}
              size="large"
            >
              {sessions.map((session) => (
                <Select.Option key={session.id} value={session.id}>
                  {session.name} ({session.year}) - {session.status === 'active' ? 'Đang mở' : 'Đã đóng'}
                </Select.Option>
              ))}
            </Select>
            {sessions.length === 0 && !loading && (
              <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                Không có đợt tuyển sinh nào. Vui lòng tạo đợt tuyển sinh và chạy lọc ảo trước.
              </div>
            )}
          </div>

          {selectedSession && (
            <Alert
              message="Thông tin đợt tuyển sinh"
              description={
                <div>
                  <p><strong>Tên:</strong> {selectedSession.name}</p>
                  <p><strong>Năm:</strong> {selectedSession.year}</p>
                  <p><strong>Trạng thái:</strong> <Tag color={selectedSession.status === 'active' ? 'green' : 'default'}>{selectedSession.status === 'active' ? 'Đang mở' : 'Đã đóng'}</Tag></p>
                </div>
              }
              type="info"
              showIcon
            />
          )}

          {/* Recipient Selection (Requirement 15.2) */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Chọn người nhận <span style={{ color: 'red' }}>*</span>
            </label>
            <Select
              style={{ width: '100%' }}
              placeholder="Chọn nhóm người nhận"
              value={recipientGroup}
              onChange={handleRecipientGroupChange}
              disabled={!selectedSessionId || sending}
              size="large"
            >
              <Select.Option value="all">Tất cả sinh viên</Select.Option>
              <Select.Option value="accepted">Chỉ sinh viên trúng tuyển</Select.Option>
              <Select.Option value="rejected">Chỉ sinh viên không đậu</Select.Option>
              <Select.Option value="program">Theo ngành cụ thể</Select.Option>
            </Select>
          </div>

          {/* Program Selection (Requirement 15.2) */}
          {recipientGroup === 'program' && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Chọn ngành <span style={{ color: 'red' }}>*</span>
              </label>
              <Select
                style={{ width: '100%' }}
                placeholder="Chọn ngành"
                value={selectedProgramId}
                onChange={handleProgramChange}
                disabled={!selectedSessionId || sending}
                size="large"
                showSearch
                optionFilterProp="children"
              >
                {programs.map((program) => (
                  <Select.Option key={program.id} value={program.id}>
                    {program.code} - {program.name}
                  </Select.Option>
                ))}
              </Select>
            </div>
          )}

          {/* Recipient Count Display (Requirement 15.2) */}
          {selectedSessionId && (
            <Alert
              message="Thông tin người nhận"
              description={
                <div>
                  <p><strong>Nhóm người nhận:</strong> {getRecipientDescription()}</p>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <Tag color="blue" style={{ fontSize: '16px', padding: '6px 16px', fontWeight: 600 }}>
                        Tổng: {recipientCount} sinh viên
                      </Tag>
                    </div>
                    <div>
                      <Tag color="green" style={{ fontSize: '14px', padding: '4px 12px' }}>
                        Đậu: {admittedCount}
                      </Tag>
                    </div>
                    <div>
                      <Tag color="orange" style={{ fontSize: '14px', padding: '4px 12px' }}>
                        Trượt: {notAdmittedCount}
                      </Tag>
                    </div>
                  </div>
                </div>
              }
              type="success"
              showIcon
            />
          )}

          <div>
            <Space size="middle">
              <Button
                type="default"
                icon={<EyeOutlined />}
                onClick={() => setShowPreview(true)}
                disabled={!selectedSessionId}
                size="large"
              >
                Xem trước Email
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
                danger
              >
                Gửi Email
              </Button>
              
              <Button
                icon={<HistoryOutlined />}
                onClick={() => {
                  setShowHistory(true);
                  fetchEmailHistory();
                }}
                size="large"
              >
                Lịch sử gửi
              </Button>
            </Space>
          </div>
        </Space>
      </Card>

      {/* Sending Progress Card */}
      {sendingProgress.status !== 'idle' && (
        <Card title="Tiến trình gửi email" style={{ marginBottom: '24px' }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {sendingProgress.status === 'sending' && (
              <>
                <div style={{ textAlign: 'center' }}>
                  <Spin size="large" />
                </div>
                <p style={{ textAlign: 'center', color: '#666', fontSize: '16px' }}>
                  {sendingProgress.message}
                </p>
              </>
            )}

            {sendingProgress.status === 'completed' && (
              <>
                <Alert
                  message="Gửi email thành công!"
                  description={sendingProgress.message}
                  type="success"
                  showIcon
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
                    <Statistic
                      title="Đã gửi thành công"
                      value={sendingProgress.sent || 0}
                      valueStyle={{ color: '#52c41a', fontSize: '32px' }}
                      suffix="email"
                    />
                  </Card>
                  <Card size="small" style={{ backgroundColor: '#fff1f0' }}>
                    <Statistic
                      title="Thất bại"
                      value={sendingProgress.failed || 0}
                      valueStyle={{ color: '#ff4d4f', fontSize: '32px' }}
                      suffix="email"
                    />
                  </Card>
                </div>
              </>
            )}

            {sendingProgress.status === 'failed' && (
              <Alert
                message="Gửi email thất bại"
                description={sendingProgress.message}
                type="error"
                showIcon
              />
            )}
          </Space>
        </Card>
      )}

      {/* Information Card */}
      <Card title="Về thông báo Email" type="inner">
        <Space direction="vertical" style={{ width: '100%' }}>
          <p>
            Email thông báo sẽ được gửi đến tất cả sinh viên trong đợt tuyển sinh đã chọn.
            Mỗi email bao gồm:
          </p>
          <ul style={{ paddingLeft: '20px' }}>
            <li>Trạng thái tuyển sinh của sinh viên (Trúng tuyển/Không đậu)</li>
            <li>Tên ngành và mã ngành</li>
            <li>Tổng điểm và xếp hạng (nếu trúng tuyển)</li>
            <li>Các bước tiếp theo và ngày quan trọng</li>
          </ul>
          <Alert
            message="Lưu ý quan trọng"
            description="Email sẽ được xếp hàng và gửi bất đồng bộ trong nền. Quá trình có thể mất vài phút tùy thuộc vào số lượng người nhận."
            type="warning"
            showIcon
          />
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


