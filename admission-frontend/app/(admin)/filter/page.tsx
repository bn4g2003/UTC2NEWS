'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Space, Select, Card, Alert, Spin, Progress, message } from 'antd';
import { PlayCircleOutlined, StopOutlined, ReloadOutlined } from '@ant-design/icons';
import { FilterService } from '@/api/services/FilterService';
import { ProgramsService } from '@/api/services/ProgramsService';

interface Session {
  id: string;
  name: string;
  year: number;
  status: 'upcoming' | 'active' | 'closed';
}

interface FilterProgress {
  status: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  message: string;
  result?: {
    totalProcessed: number;
    accepted: number;
    rejected: number;
    pending: number;
  };
  error?: string;
  cancelRequested?: boolean;
}

export default function FilterPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [filterProgress, setFilterProgress] = useState<FilterProgress>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  const [progressIntervalRef, setProgressIntervalRef] = useState<NodeJS.Timeout | null>(null);

  // Fetch sessions from API (Requirement 13.1)
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
      message.error('Failed to load sessions');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSessionId]);

  // Load sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Handle session selection (Requirement 13.2)
  const handleSessionChange = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    // Reset filter progress when changing session
    setFilterProgress({
      status: 'idle',
      progress: 0,
      message: '',
    });
  };

  // Handle run filter (Requirement 13.3, 13.4, 13.5)
  const handleRunFilter = async () => {
    if (!selectedSessionId) {
      message.warning('Please select a session first');
      return;
    }

    setFilterProgress({
      status: 'running',
      progress: 0,
      message: 'Starting filter process...',
      cancelRequested: false,
    });

    // Simulate progress updates (Requirement 13.4, 13.5)
    const progressInterval = setInterval(() => {
      setFilterProgress((prev) => {
        if (prev.status !== 'running' || prev.cancelRequested) {
          clearInterval(progressInterval);
          return prev;
        }
        
        const newProgress = Math.min(prev.progress + 10, 90);
        const messages = [
          'Initializing filter algorithm...',
          'Loading student applications...',
          'Processing preferences...',
          'Calculating scores and rankings...',
          'Applying program quotas...',
          'Generating admission decisions...',
          'Finalizing results...',
        ];
        
        const messageIndex = Math.floor(newProgress / 15);
        
        return {
          ...prev,
          progress: newProgress,
          message: messages[messageIndex] || 'Processing...',
        };
      });
    }, 500);

    setProgressIntervalRef(progressInterval);

    try {
      // Call API to start filter process (Requirement 13.3)
      const result = await FilterService.filterControllerRunFilter(selectedSessionId);
      
      // Check if cancel was requested
      if (filterProgress.cancelRequested) {
        clearInterval(progressInterval);
        setFilterProgress({
          status: 'cancelled',
          progress: 0,
          message: 'Filter process was cancelled',
        });
        message.info('Filter process cancelled');
        return;
      }
      
      // Clear progress interval
      clearInterval(progressInterval);
      
      // Update progress to completed (Requirement 13.6)
      setFilterProgress({
        status: 'completed',
        progress: 100,
        message: 'Filter completed successfully',
        result: {
          totalProcessed: result.totalProcessed || 0,
          accepted: result.accepted || 0,
          rejected: result.rejected || 0,
          pending: result.pending || 0,
        },
      });
      
      message.success('Filter executed successfully');
    } catch (err: any) {
      // Clear progress interval
      clearInterval(progressInterval);
      
      let errorMessage = 'Failed to execute filter';
      
      // Handle specific error cases (Requirement 13.7)
      if (err.status === 403) {
        errorMessage = 'You do not have permission to run the filter';
      } else if (err.status === 404) {
        errorMessage = 'Session not found';
      } else if (err.status === 400) {
        errorMessage = err.body?.message || 'Invalid filter configuration';
      } else if (err.status >= 500) {
        errorMessage = 'Server error occurred while processing filter';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setFilterProgress({
        status: 'failed',
        progress: 0,
        message: errorMessage,
        error: errorMessage,
      });
      
      message.error(errorMessage);
      console.error('Error running filter:', err);
    }
  };

  // Handle cancel filter (Requirement 13.8)
  const handleCancelFilter = () => {
    if (filterProgress.status === 'running') {
      setFilterProgress((prev) => ({
        ...prev,
        cancelRequested: true,
        message: 'Cancelling filter process...',
      }));
      
      if (progressIntervalRef) {
        clearInterval(progressIntervalRef);
      }
      
      // Note: Since the API call is already in progress, we can't truly cancel it
      // This just updates the UI state. In a real implementation, you'd need
      // a cancel endpoint or use AbortController
      setTimeout(() => {
        setFilterProgress({
          status: 'cancelled',
          progress: 0,
          message: 'Filter process was cancelled by user',
        });
        message.info('Filter process cancelled');
      }, 1000);
    }
  };

  // Handle reset (Requirement 13.1)
  const handleReset = () => {
    setFilterProgress({
      status: 'idle',
      progress: 0,
      message: '',
    });
  };

  // Get selected session details
  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Virtual Filter</h1>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          Run the virtual filter algorithm to process admission applications
        </p>
      </div>

      {/* Filter Configuration Card (Requirement 13.1, 13.2) */}
      <Card
        title="Filter Configuration"
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
              placeholder="Select a session to filter"
              value={selectedSessionId}
              onChange={handleSessionChange}
              disabled={filterProgress.status === 'running'}
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
                No active sessions available. Please create an active session first.
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

          <div>
            <Space>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleRunFilter}
                disabled={!selectedSessionId || filterProgress.status === 'running'}
                size="large"
              >
                Run Filter
              </Button>
              
              {filterProgress.status === 'running' && (
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={handleCancelFilter}
                  size="large"
                >
                  Cancel
                </Button>
              )}
              
              {filterProgress.status !== 'idle' && filterProgress.status !== 'running' && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                  size="large"
                >
                  Reset
                </Button>
              )}
            </Space>
          </div>
        </Space>
      </Card>

      {/* Filter Progress Card (Requirement 13.4, 13.5) */}
      {filterProgress.status !== 'idle' && (
        <Card title="Filter Progress" style={{ marginBottom: '24px' }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {filterProgress.status === 'running' && (
              <>
                <Spin size="large" />
                <Progress percent={filterProgress.progress} status="active" />
                <p style={{ textAlign: 'center', color: '#666' }}>
                  {filterProgress.message}
                </p>
                {filterProgress.cancelRequested && (
                  <Alert title="Cancellation Requested"
                    description="The filter process is being cancelled..."
                    type="warning"
                    showIcon
                  />
                )}
              </>
            )}

            {filterProgress.status === 'completed' && (
              <>
                <Alert title="Filter Completed Successfully"
                  description={filterProgress.message}
                  type="success"
                  showIcon
                />
                <Progress percent={100} status="success" />
              </>
            )}

            {filterProgress.status === 'failed' && (
              <>
                <Alert title="Filter Failed"
                  description={filterProgress.error || filterProgress.message}
                  type="error"
                  showIcon
                />
                <Progress percent={0} status="exception" />
              </>
            )}

            {filterProgress.status === 'cancelled' && (
              <>
                <Alert title="Filter Cancelled"
                  description={filterProgress.message}
                  type="warning"
                  showIcon
                />
                <Progress percent={0} status="exception" />
              </>
            )}
          </Space>
        </Card>
      )}

      {/* Filter Results Card (Requirement 13.6) */}
      {filterProgress.status === 'completed' && filterProgress.result && (
        <Card title="Filter Results">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <Card size="small" style={{ backgroundColor: '#f0f5ff' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 600, color: '#1890ff' }}>
                    {filterProgress.result.totalProcessed}
                  </div>
                  <div style={{ color: '#666', marginTop: '8px' }}>Total Processed</div>
                </div>
              </Card>

              <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 600, color: '#52c41a' }}>
                    {filterProgress.result.accepted}
                  </div>
                  <div style={{ color: '#666', marginTop: '8px' }}>Accepted</div>
                </div>
              </Card>

              <Card size="small" style={{ backgroundColor: '#fff1f0' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 600, color: '#ff4d4f' }}>
                    {filterProgress.result.rejected}
                  </div>
                  <div style={{ color: '#666', marginTop: '8px' }}>Rejected</div>
                </div>
              </Card>

              <Card size="small" style={{ backgroundColor: '#fffbe6' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 600, color: '#faad14' }}>
                    {filterProgress.result.pending}
                  </div>
                  <div style={{ color: '#666', marginTop: '8px' }}>Pending</div>
                </div>
              </Card>
            </div>

            <Alert title="Next Steps"
              description="You can now view the detailed results in the Results Export module or send email notifications to students."
              type="info"
              showIcon
            />
          </Space>
        </Card>
      )}

      {/* Information Card */}
      <Card title="About Virtual Filter" type="inner">
        <Space direction="vertical" style={{ width: '100%' }}>
          <p>
            The virtual filter algorithm processes admission applications based on the following criteria:
          </p>
          <ul style={{ paddingLeft: '20px' }}>
            <li>Student preferences (priority order)</li>
            <li>Academic scores and rankings</li>
            <li>Program quotas and availability</li>
            <li>Subject combination requirements</li>
          </ul>
          <p>
            <strong>Note:</strong> The filter operation is atomic and idempotent. Running it multiple times
            on the same session will produce the same results.
          </p>
        </Space>
      </Card>
    </div>
  );
}


