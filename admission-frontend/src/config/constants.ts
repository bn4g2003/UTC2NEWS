/**
 * Application configuration constants
 * Centralized configuration for environment-specific settings
 */

// Validate required environment variables
const requiredEnvVars = ['NEXT_PUBLIC_API_BASE_URL'];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.warn(`Warning: Required environment variable ${envVar} is not set`);
  }
});

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}`
    : 'http://localhost:3000',
  TIMEOUT: 30000, // 30 seconds
} as const;

// Authentication Configuration
export const AUTH_CONFIG = {
  JWT_EXPIRY: parseInt(process.env.NEXT_PUBLIC_JWT_EXPIRY || '86400', 10), // 24 hours in seconds
  TOKEN_STORAGE_KEY: process.env.NEXT_PUBLIC_TOKEN_STORAGE_KEY || 'admission_token',
  REFRESH_TOKEN_KEY: 'admission_refresh_token',
} as const;

// Application Configuration
export const APP_CONFIG = {
  NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Admission Management System',
  VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  DEFAULT_LANGUAGE: 'vi',
} as const;

// Pagination Configuration
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const;

// Route Paths
export const ROUTES = {
  // Public routes
  PUBLIC: {
    HOME: '/',
    RESULT_LOOKUP: '/tra-cuu',
    PROGRAMS: '/nganh-tuyen-sinh',
    NEWS: '/tin-tuc',
    GUIDES: '/huong-dan',
  },
  // Admin routes
  ADMIN: {
    DASHBOARD: '/dashboard',
    USERS: '/users',
    ROLES: '/roles',
    STUDENTS: '/students',
    PROGRAMS: '/programs',
    SESSIONS: '/sessions',
    QUOTAS: '/quotas',
    PREFERENCES: '/preferences',
    IMPORT: '/import',
    FILTER: '/filter',
    RESULTS: '/results',
    EMAIL: '/email',
    COMMUNICATION: {
      CHAT: '/communication/chat',
    },
    JIRA: '/jira',
    CMS: {
      POSTS: '/posts',
      CATEGORIES: '/categories',
      FAQS: '/faqs',
      MEDIA: '/media',
    },
  },
  // Auth routes
  AUTH: {
    LOGIN: '/login',
    LOGOUT: '/logout',
  },
} as const;

// Permission Keys - Must match backend permission names exactly
// Using standardized format: resource:action
export const PERMISSIONS = {
  USERS: {
    CREATE: 'users:create',
    READ: 'users:read',
    UPDATE: 'users:update',
    DELETE: 'users:delete',
    UPDATE_STATUS: 'users:update_status',
    UPDATE_PASSWORD: 'users:update_password',
  },
  ROLES: {
    CREATE: 'roles:create',
    READ: 'roles:read',
    UPDATE: 'roles:update',
    DELETE: 'roles:delete',
    ASSIGN: 'roles:assign',
  },
  PERMISSIONS_MANAGE: {
    VIEW: 'permissions:read',
    MANAGE: 'permissions:assign',
  },
  STUDENTS: {
    CREATE: 'students:create',
    READ: 'students:read',
    UPDATE: 'students:update',
    DELETE: 'students:delete',
  },
  PREFERENCES: {
    MANAGE: 'preferences:manage',
  },
  PROGRAMS: {
    CREATE: 'majors:create',
    READ: 'majors:read',
    UPDATE: 'majors:update',
    DELETE: 'majors:delete',
  },
  SESSIONS: {
    CREATE: 'admission_sessions:create',
    READ: 'admission_sessions:read',
    UPDATE: 'admission_sessions:update',
    DELETE: 'admission_sessions:delete',
  },
  QUOTAS: {
    CREATE: 'quotas:create',
    READ: 'quotas:read',
    UPDATE: 'quotas:update',
    DELETE: 'quotas:delete',
  },
  IMPORT: {
    EXECUTE: 'import:execute',
  },
  FILTER: {
    EXECUTE: 'filter:execute',
  },
  RESULTS: {
    READ: 'results:read',
    EXPORT: 'results:export',
  },
  EMAIL: {
    SEND: 'emails:send',
    READ: 'emails:read',
  },
  CMS: {
    POSTS: {
      CREATE: 'posts:create',
      READ: 'posts:read',
      UPDATE: 'posts:update',
      DELETE: 'posts:delete',
      PUBLISH: 'posts:publish',
    },
    CATEGORIES: {
      CREATE: 'categories:create',
      READ: 'categories:read',
      UPDATE: 'categories:update',
      DELETE: 'categories:delete',
    },
    FAQS: {
      CREATE: 'faqs:create',
      READ: 'faqs:read',
      UPDATE: 'faqs:update',
      DELETE: 'faqs:delete',
    },
    MEDIA: {
      UPLOAD: 'media:upload',
      READ: 'media:read',
      DELETE: 'media:delete',
    },
  },
  CONFIG: {
    READ: 'config:read',
    UPDATE: 'config:update',
  },
  COMMUNICATION: {
    CHAT: {
      READ: 'chat:read',
      SEND: 'chat:send',
      CREATE_ROOM: 'chat:create_room',
    },
  },
} as const;
