'use client';

import { useState, useEffect } from 'react';
import { Checkbox, Collapse, Space, Spin, Alert, Tag } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import { 
  UserOutlined, 
  TeamOutlined, 
  SafetyOutlined,
  BookOutlined,
  CalendarOutlined,
  DatabaseOutlined,
  ImportOutlined,
  FilterOutlined,
  FileTextOutlined,
  MailOutlined,
  FileImageOutlined,
  QuestionCircleOutlined,
  TagsOutlined,
  PictureOutlined,
  SettingOutlined,
} from '@ant-design/icons';

/**
 * Permission interface
 */
export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource?: string;
  action?: string;
}

/**
 * Grouped permissions by module/resource
 */
interface GroupedPermissions {
  [module: string]: Permission[];
}

/**
 * Module display configuration
 */
interface ModuleConfig {
  displayName: string;
  icon: React.ReactNode;
  color: string;
  order: number;
}

/**
 * PermissionsSelector Props
 */
export interface PermissionsSelectorProps {
  /**
   * All available permissions
   */
  permissions: Permission[];
  
  /**
   * Currently selected permission IDs
   */
  selectedPermissionIds: string[];
  
  /**
   * Callback when selection changes
   */
  onChange: (selectedIds: string[]) => void;
  
  /**
   * Loading state
   */
  loading?: boolean;
  
  /**
   * Error state
   */
  error?: Error | null;
  
  /**
   * Disabled state
   */
  disabled?: boolean;
}

/**
 * PermissionsSelector Component
 * 
 * Displays permissions grouped by module with checkbox selection
 * Validates Requirements 8.4, 8.5
 * 
 * @example
 * ```tsx
 * <PermissionsSelector
 *   permissions={allPermissions}
 *   selectedPermissionIds={selectedIds}
 *   onChange={setSelectedIds}
 * />
 * ```
 */
