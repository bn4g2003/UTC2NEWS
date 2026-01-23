# Implementation Plan: Permission Standardization

## Overview

This plan systematically updates all three layers of the admission management system to use standardized permission names in the format `resource:action`. The implementation proceeds layer by layer: database seed first, then backend controllers, then frontend, ensuring consistency at each step.

## Tasks

- [x] 1. Update database seed file with standardized permissions
  - Replace all 33 legacy permissions with 51 standardized permissions
  - Use the complete permission list from the design document
  - Ensure each permission has format `resource:action` and descriptive text
  - Maintain upsert operations to preserve existing data
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1-2.10, 3.1, 3.2, 3.3, 3.4, 8.1, 8.2_

- [ ] 2. Update backend controllers to use standardized permissions
  - [x] 2.1 Update users controller
    - Replace `manage_users` with granular permissions: `users:create`, `users:update`, `users:delete`, `users:update_status`, `users:update_password`
    - Replace `view_users` with `users:read`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 2.2 Update student controller
    - Replace `create_student` with `students:create`
    - Replace `update_student` with `students:update`
    - Replace `view_student` with `students:read`
    - Replace `manage_preferences` with `preferences:manage`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 2.3 Update program controller
    - Replace `create_major` with `majors:create`, `majors:update`, `majors:delete` (split by operation)
    - Replace `manage_sessions` with `admission_sessions:create`, `admission_sessions:update`, `admission_sessions:delete`
    - Replace `manage_quotas` with `quotas:create`, `quotas:update`, `quotas:delete`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 2.4 Update import controller
    - Replace `import_student` with `import:execute`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 2.5 Update filter controller
    - Replace `run_filter` with `filter:execute`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 2.6 Update result controller
    - Replace `export_results` with `results:export`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 2.7 Update email controller
    - Replace `send_emails` with `emails:send`
    - Replace `view_email_status` with `emails:read`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 2.8 Update CMS controller
    - Replace `manage_content` with granular permissions based on operation and resource type
    - Use `posts:create`, `posts:update`, `posts:delete` for post operations
    - Use `faqs:create`, `faqs:update`, `faqs:delete` for FAQ operations
    - Use `categories:create`, `categories:update`, `categories:delete` for category operations
    - Use `media:upload`, `media:delete` for media operations
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 2.9 Update config controller
    - Replace `manage_settings` with `config:read` and `config:update` based on operation
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 2.10 Update RBAC controller
    - Replace `manage_permissions` with `permissions:assign`
    - Replace `view_permissions` with `permissions:read`
    - Replace `manage_roles` with `roles:create`, `roles:update`, `roles:delete` based on operation
    - Replace `view_roles` with `roles:read`
    - Replace `manage_users` with `roles:assign` for role assignment endpoint
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 3. Checkpoint - Verify backend consistency
  - Ensure all controllers use standardized permission format
  - Ensure no legacy permission names remain in controllers
  - Ask the user if questions arise

- [ ] 4. Update frontend permission definitions
  - [x] 4.1 Update PERMISSIONS constant in rbac.ts
    - Add missing permissions: `preferences:manage`, `import:execute`, `filter:execute`, `posts:publish`, `media:upload`, `users:update_status`, `users:update_password`, `permissions:assign`, `roles:assign`
    - Rename `email:create` to `emails:send`
    - Rename `email:read` to `emails:read`
    - Rename `import:create` to `import:execute`
    - Rename `filter:create` to `filter:execute`
    - Rename `media:create` to `media:upload`
    - Ensure all permission values use standardized format
    - _Requirements: 5.1, 5.2_
  
  - [x] 4.2 Update PERMISSION_GROUPS in rbac.ts
    - Update all arrays to use standardized permission names
    - Ensure groups reference only permissions that exist in PERMISSIONS constant
    - _Requirements: 5.4_
  
  - [x] 4.3 Search and update permission check calls
    - Find all calls to `checkPermission()`, `usePermission()`, `hasApiPermission()`, etc.
    - Update any hardcoded permission strings to use PERMISSIONS constants
    - Ensure all permission strings use standardized format
    - _Requirements: 5.3_

- [ ] 5. Final checkpoint - Verify cross-layer consistency
  - Verify all permissions in seed file match the 51 standardized permissions
  - Verify all controller permissions exist in seed file
  - Verify all frontend permissions exist in seed file
  - Verify no legacy permission names remain in any layer
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Each controller update should be done carefully to ensure the correct granular permission is used for each operation
- The `manage_*` permissions are being split into specific CRUD operations for better granularity
- Frontend already uses the standardized format, so updates are minimal (mostly additions and renames)
- All three layers must be updated for the system to work correctly
- The seed file should be run after updates to populate the database with new permissions
