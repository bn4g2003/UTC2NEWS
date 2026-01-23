/**
 * Header Component
 * Displays user profile and logout button
 * Validates Requirement 4.2
 */

'use client';

import { Layout, Dropdown, Avatar, Space, Button } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/constants';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  collapsed: boolean;
  onMenuClick: () => void;
}

/**
 * Header component with user profile and logout
 */
export function Header({ collapsed, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Handle logout
  const handleLogout = () => {
    logout();
    router.push(ROUTES.AUTH.LOGIN);
  };

  // User dropdown menu items
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
      onClick: () => {
        // TODO: Navigate to profile page when implemented
        console.log('Navigate to profile');
      },
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
      onClick: () => {
        // TODO: Navigate to settings page when implemented
        console.log('Navigate to settings');
      },
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <AntHeader
      style={{
        padding: '0 24px',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f0f0f0',
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}
    >
      {/* Menu toggle button */}
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onMenuClick}
        style={{
          fontSize: '16px',
          width: 64,
          height: 64,
        }}
      />

      {/* User profile dropdown */}
      <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
        <Space style={{ cursor: 'pointer' }}>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <span style={{ fontWeight: 500 }}>
            {user?.fullName || user?.username || 'User'}
          </span>
        </Space>
      </Dropdown>
    </AntHeader>
  );
}
