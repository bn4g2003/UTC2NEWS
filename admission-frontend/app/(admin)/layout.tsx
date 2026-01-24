/**
 * Admin Layout
 * Main layout for admin interface with sidebar, header, and content area
 * Validates Requirements 4.1, 4.2
 */

'use client';

import { ReactNode } from 'react';
import { Layout } from 'antd';
import { usePathname } from 'next/navigation';
import { Sidebar, Header, Breadcrumb } from '@/components/admin/AdminLayout';
import { useSidebarCollapse } from '@/hooks/useSidebarCollapse';

const { Content } = Layout;

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useSidebarCollapse();
  const pathname = usePathname();
  const isChatPage = pathname?.includes('/chat');

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar Navigation */}
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />

      {/* Main Content Area */}
      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'margin-left 0.2s' }}>
        {/* Header */}
        <Header collapsed={collapsed} onMenuClick={() => setCollapsed(!collapsed)} />

        {/* Content */}
        <Content style={{ margin: isChatPage ? 0 : '0 16px', display: 'flex', flexDirection: 'column' }}>
          {/* Breadcrumb - hide on chat page */}
          {!isChatPage && <Breadcrumb />}

          {/* Page Content */}
          <div
            style={{
              padding: isChatPage ? 0 : 24,
              minHeight: 360,
              background: '#fff',
              borderRadius: isChatPage ? 0 : 8,
              flex: 1, // Ensure content takes remaining space
              display: isChatPage ? 'flex' : 'block', // Chat needs flex container behavior usually
              flexDirection: 'column',
            }}
          >
            {children}
          </div>
        </Content>

        {/* Footer - hide on chat page */}
        {!isChatPage && (
          <Layout.Footer style={{ textAlign: 'center' }}>
            Admission Management System ©{new Date().getFullYear()}
          </Layout.Footer>
        )}
      </Layout>
    </Layout>
  );
}
