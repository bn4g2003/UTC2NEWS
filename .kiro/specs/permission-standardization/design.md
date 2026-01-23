# Design Document: Permission Standardization

## Overview

This design establishes a unified permission naming convention across the admission management system's three layers: database seed, backend controllers, and frontend application. The standardization uses a `resource:action` format that is clear, consistent, and maintainable.

### Current State Analysis

**Backend Seed (admission-backend/prisma/seed.ts):**
- Uses underscore format: `create_major`, `edit_major`, `manage_users`, `manage_sessions`
- Contains 33 permissions
- Inconsistent action verbs: "create", "edit", "manage", "configure", "view"

**Backend Controllers:**
- Mix of formats: `create_major`, `update_student`, `manage_preferences`, `manage_sessions`
- Uses `@RequirePermissions()` decorator
- Inconsistent with seed file (e.g., seed has `edit_major`, controller uses `create_major` for updates)

**Frontend (admission-frontend/src/lib/rbac.ts):**
- Uses colon format: `users:create`, `students:delete`, `programs:update`
- Consistent CRUD verbs: create, read, update, delete
- Well-organized with PERMISSIONS constant object

### Design Goals

1. Adopt the frontend's `resource:action` format as the standard
2. Use consistent CRUD verbs: create, read, update, delete
3. Add domain-specific verbs where needed: export, import, send, run, publish, assign
4. Ensure all three layers use identical permission strings
5. Maintain complete coverage of all system functionality

## Architecture

### Permission Naming Convention

**Format:** `resource:action`

**Rules:**
- Lowercase letters only
- Underscores for multi-word resources (e.g., `admission_sessions:create`)
- Singular resource names where possible
- Standard CRUD actions: create, read, update, delete
- Domain-specific actions: export, import, send, run, publish, assign

**Examples:**
- `users:create` - Create a new user
- `students:update` - Update student information
- `majors:delete` - Delete a major
- `results:export` - Export admission results
- `emails:send` - Send email notifications

### Resource Categories

The system has the following resource categories:

1. **User Management:** users, roles, permissions
2. **Student Management:** students, preferences
3. **Program Management:** majors, admission_sessions, quotas
4. **Data Operations:** import, filter, results
5. **Communication:** emails
6. **Content Management:** posts, faqs, categories, media
7. **System Configuration:** config

## Components and Interfaces

### 1. Permission Definition (Database Seed)

**File:** `admission-backend/prisma/seed.ts`

**Structure:**
```typescript
interface PermissionDefinition {
  name: string;        // Format: "resource:action"
  description: string; // Human-readable description
}
```

**Responsibilities:**
- Define all system permissions using standardized format
- Create permissions in database during seeding
- Assign permissions to default admin role

### 2. Permission Enforcement (Backend Controllers)

**File:** `admission-backend/src/*/*.controller.ts`

**Decorator Usage:**
```typescript
@RequirePermissions('resource:action')
```

**Responsibilities:**
- Protect API endpoints with permission checks
- Use standardized permission names
- Ensure every protected endpoint has appropriate permission

### 3. Permission Checking (Frontend)

**File:** `admission-frontend/src/lib/rbac.ts`

**Structure:**
```typescript
export const PERMISSIONS = {
  RESOURCE_ACTION: 'resource:action',
  // ...
} as const;
```

**Responsibilities:**
- Define permission constants for type safety
- Provide permission checking utilities
- Enable conditional UI rendering based on permissions

## Data Models

### Complete Standardized Permission List

Based on analysis of current system functionality, here is the complete list of standardized permissions:

#### User Management (10 permissions)
- `users:create` - Create new user accounts
- `users:read` - View user information
- `users:update` - Update user details
- `users:delete` - Delete user accounts
- `users:update_status` - Activate/deactivate users
- `users:update_password` - Change user passwords
- `roles:create` - Create new roles
- `roles:read` - View roles
- `roles:assign` - Assign roles to users
- `permissions:read` - View permissions

#### Student Management (5 permissions)
- `students:create` - Create student records
- `students:read` - View student information
- `students:update` - Update student details
- `students:delete` - Delete student records
- `preferences:manage` - Manage student major preferences

#### Program Management (12 permissions)
- `majors:create` - Create new majors
- `majors:read` - View major information
- `majors:update` - Update major details
- `majors:delete` - Delete majors
- `admission_sessions:create` - Create admission sessions
- `admission_sessions:read` - View admission sessions
- `admission_sessions:update` - Update admission sessions
- `admission_sessions:delete` - Delete admission sessions
- `quotas:create` - Configure admission quotas
- `quotas:read` - View quota information
- `quotas:update` - Update quota configurations
- `quotas:delete` - Delete quota configurations

#### Data Operations (4 permissions)
- `import:execute` - Import student data from Excel
- `filter:execute` - Run virtual filtering algorithm
- `results:read` - View admission results
- `results:export` - Export admission results

