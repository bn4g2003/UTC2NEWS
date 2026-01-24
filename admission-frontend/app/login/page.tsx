'use client';

/**
 * Login Page
 * Validates Requirements 2.1, 2.6
 * - Build login form with username and password fields
 * - Integrate with auth store
 * - Display error messages for invalid credentials
 */

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Form, Input, Button, Alert, Card, Typography, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginFormData } from '@/lib/validation';
import { ROUTES } from '@/config/constants';

const { Title, Text } = Typography;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const [form] = Form.useForm();

  // Get redirect URL from query params
  const redirectUrl = searchParams.get('redirect') || ROUTES.ADMIN.DASHBOARD;
  const expiredReason = searchParams.get('reason');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, router, redirectUrl]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  /**
   * Handle form submission
   * Validates Requirement 2.1: Submit valid credentials to generate JWT token
   */
  const handleSubmit = async (values: LoginFormData) => {
    try {
      // Clear any previous errors
      clearError();

      // Validate with Zod schema
      const validatedData = loginSchema.parse(values);

      // Call login action from auth store
      await login(validatedData);

      // Redirect to intended page or dashboard
      router.push(redirectUrl);
    } catch (err: any) {
      // Error is handled by the auth store and displayed via error state
      console.error('Login error:', err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.png" 
              alt="UTC2 Logo" 
              style={{ 
                height: 80,
                width: 'auto',
                objectFit: 'contain'
              }} 
            />
          </div>
          <Title level={2} className="mb-2">
            Trường Đại học Giao thông Vận tải TP.HCM
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Hệ thống Quản lý Tuyển sinh
          </Text>
        </div>

        {/* Display session expired message */}
        {expiredReason === 'expired' && (
          <Alert
            title="Phiên đăng nhập đã hết hạn"
            description="Vui lòng đăng nhập lại để tiếp tục."
            type="warning"
            showIcon
            closable
            className="mb-4"
          />
        )}

        {/* Display error message for invalid credentials */}
        {/* Validates Requirement 2.6: Display error messages for invalid credentials */}
        {error && (
          <Alert
            title="Đăng nhập thất bại"
            description={error}
            type="error"
            showIcon
            closable
            onClose={clearError}
            className="mb-4"
          />
        )}

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
          autoComplete="off"
        >
          {/* Username field */}
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[
              { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
              { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự' },
              { max: 50, message: 'Tên đăng nhập không được quá 50 ký tự' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Nhập tên đăng nhập"
              autoComplete="username"
            />
          </Form.Item>

          {/* Password field */}
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
            />
          </Form.Item>

          {/* Submit button */}
          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              block
              className="h-10"
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </Form.Item>
        </Form>

        <div className="mt-4 text-center">
          <Text type="secondary" className="text-sm">
            © 2026 Trường Đại học Giao thông Vận tải TP.HCM
          </Text>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <Spin size="large" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

