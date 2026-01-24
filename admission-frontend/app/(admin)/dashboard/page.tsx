'use client';

import { Card, Row, Col, Statistic } from 'antd';
import { 
  UserOutlined, 
  SolutionOutlined, 
  BookOutlined, 
  CheckCircleOutlined 
} from '@ant-design/icons';

export default function DashboardPage() {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 600, margin: 0 }}>
          Trang chủ
        </h1>
        <p style={{ color: '#666', marginTop: '8px' }}>
          Chào mừng đến với Hệ thống Quản lý Tuyển sinh - UTC2
        </p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng số thí sinh"
              value={0}
              prefix={<SolutionOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Ngành tuyển sinh"
              value={0}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đã trúng tuyển"
              value={0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Người dùng"
              value={0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title="Thông tin hệ thống" 
        style={{ marginTop: '24px' }}
      >
        <p><strong>Trường:</strong> Đại học Giao thông Vận tải TP. Hồ Chí Minh (UTC2)</p>
        <p><strong>Địa chỉ:</strong> 450-451 Lê Văn Việt, Phường Tăng Nhơn Phú A, TP. Thủ Đức, TP. Hồ Chí Minh</p>
        <p><strong>Điện thoại:</strong> (028) 3512 0808</p>
        <p><strong>Email:</strong> tuyensinh@utc2.edu.vn</p>
        <p><strong>Website:</strong> <a href="https://utc2.edu.vn" target="_blank" rel="noopener noreferrer">https://utc2.edu.vn</a></p>
      </Card>
    </div>
  );
}
