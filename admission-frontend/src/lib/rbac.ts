/**
 * RBAC (Role-Based Access Control) Module
 * Central export point for all RBAC functionality
 */

// Export permission checking hooks
export {
  usePermissions,
  usePermission,
  type UsePermissionsReturn,
} from '@/hooks/usePermissions';

// Export protected component utilities
export {
  ProtectedComponent,
  withPermission,
  useProtectedRender,
  type ProtectedComponentProps,
} from '@/components/shared/ProtectedComponent';

// Export API permission checker utilities
export {
  checkApiPermission,
  checkApiPermissions,
  checkApiAnyPermission,
  hasApiPermission,
  hasApiPermissions,
  hasApiAnyPermission,
  withApiPermission,
  withApiPermissions,
  useApiPermissionChecker,
  PermissionError,
} from '@/lib/api-permission-checker';

// Export auth store for direct access if needed
export { useAuthStore } from '@/store/authStore';

/**
 * Common permission strings for the application
 * Use these constants to avoid typos and ensure consistency
 */
export const PERMISSIONS = {
  // Users
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_UPDATE_STATUS: 'users:update_status',
  USERS_UPDATE_PASSWORD: 'users:update_password',
  
  // Roles
  ROLES_CREATE: 'roles:create',
  ROLES_READ: 'roles:read',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete',
  ROLES_ASSIGN: 'roles:assign',
  
  // Permissions
  PERMISSIONS_READ: 'permissions:read',
  PERMISSIONS_ASSIGN: 'permissions:assign',
  
  // Students
  STUDENTS_CREATE: 'students:create',
  STUDENTS_READ: 'students:read',
  STUDENTS_UPDATE: 'students:update',
  STUDENTS_DELETE: 'students:delete',
  
  // Preferences
  PREFERENCES_MANAGE: 'preferences:manage',
  
  // Majors
  MAJORS_CREATE: 'majors:create',
  MAJORS_READ: 'majors:read',
  MAJORS_UPDATE: 'majors:update',
  MAJORS_DELETE: 'majors:delete',
  
  // Admission Sessions
  ADMISSION_SESSIONS_CREATE: 'admission_sessions:create',
  ADMISSION_SESSIONS_READ: 'admission_sessions:read',
  ADMISSION_SESSIONS_UPDATE: 'admission_sessions:update',
  ADMISSION_SESSIONS_DELETE: 'admission_sessions:delete',
  
  // Quotas
  QUOTAS_CREATE: 'quotas:create',
  QUOTAS_READ: 'quotas:read',
  QUOTAS_UPDATE: 'quotas:update',
  QUOTAS_DELETE: 'quotas:delete',
  
  // Import
  IMPORT_EXECUTE: 'import:execute',
  
  // Filter
  FILTER_EXECUTE: 'filter:execute',
  
  // Results
  RESULTS_READ: 'results:read',
  RESULTS_EXPORT: 'results:export',
  
  // Email
  EMAILS_SEND: 'emails:send',
  EMAILS_READ: 'emails:read',
  
  // CMS - Posts
  POSTS_CREATE: 'posts:create',
  POSTS_READ: 'posts:read',
  POSTS_UPDATE: 'posts:update',
  POSTS_DELETE: 'posts:delete',
  POSTS_PUBLISH: 'posts:publish',
  
  // CMS - Categories
  CATEGORIES_CREATE: 'categories:create',
  CATEGORIES_READ: 'categories:read',
  CATEGORIES_UPDATE: 'categories:update',
  CATEGORIES_DELETE: 'categories:delete',
  
  // CMS - FAQs
  FAQS_CREATE: 'faqs:create',
  FAQS_READ: 'faqs:read',
  FAQS_UPDATE: 'faqs:update',
  FAQS_DELETE: 'faqs:delete',
  
  // CMS - Media
  MEDIA_UPLOAD: 'media:upload',
  MEDIA_READ: 'media:read',
  MEDIA_DELETE: 'media:delete',
  
  // Config
  CONFIG_READ: 'config:read',
  CONFIG_UPDATE: 'config:update',
} as const;

/**
 * Permission groups for common use cases
 */
export const PERMISSION_GROUPS = {
  // Full CRUD for users
  USERS_FULL: [
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DELETE,
  ],
  
  // Full CRUD for students
  STUDENTS_FULL: [
    PERMISSIONS.STUDENTS_CREATE,
    PERMISSIONS.STUDENTS_READ,
    PERMISSIONS.STUDENTS_UPDATE,
    PERMISSIONS.STUDENTS_DELETE,
  ],
  
  // Full CRUD for majors
  MAJORS_FULL: [
    PERMISSIONS.MAJORS_CREATE,
    PERMISSIONS.MAJORS_READ,
    PERMISSIONS.MAJORS_UPDATE,
    PERMISSIONS.MAJORS_DELETE,
  ],
  
  // Full CRUD for admission sessions
  ADMISSION_SESSIONS_FULL: [
    PERMISSIONS.ADMISSION_SESSIONS_CREATE,
    PERMISSIONS.ADMISSION_SESSIONS_READ,
    PERMISSIONS.ADMISSION_SESSIONS_UPDATE,
    PERMISSIONS.ADMISSION_SESSIONS_DELETE,
  ],
  
  // Full CRUD for quotas
  QUOTAS_FULL: [
    PERMISSIONS.QUOTAS_CREATE,
    PERMISSIONS.QUOTAS_READ,
    PERMISSIONS.QUOTAS_UPDATE,
    PERMISSIONS.QUOTAS_DELETE,
  ],
  
  // Full CRUD for roles
  ROLES_FULL: [
    PERMISSIONS.ROLES_CREATE,
    PERMISSIONS.ROLES_READ,
    PERMISSIONS.ROLES_UPDATE,
    PERMISSIONS.ROLES_DELETE,
  ],
  
  // Full CMS access
  CMS_FULL: [
    PERMISSIONS.POSTS_CREATE,
    PERMISSIONS.POSTS_READ,
    PERMISSIONS.POSTS_UPDATE,
    PERMISSIONS.POSTS_DELETE,
    PERMISSIONS.POSTS_PUBLISH,
    PERMISSIONS.CATEGORIES_CREATE,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.CATEGORIES_UPDATE,
    PERMISSIONS.CATEGORIES_DELETE,
    PERMISSIONS.FAQS_CREATE,
    PERMISSIONS.FAQS_READ,
    PERMISSIONS.FAQS_UPDATE,
    PERMISSIONS.FAQS_DELETE,
    PERMISSIONS.MEDIA_UPLOAD,
    PERMISSIONS.MEDIA_READ,
    PERMISSIONS.MEDIA_DELETE,
  ],
  
  // Read-only access
  READ_ONLY: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.STUDENTS_READ,
    PERMISSIONS.MAJORS_READ,
    PERMISSIONS.ADMISSION_SESSIONS_READ,
    PERMISSIONS.QUOTAS_READ,
    PERMISSIONS.RESULTS_READ,
    PERMISSIONS.POSTS_READ,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.FAQS_READ,
    PERMISSIONS.MEDIA_READ,
    PERMISSIONS.CONFIG_READ,
  ],
} as const;
