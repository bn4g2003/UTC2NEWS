/**
 * Admin Layout
 * Main layout for admin interface with sidebar, header, and content area
 * Validates Requirements 4.1, 4.2
 */

'use client';

import { ReactNode } from 'react';
import { Layout } from 'antd';
import { Sidebar, Header, Breadcrumb } from '@/components/admin/AdminLayout';
import { useSidebarCollapse } from '@/hooks/useSidebarCollapse';

const { Content } = Layout;

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useSidebarCollapse();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar Navigation */}
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />

      {/* Main Content Area */}
      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'margin-left 0.2s' }}>
        {/* Header */}
        <Header collapsed={collapsed} onMenuClick={() => setCollapsed(!collapsed)} />

        {/* Content */}
        <Content style={{ margin: '0 16px' }}>
          {/* Breadcrumb */}
          <Breadcrumb />

          {/* Page Content */}
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: '#fff',
              borderRadius: 8,
            }}
          >
            {children}
          </div>
        </Content>

        {/* Footer */}
        <Layout.Footer style={{ textAlign: 'center' }}>
          Admission Management System ©{new Date().getFullYear()}
        </Layout.Footer>
      </Layout>
    </Layout>
  );
}