export function PermissionsSelector({
  permissions,
  selectedPermissionIds,
  onChange,
  loading = false,
  error = null,
  disabled = false,
}: PermissionsSelectorProps) {
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({});

  // Module configuration with icons and display names
  const moduleConfig: Record<string, ModuleConfig> = {
    users: { displayName: 'Người dùng', icon: <UserOutlined />, color: '#1890ff', order: 1 },
    roles: { displayName: 'Vai trò', icon: <TeamOutlined />, color: '#722ed1', order: 2 },
    permissions: { displayName: 'Quyền hạn', icon: <SafetyOutlined />, color: '#eb2f96', order: 3 },
    students: { displayName: 'Sinh viên', icon: <BookOutlined />, color: '#52c41a', order: 4 },
    preferences: { displayName: 'Nguyện vọng', icon: <FileTextOutlined />, color: '#13c2c2', order: 5 },
    majors: { displayName: 'Ngành học', icon: <BookOutlined />, color: '#fa8c16', order: 6 },
    admission_sessions: { displayName: 'Đợt tuyển sinh', icon: <CalendarOutlined />, color: '#faad14', order: 7 },
    quotas: { displayName: 'Chỉ tiêu', icon: <DatabaseOutlined />, color: '#a0d911', order: 8 },
    import: { displayName: 'Nhập dữ liệu', icon: <ImportOutlined />, color: '#2f54eb', order: 9 },
    filter: { displayName: 'Lọc xét tuyển', icon: <FilterOutlined />, color: '#722ed1', order: 10 },
    results: { displayName: 'Kết quả', icon: <FileTextOutlined />, color: '#52c41a', order: 11 },
    emails: { displayName: 'Email', icon: <MailOutlined />, color: '#1890ff', order: 12 },
    posts: { displayName: 'Bài viết', icon: <FileImageOutlined />, color: '#fa541c', order: 13 },
    faqs: { displayName: 'Câu hỏi thường gặp', icon: <QuestionCircleOutlined />, color: '#13c2c2', order: 14 },
    categories: { displayName: 'Danh mục', icon: <TagsOutlined />, color: '#eb2f96', order: 15 },
    media: { displayName: 'Media', icon: <PictureOutlined />, color: '#722ed1', order: 16 },
    config: { displayName: 'Cấu hình', icon: <SettingOutlined />, color: '#8c8c8c', order: 17 },
  };

  // Action display names in Vietnamese
  const actionDisplayNames: Record<string, string> = {
    create: 'Tạo mới',
    read: 'Xem',
    update: 'Cập nhật',
    delete: 'Xóa',
    assign: 'Phân quyền',
    manage: 'Quản lý',
    execute: 'Thực thi',
    export: 'Xuất dữ liệu',
    send: 'Gửi',
    publish: 'Xuất bản',
    upload: 'Tải lên',
    update_status: 'Cập nhật trạng thái',
    update_password: 'Đổi mật khẩu',
  };

  // Group permissions by resource/module
  useEffect(() => {
    const grouped: GroupedPermissions = {};
    
    permissions.forEach(permission => {
      // Parse permission name to extract resource and action
      // Format: "resource:action" (e.g., "majors:create", "students:read")
      const parts = permission.name.split(':');
      
      // Skip invalid permissions (no colon or empty parts)
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        console.warn(`Invalid permission format: ${permission.name}`);
        return;
      }
      
      const resource = parts[0].trim();
      const action = parts[1].trim();
      
      if (!grouped[resource]) {
        grouped[resource] = [];
      }
      grouped[resource].push({
        ...permission,
        resource,
        action,
      });
    });
    
    // Sort permissions within each group by action priority
    const actionOrder = ['create', 'read', 'update', 'delete', 'assign', 'manage', 'execute', 'export', 'send', 'publish', 'upload', 'update_status', 'update_password'];
    Object.keys(grouped).forEach(module => {
      grouped[module].sort((a, b) => {
        const actionA = a.action || '';
        const actionB = b.action || '';
        const indexA = actionOrder.indexOf(actionA);
        const indexB = actionOrder.indexOf(actionB);
        
        if (indexA === -1 && indexB === -1) return actionA.localeCompare(actionB);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    });
    
    setGroupedPermissions(grouped);
  }, [permissions]);

  // Handle individual permission checkbox change
  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (disabled) return;
    
    const newSelectedIds = checked
      ? [...selectedPermissionIds, permissionId]
      : selectedPermissionIds.filter(id => id !== permissionId);
    
    onChange(newSelectedIds);
  };

  // Handle module "select all" checkbox change
  const handleModuleSelectAll = (module: string, checked: boolean) => {
    if (disabled) return;
    
    const modulePermissionIds = groupedPermissions[module].map(p => p.id);
    
    let newSelectedIds: string[];
    if (checked) {
      // Add all module permissions that aren't already selected
      newSelectedIds = [
        ...selectedPermissionIds,
        ...modulePermissionIds.filter(id => !selectedPermissionIds.includes(id))
      ];
    } else {
      // Remove all module permissions
      newSelectedIds = selectedPermissionIds.filter(
        id => !modulePermissionIds.includes(id)
      );
    }
    
    onChange(newSelectedIds);
  };

  // Check if all permissions in a module are selected
  const isModuleFullySelected = (module: string): boolean => {
    const modulePermissionIds = groupedPermissions[module].map(p => p.id);
    return modulePermissionIds.every(id => selectedPermissionIds.includes(id));
  };

  // Check if some (but not all) permissions in a module are selected
  const isModulePartiallySelected = (module: string): boolean => {
    const modulePermissionIds = groupedPermissions[module].map(p => p.id);
    const selectedCount = modulePermissionIds.filter(id => 
      selectedPermissionIds.includes(id)
    ).length;
    return selectedCount > 0 && selectedCount < modulePermissionIds.length;
  };

  // Show loading state
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px', color: '#666' }}>Đang tải quyền...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <Alert 
        message="Lỗi tải quyền"
        description={error.message}
        type="error"
        showIcon
      />
    );
  }

  // Show empty state
  if (permissions.length === 0) {
    return (
      <Alert 
        message="Không có quyền"
        description="Không có quyền nào để hiển thị."
        type="info"
        showIcon
      />
    );
  }

  // Sort modules by order
  const modules = Object.keys(groupedPermissions).sort((a, b) => {
    const orderA = moduleConfig[a]?.order || 999;
    const orderB = moduleConfig[b]?.order || 999;
    return orderA - orderB;
  });

  // Prepare items for Collapse component
  const collapseItems = modules.map(module => {
    const config = moduleConfig[module] || { 
      displayName: module.charAt(0).toUpperCase() + module.slice(1), 
      icon: <SafetyOutlined />, 
      color: '#8c8c8c',
      order: 999
    };
    
    return {
      key: module,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Checkbox
            checked={isModuleFullySelected(module)}
            indeterminate={isModulePartiallySelected(module)}
            onChange={(e: CheckboxChangeEvent) => 
              handleModuleSelectAll(module, e.target.checked)
            }
            disabled={disabled}
            onClick={(e) => e.stopPropagation()}
          />
          <span style={{ color: config.color, fontSize: '16px' }}>
            {config.icon}
          </span>
          <span style={{ fontWeight: 500, fontSize: '14px' }}>
            {config.displayName}
          </span>
          <Tag color={config.color} style={{ marginLeft: 'auto' }}>
            {groupedPermissions[module].filter(p => 
              selectedPermissionIds.includes(p.id)
            ).length}/{groupedPermissions[module].length}
          </Tag>
        </div>
      ),
      children: (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '12px',
          padding: '8px 0'
        }}>
          {groupedPermissions[module].map(permission => (
            <Checkbox
              key={permission.id}
              checked={selectedPermissionIds.includes(permission.id)}
              onChange={(e: CheckboxChangeEvent) => 
                handlePermissionChange(permission.id, e.target.checked)
              }
              disabled={disabled}
              style={{ 
                marginLeft: 0,
                padding: '8px 12px',
                border: '1px solid #f0f0f0',
                borderRadius: '4px',
                background: selectedPermissionIds.includes(permission.id) ? '#f6ffed' : '#fafafa',
                transition: 'all 0.3s',
              }}
            >
              <div>
                <div style={{ fontWeight: 500, color: '#262626' }}>
                  {(() => {
                    const action = permission.action?.toLowerCase().trim() || '';
                    const displayName = actionDisplayNames[action];
                    
                    if (displayName) {
                      return displayName;
                    }
                    
                    // Fallback: capitalize first letter
                    if (action) {
                      return action.charAt(0).toUpperCase() + action.slice(1).replace(/_/g, ' ');
                    }
                    
                    return 'Unknown';
                  })()}
                </div>
                {permission.description && (
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '2px' }}>
                    {permission.description}
                  </div>
                )}
              </div>
            </Checkbox>
          ))}
        </div>
      ),
    };
  });

  return (
    <div className="permissions-selector">
      <Collapse
        defaultActiveKey={modules.slice(0, 3)}
        style={{ background: '#fff', border: '1px solid #f0f0f0' }}
        items={collapseItems}
      />

      <div style={{ 
        marginTop: '16px', 
        padding: '12px 16px', 
        background: '#f0f5ff', 
        borderRadius: '4px',
        border: '1px solid #adc6ff'
      }}>
        <div style={{ fontSize: '13px', color: '#1890ff', fontWeight: 500 }}>
          Đã chọn <strong>{selectedPermissionIds.length}</strong> quyền / Tổng <strong>{permissions.length}</strong> quyền
        </div>
      </div>
    </div>
  );
}
