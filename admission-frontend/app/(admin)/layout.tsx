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
  const isJiraPage = pathname?.includes('/jira');
  const isFullHeightPage = isChatPage || isJiraPage;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar Navigation */}
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />

      {/* Main Content Area */}
      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'margin-left 0.2s' }}>
        {/* Header */}
        <Header collapsed={collapsed} onMenuClick={() => setCollapsed(!collapsed)} />

        {/* Content */}
        <Content style={{ margin: isFullHeightPage ? 0 : '0 16px', display: 'flex', flexDirection: 'column' }}>
          {/* Breadcrumb - hide on full height pages */}
          {!isFullHeightPage && <Breadcrumb />}

          {/* Page Content */}
          <div
            style={{
              padding: isFullHeightPage ? 0 : 24,
              minHeight: 360,
              background: '#fff',
              borderRadius: isFullHeightPage ? 0 : 8,
              flex: 1, // Ensure content takes remaining space
              display: isFullHeightPage ? 'flex' : 'block', // Full height pages need flex container
              flexDirection: 'column',
            }}
          >
            {children}
          </div>
        </Content>

        {/* Footer - hide on full height pages */}
        {!isFullHeightPage && (
          <Layout.Footer style={{ textAlign: 'center' }}>
            Admission Management System ©{new Date().getFullYear()}
          </Layout.Footer>
        )}
      </Layout>
    </Layout>
  );
}
