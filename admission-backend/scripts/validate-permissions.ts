/**
 * Permission Validation Script
 * 
 * This script validates that all permissions across the backend follow
 * the standardized format and are consistent between seed file and controllers.
 */

import * as fs from 'fs';
import * as path from 'path';

// Expected permissions from the design document (54 total)
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

// Valid action verbs
const VALID_ACTIONS = [
  'create', 'read', 'update', 'delete',  // CRUD
  'export', 'import', 'send', 'run', 'publish', 'assign', 'execute', 'manage', 'upload',  // Domain-specific
  'update_status', 'update_password',  // Compound actions
];

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    seedPermissions: number;
    controllerPermissions: number;
    expectedPermissions: number;
  };
}

/**
 * Extract permissions from seed file
 */
function extractSeedPermissions(seedPath: string): Set<string> {
  const content = fs.readFileSync(seedPath, 'utf-8');
  const permissions = new Set<string>();
  
  // Match permission definitions: { name: 'permission:name', description: '...' }
  // Only match entries that have both name and description (permissions, not roles)
  const regex = /{\s*name:\s*['"]([^'"]+)['"],\s*description:\s*['"][^'"]+['"]\s*}/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    permissions.add(match[1]);
  }
  
  return permissions;
}

/**
 * Extract permissions from controller files
 */
function extractControllerPermissions(controllersDir: string): Map<string, string[]> {
  const permissions = new Map<string, string[]>();
  
  function scanDirectory(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.name.endsWith('.controller.ts')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const filePermissions: string[] = [];
        
        // Match @RequirePermissions('permission:name') or @RequirePermissions("permission:name")
        const regex = /@RequirePermissions\(['"]([^'"]+)['"]\)/g;
        let match;
        
        while ((match = regex.exec(content)) !== null) {
          filePermissions.push(match[1]);
        }
        
        if (filePermissions.length > 0) {
          permissions.set(fullPath, filePermissions);
        }
      }
    }
  }
  
  scanDirectory(controllersDir);
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
  
  const [resource, action] = permission.split(':');
  
  // Check if action is valid
  if (!VALID_ACTIONS.includes(action)) {
    return {
      valid: false,
      error: `Invalid action: "${action}" in "${permission}" is not a recognized action verb`,
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
      seedPermissions: 0,
      controllerPermissions: 0,
      expectedPermissions: EXPECTED_PERMISSIONS.length,
    },
  };
  
  console.log('=== Permission Validation Report ===\n');
  
  // 1. Extract permissions from seed file
  console.log('1. Validating seed file permissions...');
  const seedPath = path.join(__dirname, '..', 'prisma', 'seed.ts');
  const seedPermissions = extractSeedPermissions(seedPath);
  result.stats.seedPermissions = seedPermissions.size;
  
  console.log(`   Found ${seedPermissions.size} permissions in seed file`);
  
  // 2. Validate seed permission formats
  for (const permission of seedPermissions) {
    const validation = validateFormat(permission);
    if (!validation.valid) {
      result.errors.push(`Seed file: ${validation.error}`);
      result.success = false;
    }
  }
  
  // 3. Check for missing expected permissions in seed
  const missingInSeed = EXPECTED_PERMISSIONS.filter(p => !seedPermissions.has(p));
  if (missingInSeed.length > 0) {
    result.errors.push(`Seed file missing ${missingInSeed.length} expected permissions: ${missingInSeed.join(', ')}`);
    result.success = false;
  }
  
  // 4. Check for extra permissions in seed (not in expected list)
  const extraInSeed = Array.from(seedPermissions).filter(p => !EXPECTED_PERMISSIONS.includes(p));
  if (extraInSeed.length > 0) {
    result.warnings.push(`Seed file has ${extraInSeed.length} permissions not in expected list: ${extraInSeed.join(', ')}`);
  }
  
  // 5. Extract permissions from controllers
  console.log('\n2. Validating controller permissions...');
  const controllersDir = path.join(__dirname, '..', 'src');
  const controllerPermissions = extractControllerPermissions(controllersDir);
  
  const allControllerPermissions = new Set<string>();
  for (const [file, perms] of controllerPermissions) {
    const relativePath = path.relative(path.join(__dirname, '..'), file);
    console.log(`   ${relativePath}: ${perms.length} permissions`);
    
    for (const perm of perms) {
      allControllerPermissions.add(perm);
      
      // Validate format
      const validation = validateFormat(perm);
      if (!validation.valid) {
        result.errors.push(`${relativePath}: ${validation.error}`);
        result.success = false;
      }
    }
  }
  
  result.stats.controllerPermissions = allControllerPermissions.size;
  console.log(`   Total unique permissions in controllers: ${allControllerPermissions.size}`);
  
  // 6. Check cross-layer consistency
  console.log('\n3. Validating cross-layer consistency...');
  
  // Permissions in controllers but not in seed
  const inControllersNotSeed = Array.from(allControllerPermissions).filter(p => !seedPermissions.has(p));
  if (inControllersNotSeed.length > 0) {
    result.errors.push(`Controllers reference ${inControllersNotSeed.length} permissions not in seed file: ${inControllersNotSeed.join(', ')}`);
    result.success = false;
  }
  
  // Permissions in seed but not used in controllers (potential orphans)
  const inSeedNotControllers = Array.from(seedPermissions).filter(p => !allControllerPermissions.has(p));
  if (inSeedNotControllers.length > 0) {
    result.warnings.push(`Seed file has ${inSeedNotControllers.length} permissions not used in controllers: ${inSeedNotControllers.join(', ')}`);
  }
  
  // 7. Summary
  console.log('\n=== Summary ===');
  console.log(`Expected permissions: ${result.stats.expectedPermissions}`);
  console.log(`Seed permissions: ${result.stats.seedPermissions}`);
  console.log(`Controller permissions: ${result.stats.controllerPermissions}`);
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
