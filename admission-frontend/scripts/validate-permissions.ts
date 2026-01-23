/**
 * Frontend Permission Validation Script
 * 
 * This script validates that all permissions in the frontend follow
 * the standardized format and match the backend seed file.
 */

import * as fs from 'fs';
import * as path from 'path';

// Expected permissions from the backend seed file (54 total)
const EXPECTED_PERMISSIONS = [
  // User Management (10)
  'users:create', 'users:read', 'users:update', 'users:delete',
  'users:update_status', 'users:update_password',
  'roles:create', 'roles:read', 'roles:assign',
  'permissions:read',
  
  // Student Management (5)
  'students:create', 'students:read', 'students:update', 'students:delete',
  'preferences:manage',
  
  // Program Management (12)
  'majors:create', 'majors:read', 'majors:update', 'majors:delete',
  'admission_sessions:create', 'admission_sessions:read', 'admission_sessions:update', 'admission_sessions:delete',
  'quotas:create', 'quotas:read', 'quotas:update', 'quotas:delete',
  
  // Data Operations (4)
  'import:execute', 'filter:execute', 'results:read', 'results:export',
  
  // Communication (2)
  'emails:send', 'emails:read',
  
  // Content Management (16)
  'posts:create', 'posts:read', 'posts:update', 'posts:delete', 'posts:publish',
  'faqs:create', 'faqs:read', 'faqs:update', 'faqs:delete',
  'categories:create', 'categories:read', 'categories:update', 'categories:delete',
  'media:upload', 'media:read', 'media:delete',
  
  // System Configuration (2)
  'config:read', 'config:update',
  
  // RBAC Management (3)
  'roles:update', 'roles:delete', 'permissions:assign',
];

// Standardized permission format regex
const PERMISSION_FORMAT_REGEX = /^[a-z_]+:[a-z_]+$/;

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    frontendPermissions: number;
    expectedPermissions: number;
  };
}

/**
 * Extract permissions from frontend PERMISSIONS constant
 */
function extractFrontendPermissions(rbacPath: string): Set<string> {
  const content = fs.readFileSync(rbacPath, 'utf-8');
  const permissions = new Set<string>();
  
  // Match permission constant values: PERMISSION_NAME: 'permission:value'
  const regex = /[A-Z_]+:\s*['"]([a-z_:]+)['"]/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    permissions.add(match[1]);
  }
  
  return permissions;
}

/**
 * Validate permission format
 */
function validateFormat(permission: string): { valid: boolean; error?: string } {
  if (!PERMISSION_FORMAT_REGEX.test(permission)) {
    return {
      valid: false,
      error: `Invalid format: "${permission}" does not match "resource:action" pattern`,
    };
  }
  
  return { valid: true };
}

/**
 * Main validation function
 */
function validatePermissions(): ValidationResult {
  const result: ValidationResult = {
    success: true,
    errors: [],
    warnings: [],
    stats: {
      frontendPermissions: 0,
      expectedPermissions: EXPECTED_PERMISSIONS.length,
    },
  };
  
  console.log('=== Frontend Permission Validation Report ===\n');
  
  // 1. Extract permissions from frontend
  console.log('1. Validating frontend permissions...');
  const rbacPath = path.join(__dirname, '..', 'src', 'lib', 'rbac.ts');
  const frontendPermissions = extractFrontendPermissions(rbacPath);
  result.stats.frontendPermissions = frontendPermissions.size;
  
  console.log(`   Found ${frontendPermissions.size} permissions in frontend`);
  
  // 2. Validate frontend permission formats
  for (const permission of frontendPermissions) {
    const validation = validateFormat(permission);
    if (!validation.valid) {
      result.errors.push(`Frontend: ${validation.error}`);
      result.success = false;
    }
  }
  
  // 3. Check for permissions in frontend not in backend seed
  const inFrontendNotBackend = Array.from(frontendPermissions).filter(p => !EXPECTED_PERMISSIONS.includes(p));
  if (inFrontendNotBackend.length > 0) {
    result.warnings.push(`Frontend has ${inFrontendNotBackend.length} permissions not in backend seed: ${inFrontendNotBackend.join(', ')}`);
  }
  
  // 4. Check for permissions in backend seed not in frontend
  const inBackendNotFrontend = EXPECTED_PERMISSIONS.filter(p => !frontendPermissions.has(p));
  if (inBackendNotFrontend.length > 0) {
    result.warnings.push(`Backend seed has ${inBackendNotFrontend.length} permissions not in frontend: ${inBackendNotFrontend.join(', ')}`);
  }
  
  // 5. Summary
  console.log('\n=== Summary ===');
  console.log(`Expected permissions (backend): ${result.stats.expectedPermissions}`);
  console.log(`Frontend permissions: ${result.stats.frontendPermissions}`);
  console.log(`Errors: ${result.errors.length}`);
  console.log(`Warnings: ${result.warnings.length}`);
  
  if (result.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    result.errors.forEach(err => console.log(`   - ${err}`));
  }
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    result.warnings.forEach(warn => console.log(`   - ${warn}`));
  }
  
  if (result.success && result.errors.length === 0) {
    console.log('\n✅ All validations passed!');
  } else {
    console.log('\n❌ Validation failed!');
  }
  
  return result;
}

// Run validation
const result = validatePermissions();
process.exit(result.success ? 0 : 1);
