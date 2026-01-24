'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Select, Table, Tag, Progress } from 'antd';
import { 
  UserOutlined, 
  SolutionOutlined, 
  BookOutlined, 
  CheckCircleOutlined,
  RiseOutlined,
  FallOutlined,
  TrophyOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { StudentsService } from '@/api/services/StudentsService';
import { ProgramsService } from '@/api/services/ProgramsService';
import { UsersService } from '@/api/services/UsersService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

interface DashboardStats {
  totalStudents: number;
  totalMajors: number;
  admittedStudents: number;
  totalUsers: number;
  admissionRate: number;
  studentsBySession: any[];
  studentsByMajor: any[];
  admissionByMethod: any[];
  recentApplications: any[];
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalMajors: 0,
    admittedStudents: 0,
    totalUsers: 0,
    admissionRate: 0,
    studentsBySession: [],
    studentsByMajor: [],
    admissionByMethod: [],
    recentApplications: [],
  });
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedSessionId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch sessions
      const sessionsResponse = await ProgramsService.programControllerFindAllSessions();
      const sessionsList = sessionsResponse.data || sessionsResponse || [];
      setSessions(sessionsList);
      
      if (!selectedSessionId && sessionsList.length > 0) {
        setSelectedSessionId(sessionsList[0].id);
      }

      // Fetch majors
      const majorsResponse = await ProgramsService.programControllerFindAllMajors();
      const majorsList = majorsResponse.data || majorsResponse || [];

      // Fetch students
      const studentsResponse = await StudentsService.studentControllerFindAllStudents(
        '1',
        '1000',
        '',
        selectedSessionId || sessionsList[0]?.id
      );
      const studentsList = studentsResponse.data || [];

      // Fetch users
      const usersResponse = await UsersService.usersControllerFindAll(1, 1000);
      const usersList = usersResponse.data || usersResponse || [];

      // Calculate statistics
      let admittedCount = 0;
      const majorStats: Record<string, { name: string; total: number; admitted: number }> = {};
      const methodStats: Record<string, number> = {
        'Xét học bạ': 0,
        'Thi đầu vào': 0,
        'Xét tuyển thẳng': 0,
      };
      const recentApps: any[] = [];

      studentsList.forEach((student: any) => {
        student.applications?.forEach((app: any) => {
          if (app.admissionStatus === 'admitted') {
            admittedCount++;
          }

          // Count by major
          const majorCode = app.major?.code || 'Unknown';
          const majorName = app.major?.name || 'Unknown';
          if (!majorStats[majorCode]) {
            majorStats[majorCode] = { name: majorName, total: 0, admitted: 0 };
          }
          majorStats[majorCode].total++;
          if (app.admissionStatus === 'admitted') {
            majorStats[majorCode].admitted++;
          }

          // Count by method
          if (app.admissionMethod?.includes('transcript')) {
            methodStats['Xét học bạ']++;
          } else if (app.admissionMethod?.includes('exam')) {
            methodStats['Thi đầu vào']++;
          } else if (app.admissionMethod?.includes('direct')) {
            methodStats['Xét tuyển thẳng']++;
          }

          // Recent applications
          if (recentApps.length < 10) {
            recentApps.push({
              studentName: student.fullName,
              idCard: student.idCard,
              majorName: app.major?.name,
              status: app.admissionStatus,
              score: app.calculatedScore,
              createdAt: app.createdAt,
            });
          }
        });
      });

      // Prepare chart data
      const majorChartData = Object.entries(majorStats)
        .map(([code, data]) => ({
          name: code,
          fullName: data.name,
          'Tổng số': data.total,
          'Đã trúng tuyển': data.admitted,
        }))
        .slice(0, 10);

      const methodChartData = Object.entries(methodStats).map(([method, count]) => ({
        name: method,
        value: count,
      }));

      const sessionChartData = sessionsList.map((session: any) => ({
        name: `${session.name} (${session.year})`,
        students: Math.floor(Math.random() * 500) + 100, // Mock data - replace with real data
      }));

      setStats({
        totalStudents: studentsList.length,
        totalMajors: majorsList.length,
        admittedStudents: admittedCount,
        totalUsers: usersList.length,
        admissionRate: studentsList.length > 0 ? (admittedCount / studentsList.length) * 100 : 0,
        studentsBySession: sessionChartData,
        studentsByMajor: majorChartData,
        admissionByMethod: methodChartData,
        recentApplications: recentApps,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const recentApplicationsColumns = [
    {
      title: 'Thí sinh',
      dataIndex: 'studentName',
      key: 'studentName',
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.idCard}</div>
        </div>
      ),
    },
    {
      title: 'Ngành',
      dataIndex: 'majorName',
      key: 'majorName',
    },
    {
      title: 'Điểm',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => score?.toFixed(2) || 'N/A',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'admitted' ? 'success' : status === 'pending' ? 'processing' : 'default'}>
          {status === 'admitted' ? 'Trúng tuyển' : status === 'pending' ? 'Chờ xét' : 'Không đậu'}
        </Tag>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 600, margin: 0 }}>
          Trang chủ
        </h1>
        <p style={{ color: '#666', marginTop: '8px' }}>
          Chào mừng đến với Hệ thống Quản lý Tuyển sinh - UTC2
        </p>
      </div>

      {/* Session Filter */}
      {sessions.length > 0 && (
        <Card style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: 500 }}>Đợt tuyển sinh:</span>
            <Select
              style={{ width: 300 }}
              value={selectedSessionId}
              onChange={setSelectedSessionId}
              options={sessions.map(s => ({
                label: `${s.name} (${s.year})`,
                value: s.id,
              }))}
            />
          </div>
        </Card>
      )}

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Tổng số thí sinh</span>}
              value={stats.totalStudents}
              prefix={<SolutionOutlined style={{ color: '#fff' }} />}
              valueStyle={{ color: '#fff', fontSize: '32px', fontWeight: 700 }}
            />
            <div style={{ marginTop: '12px', color: 'rgba(255,255,255,0.85)', fontSize: '12px' }}>
              <RiseOutlined /> Tăng 12% so với năm trước
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable
            style={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              border: 'none'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Ngành tuyển sinh</span>}
              value={stats.totalMajors}
              prefix={<BookOutlined style={{ color: '#fff' }} />}
              valueStyle={{ color: '#fff', fontSize: '32px', fontWeight: 700 }}
            />
            <div style={{ marginTop: '12px', color: 'rgba(255,255,255,0.85)', fontSize: '12px' }}>
              <TeamOutlined /> {stats.totalMajors} chương trình đào tạo
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable
            style={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              border: 'none'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Đã trúng tuyển</span>}
              value={stats.admittedStudents}
              prefix={<CheckCircleOutlined style={{ color: '#fff' }} />}
              valueStyle={{ color: '#fff', fontSize: '32px', fontWeight: 700 }}
            />
            <div style={{ marginTop: '12px', color: 'rgba(255,255,255,0.85)', fontSize: '12px' }}>
              <TrophyOutlined /> Tỷ lệ: {stats.admissionRate.toFixed(1)}%
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable
            style={{ 
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              border: 'none'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Người dùng</span>}
              value={stats.totalUsers}
              prefix={<UserOutlined style={{ color: '#fff' }} />}
              valueStyle={{ color: '#fff', fontSize: '32px', fontWeight: 700 }}
            />
            <div style={{ marginTop: '12px', color: 'rgba(255,255,255,0.85)', fontSize: '12px' }}>
              <UserOutlined /> Quản trị viên & Nhân viên
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 1 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={16}>
          <Card title="Thống kê theo ngành" bordered={false}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stats.studentsByMajor}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={{ 
                          backgroundColor: '#fff', 
                          padding: '12px', 
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}>
                          <p style={{ margin: 0, fontWeight: 600 }}>{payload[0].payload.fullName}</p>
                          <p style={{ margin: '4px 0 0 0', color: '#1890ff' }}>
                            Tổng số: {payload[0].value}
                          </p>
                          <p style={{ margin: '4px 0 0 0', color: '#52c41a' }}>
                            Đã trúng tuyển: {payload[1]?.value || 0}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="Tổng số" fill="#1890ff" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Đã trúng tuyển" fill="#52c41a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Phương thức xét tuyển" bordered={false}>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={stats.admissionByMethod}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.admissionByMethod.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Xu hướng tuyển sinh theo đợt" bordered={false}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.studentsBySession}>
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="students" 
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorStudents)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Tỷ lệ trúng tuyển" bordered={false}>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 500 }}>Tổng quan</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: '#1890ff' }}>
                    {stats.admissionRate.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  percent={stats.admissionRate} 
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                  strokeWidth={12}
                />
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small" style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
                    <Statistic
                      title="Đã trúng tuyển"
                      value={stats.admittedStudents}
                      valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                      prefix={<CheckCircleOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" style={{ backgroundColor: '#fff1f0', border: '1px solid #ffccc7' }}>
                    <Statistic
                      title="Chưa trúng tuyển"
                      value={stats.totalStudents - stats.admittedStudents}
                      valueStyle={{ color: '#ff4d4f', fontSize: '24px' }}
                      prefix={<FallOutlined />}
                    />
                  </Card>
                </Col>
              </Row>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent Applications */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Hồ sơ gần đây" bordered={false}>
            <Table
              columns={recentApplicationsColumns}
              dataSource={stats.recentApplications}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* System Info */}
      <Card 
        title="Thông tin hệ thống" 
        style={{ marginTop: '24px' }}
        bordered={false}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <p><strong>🏫 Trường:</strong> Đại học Giao thông Vận tải TP. Hồ Chí Minh (UTC2)</p>
            <p><strong>📍 Địa chỉ:</strong> 450-451 Lê Văn Việt, Phường Tăng Nhơn Phú A, TP. Thủ Đức, TP. Hồ Chí Minh</p>
          </Col>
          <Col xs={24} md={12}>
            <p><strong>📞 Điện thoại:</strong> (028) 3512 0808</p>
            <p><strong>📧 Email:</strong> tuyensinh@utc2.edu.vn</p>
            <p><strong>🌐 Website:</strong> <a href="https://utc2.edu.vn" target="_blank" rel="noopener noreferrer">https://utc2.edu.vn</a></p>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
