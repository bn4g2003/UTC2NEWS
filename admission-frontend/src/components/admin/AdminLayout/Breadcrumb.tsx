/**
 * Breadcrumb Component
 * Generates breadcrumb navigation from current route
 * Validates Requirement 4.3
 */

'use client';

import { Breadcrumb as AntBreadcrumb } from 'antd';
import type { BreadcrumbItemType } from 'antd/es/breadcrumb/Breadcrumb';
import { HomeOutlined } from '@ant-design/icons';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ROUTES } from '@/config/constants';

/**
 * Route name mapping for Vietnamese labels
 */
const routeNameMap: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Quản lý người dùng',
  roles: 'Vai trò & Quyền',
  students: 'Quản lý thí sinh',
  programs: 'Quản lý ngành',
  sessions: 'Quản lý đợt tuyển sinh',
  import: 'Nhập dữ liệu Excel',
  filter: 'Lọc ảo',
  results: 'Kết quả tuyển sinh',
  email: 'Gửi email thông báo',
  cms: 'Quản lý nội dung',
  posts: 'Bài viết',
  categories: 'Danh mục',
  faqs: 'Câu hỏi thường gặp',
  media: 'Thư viện ảnh',
};

/**
 * Generate breadcrumb items from pathname
 */
function generateBreadcrumbItems(pathname: string): BreadcrumbItemType[] {
  const items: BreadcrumbItemType[] = [
    {
      title: (
        <Link href={ROUTES.ADMIN.DASHBOARD}>
          <HomeOutlined />
        </Link>
      ),
    },
  ];

  // Split pathname and filter empty segments
  const pathSegments = pathname.split('/').filter((segment) => segment !== '');

  // Build breadcrumb path
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Get display name from map or use segment as-is
    const displayName = routeNameMap[segment] || segment;
    
    // Last item should not be a link
    const isLast = index === pathSegments.length - 1;
    
    items.push({
      title: isLast ? displayName : <Link href={currentPath}>{displayName}</Link>,
    });
  });

  return items;
}

/**
 * Breadcrumb component that reflects current route
 */
export function Breadcrumb() {
  const pathname = usePathname();

  // Don't show breadcrumb on dashboard
  if (pathname === ROUTES.ADMIN.DASHBOARD) {
    return null;
  }

  const items = generateBreadcrumbItems(pathname);

  return (
    <AntBreadcrumb
      items={items}
      style={{
        margin: '16px 0',
      }}
    />
  );
}