#### Communication (2 permissions)
- `emails:send` - Send email notifications
- `emails:read` - View email delivery status

#### Content Management (13 permissions)
- `posts:create` - Create blog posts
- `posts:read` - View posts
- `posts:update` - Update posts
- `posts:delete` - Delete posts
- `posts:publish` - Publish posts
- `faqs:create` - Create FAQ entries
- `faqs:read` - View FAQs
- `faqs:update` - Update FAQs
- `faqs:delete` - Delete FAQs
- `categories:create` - Create content categories
- `categories:read` - View categories
- `categories:update` - Update categories
- `categories:delete` - Delete categories
- `media:upload` - Upload media files
- `media:read` - View media files
- `media:delete` - Delete media files

#### System Configuration (2 permissions)
- `config:read` - View system settings
- `config:update` - Update system settings

#### RBAC Management (3 permissions)
- `roles:update` - Update role details
- `roles:delete` - Delete roles
- `permissions:assign` - Assign permissions to roles

**Total: 51 permissions**

### Permission Mapping (Legacy to Standardized)

#### Backend Seed Mappings:
- `create_major` → `majors:create`
- `edit_major` → `majors:update`
- `delete_major` → `majors:delete`
- `view_major` → `majors:read`
- `create_session` → `admission_sessions:create`
- `edit_session` → `admission_sessions:update`
- `delete_session` → `admission_sessions:delete`
- `view_session` → `admission_sessions:read`
- `configure_quota` → `quotas:create`, `quotas:update`
- `import_student` → `import:execute`
- `create_student` → `students:create`
- `edit_student` → `students:update`
- `delete_student` → `students:delete`
- `view_student` → `students:read`
- `run_filter` → `filter:execute`
- `export_results` → `results:export`
- `send_emails` → `emails:send`
- `view_email_status` → `emails:read`
- `create_content` → `posts:create`, `faqs:create`, `categories:create`
- `edit_content` → `posts:update`, `faqs:update`, `categories:update`
- `delete_content` → `posts:delete`, `faqs:delete`, `categories:delete`
- `publish_content` → `posts:publish`
- `upload_media` → `media:upload`
- `view_roles` → `roles:read`
- `manage_roles` → `roles:create`, `roles:update`, `roles:delete`, `permissions:assign`
- `view_permissions` → `permissions:read`
- `manage_permissions` → `permissions:assign`
- `view_users` → `users:read`
- `manage_users` → `users:create`, `users:update`, `users:delete`, `users:update_status`, `users:update_password`, `roles:assign`
- `assign_roles` → `roles:assign`
- `manage_settings` → `config:read`, `config:update`
- `view_reports` → (removed - not currently used in controllers)

#### Backend Controller Mappings:
- `manage_users` → `users:create`, `users:update`, `users:delete`, `users:update_status`, `users:update_password`
- `view_users` → `users:read`
- `create_student` → `students:create`
- `update_student` → `students:update`
- `view_student` → `students:read`
- `manage_preferences` → `preferences:manage`
- `export_results` → `results:export`
- `manage_permissions` → `permissions:assign`
- `view_permissions` → `permissions:read`
- `manage_roles` → `roles:create`, `roles:update`, `roles:delete`
- `view_roles` → `roles:read`
- `create_major` → `majors:create`, `majors:update`, `majors:delete` (currently used for all major operations)
- `manage_sessions` → `admission_sessions:create`, `admission_sessions:update`, `admission_sessions:delete`
- `manage_quotas` → `quotas:create`, `quotas:update`, `quotas:delete`
- `import_student` → `import:execute`
- `run_filter` → `filter:execute`
- `send_emails` → `emails:send`
- `view_email_status` → `emails:read`
- `manage_settings` → `config:read`, `config:update`
- `manage_content` → `posts:create`, `posts:update`, `posts:delete`, `faqs:create`, `faqs:update`, `faqs:delete`, `categories:create`, `categories:update`, `categories:delete`, `media:upload`, `media:delete`

#### Frontend Mappings:
The frontend already uses the standardized format, but needs these additions:
- Add `preferences:manage`
- Add `import:execute`
- Add `filter:execute`
- Add `posts:publish`
- Add `media:upload`
- Add `users:update_status`
- Add `users:update_password`
- Add `permissions:assign`
- Add `roles:assign`
- Rename `email:create` → `emails:send`
- Rename `email:read` → `emails:read`
- Rename `import:create` → `import:execute`
- Rename `filter:create` → `filter:execute`
- Rename `media:create` → `media:upload`



## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing the acceptance criteria, several properties can be consolidated:
- Requirements 2.1-2.10 (completeness checks) can be combined into a single property that validates the complete permission list
- Requirements 1.1, 1.2, 1.3 (format validation) can be combined into a single comprehensive format validation property
- Requirements 4.1, 4.3, 4.4 (controller validation) can be combined into a single property
- Requirements 5.1, 5.3, 5.4 (frontend validation) can be combined into a single property
- Requirements 6.1, 6.2, 6.3 (cross-layer consistency) can be combined into a single bidirectional consistency property

