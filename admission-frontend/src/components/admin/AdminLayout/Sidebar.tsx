/**
 * Sidebar Component
 * Navigation menu with icons, labels, collapse/expand functionality
 * Validates Requirements 4.1, 4.4, 4.5, 4.6, 4.7
 */

'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Layout } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  SolutionOutlined,
  BookOutlined,
  CalendarOutlined,
  ImportOutlined,
  FilterOutlined,
  FileTextOutlined,
  MailOutlined,
  FileImageOutlined,
  FolderOutlined,
  QuestionCircleOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES, PERMISSIONS } from '@/config/constants';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

/**
 * Create menu item with permission check
 */
function createMenuItem(
  label: string,
  key: string,
  icon?: React.ReactNode,
  children?: MenuItem[],
  permission?: string
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    permission,
  } as MenuItem & { permission?: string };
}

/**
 * Sidebar component with navigation menu
 * Implements collapse/expand, active highlighting, and permission-based rendering
 */
export function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { checkPermission } = useAuth();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Only run permission checks on client after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Define menu items with permissions
  const menuItems: MenuItem[] = [
    createMenuItem('Dashboard', ROUTES.ADMIN.DASHBOARD, <DashboardOutlined />),

    // User Management Section
    createMenuItem('Quản lý người dùng', ROUTES.ADMIN.USERS, <UserOutlined />, undefined, PERMISSIONS.USERS.READ),
    createMenuItem('Vai trò & Quyền', ROUTES.ADMIN.ROLES, <TeamOutlined />, undefined, PERMISSIONS.ROLES.READ),

    // Student & Program Management Section
    createMenuItem('Quản lý thí sinh', ROUTES.ADMIN.STUDENTS, <SolutionOutlined />, undefined, PERMISSIONS.STUDENTS.READ),
    createMenuItem('Quản lý nguyện vọng', ROUTES.ADMIN.PREFERENCES, <SolutionOutlined />, undefined, PERMISSIONS.STUDENTS.READ),
    createMenuItem('Quản lý ngành', ROUTES.ADMIN.PROGRAMS, <BookOutlined />, undefined, PERMISSIONS.PROGRAMS.READ),
    createMenuItem('Quản lý đợt tuyển sinh', ROUTES.ADMIN.SESSIONS, <CalendarOutlined />, undefined, PERMISSIONS.SESSIONS.READ),

    // Admission Process Section
    createMenuItem('Lọc ảo', ROUTES.ADMIN.FILTER, <FilterOutlined />, undefined, PERMISSIONS.FILTER.EXECUTE),
    createMenuItem('Kết quả tuyển sinh', ROUTES.ADMIN.RESULTS, <FileTextOutlined />, undefined, PERMISSIONS.RESULTS.READ),
    createMenuItem('Gửi email thông báo', ROUTES.ADMIN.EMAIL, <MailOutlined />, undefined, PERMISSIONS.EMAIL.SEND),

    // Content Management Section
    createMenuItem(
      'Quản lý nội dung',
      'cms',
      <FileImageOutlined />,
      [
        createMenuItem('Bài viết', ROUTES.ADMIN.CMS.POSTS, <FileTextOutlined />, undefined, PERMISSIONS.CMS.POSTS.READ),
        createMenuItem('Danh mục', ROUTES.ADMIN.CMS.CATEGORIES, <FolderOutlined />, undefined, PERMISSIONS.CMS.CATEGORIES.READ),
        createMenuItem('Câu hỏi thường gặp', ROUTES.ADMIN.CMS.FAQS, <QuestionCircleOutlined />, undefined, PERMISSIONS.CMS.FAQS.READ),
        createMenuItem('Thư viện ảnh', ROUTES.ADMIN.CMS.MEDIA, <PictureOutlined />, undefined, PERMISSIONS.CMS.MEDIA.READ),
      ]
    ),
  ];

  // Filter menu items based on permissions (only on client)
  const filterMenuByPermissions = (items: MenuItem[]): MenuItem[] => {
    if (!mounted) {
      // On server or before mount, return all items to avoid hydration mismatch
      return items;
    }

    return items
      .map((item) => {
        const menuItem = item as any; // Use any to access custom properties

        // Check permission if specified
        if (menuItem.permission && !checkPermission(menuItem.permission)) {
          return null;
        }

        // Recursively filter children
        if (menuItem.children && Array.isArray(menuItem.children)) {
          const filteredChildren = filterMenuByPermissions(menuItem.children);
          if (filteredChildren.length === 0) {
            return null;
          }
          return { ...menuItem, children: filteredChildren };
        }

        return menuItem;
      })
      .filter((item): item is MenuItem => item !== null);
  };

  const filteredMenuItems = filterMenuByPermissions(menuItems);

  // Update selected keys based on current pathname
  useEffect(() => {
    // Set selected key based on pathname
    setSelectedKeys([pathname]);

    // Auto-expand parent menu if child is selected
    if (pathname === '/posts' || pathname === '/categories' || pathname === '/faqs' || pathname === '/media') {
      setOpenKeys(['cms']);
    }
  }, [pathname]);

  // Handle menu item click
  const handleMenuClick: MenuProps['onClick'] = (e) => {
    router.push(e.key);
  };

  // Handle submenu open/close
  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={250}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 16 : 20,
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {collapsed ? 'AMS' : 'Admission System'}
      </div>

      {/* Navigation Menu */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={selectedKeys}
        openKeys={openKeys}
        onOpenChange={handleOpenChange}
        onClick={handleMenuClick}
        items={filteredMenuItems}
        style={{ borderRight: 0 }}
      />
    </Sider>
  );
}