### Property 1: Permission Format Validation

*For any* permission string in the system (seed, controllers, or frontend), it must match the format `resource:action` where resource is lowercase with underscores for multi-word names, and action is lowercase.

**Validates: Requirements 1.1, 1.2, 1.3, 3.1, 4.1, 5.1**

### Property 2: Action Verb Consistency

*For any* permission string, the action component must be either a standard CRUD verb (create, read, update, delete) or an approved domain-specific verb (export, import, send, run, publish, assign, execute, manage, upload).

**Validates: Requirements 1.4, 1.5**

### Property 3: Complete Permission List Coverage

*For any* module in the system (users, students, majors, admission_sessions, quotas, import, filter, results, emails, posts, faqs, categories, media, config, roles, permissions), the seed file must define all necessary permissions for that module's operations.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 3.2**

### Property 4: Permission Description Completeness

*For any* permission in the seed file, it must have a non-empty description field that explains what the permission allows.

**Validates: Requirements 3.3**

### Property 5: Backend Controller Permission Validity

*For any* `@RequirePermissions()` decorator in backend controllers, all permission strings must use the standardized format and reference at least one permission.

**Validates: Requirements 4.1, 4.3, 4.4**

### Property 6: Frontend Permission Validity

*For any* permission string used in frontend code (PERMISSIONS constants, checkPermission calls, PERMISSION_GROUPS), it must use the standardized format.

**Validates: Requirements 5.1, 5.3, 5.4**

### Property 7: Cross-Layer Permission Consistency

*For any* permission string used in backend controllers or frontend, it must exist in the database seed permission list, and conversely, all permissions in the seed should be used in at least one layer.

**Validates: Requirements 6.1, 6.2, 6.3**

## Error Handling

### Invalid Permission Format

**Scenario:** A developer attempts to add a permission that doesn't follow the standardized format.

**Handling:**
- Validation scripts should detect and report format violations
- Code review should catch non-standard permission names
- Documentation should clearly specify the format requirements

### Missing Permission in Seed

**Scenario:** A controller or frontend component references a permission that doesn't exist in the database seed.

**Handling:**
- Runtime: RBAC guard will deny access (permission not found = no access)
- Development: Validation scripts should detect missing permissions
- Testing: Integration tests should verify all referenced permissions exist

### Orphaned Permissions

**Scenario:** A permission exists in the seed but is never used in controllers or frontend.

**Handling:**
- Validation scripts should report unused permissions
- Review process should determine if permission should be removed or usage added
- Keep permissions that are intentionally reserved for future use

### Legacy Permission References

**Scenario:** Old code still references legacy permission names after migration.

**Handling:**
- Search codebase for legacy patterns (underscore format without colon)
- Update all references to use standardized format
- Remove legacy permission definitions from seed file

## Testing Strategy

This feature focuses on code consistency and standardization rather than runtime behavior. Testing will primarily use static analysis and validation scripts rather than property-based testing.

### Validation Scripts

**Permission Format Validator:**
- Parse all permission strings from seed file, controllers, and frontend
- Validate each against the standardized format regex: `^[a-z_]+:[a-z_]+$`
- Report any violations with file location and line number

**Cross-Layer Consistency Validator:**
- Extract all permissions from seed file
- Extract all permissions from controller `@RequirePermissions()` decorators
- Extract all permissions from frontend PERMISSIONS constants
- Compare sets and report:
  - Permissions in controllers but not in seed
  - Permissions in frontend but not in seed
  - Permissions in seed but never used (potential orphans)

**Completeness Validator:**
- Check that all 51 expected permissions exist in seed file
- Verify each permission has a non-empty description
- Ensure no legacy permission names remain

### Manual Testing

**Database Seed Verification:**
1. Run seed file on clean database
2. Verify all 51 permissions are created
3. Verify admin role has all permissions assigned
4. Verify existing role-permission assignments are preserved (if database has existing data)

**Backend API Testing:**
1. Test protected endpoints with users having specific permissions
2. Verify access is granted when user has required permission
3. Verify access is denied when user lacks required permission
4. Test endpoints that require multiple permissions

**Frontend UI Testing:**
1. Log in with users having different permission sets
2. Verify UI elements are shown/hidden based on permissions
3. Verify API calls are made only when user has required permissions
4. Test permission groups (e.g., USERS_FULL, CMS_FULL)

### Integration Testing

**End-to-End Permission Flow:**
1. Create a new role with specific permissions
2. Assign role to a user
3. Log in as that user
4. Verify backend allows/denies API access correctly
5. Verify frontend shows/hides UI elements correctly
6. Verify permission checks are consistent across layers
