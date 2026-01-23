# Referential Integrity Configuration

## Overview

This document describes the referential integrity constraints configured in the Prisma schema to ensure data consistency and prevent orphaned records.

## Cascade Delete Constraints

The following relationships use `onDelete: Cascade` to automatically delete dependent records when the parent is deleted:

### 1. Student → Applications
- **Relationship**: `Student.applications → Application.student`
- **Behavior**: When a student is deleted, all their applications are automatically deleted
- **Rationale**: Applications cannot exist without a student (Requirement 11.1)

### 2. Student → Email Notifications
- **Relationship**: `Student.notifications → EmailNotification.student`
- **Behavior**: When a student is deleted, all their email notifications are automatically deleted
- **Rationale**: Email notifications are tied to specific students

### 3. User → User Roles
- **Relationship**: `User.roles → UserRole.user`
- **Behavior**: When a user is deleted, all their role assignments are automatically deleted
- **Rationale**: Role assignments cannot exist without a user (Requirement 11.5)

### 4. Role → User Roles
- **Relationship**: `Role.users → UserRole.role`
- **Behavior**: When a role is deleted, all user assignments to that role are automatically deleted
- **Rationale**: User role assignments cannot exist without the role

### 5. Role → Role Permissions
- **Relationship**: `Role.permissions → RolePermission.role`
- **Behavior**: When a role is deleted, all permission assignments to that role are automatically deleted
- **Rationale**: Role permission assignments cannot exist without the role (Requirement 11.3)

### 6. Permission → Role Permissions
- **Relationship**: `Permission.roles → RolePermission.permission`
- **Behavior**: When a permission is deleted, all role assignments of that permission are automatically deleted
- **Rationale**: Role permission assignments cannot exist without the permission (Requirement 11.3)

### 7. AdmissionSession → Session Quotas
- **Relationship**: `AdmissionSession.quotas → SessionQuota.session`
- **Behavior**: When an admission session is deleted, all its quotas are automatically deleted
- **Rationale**: Quotas are specific to a session and cannot exist without it

### 8. Major → Session Quotas
- **Relationship**: `Major.quotas → SessionQuota.major`
- **Behavior**: When a major is deleted, all its quotas are automatically deleted
- **Rationale**: Quotas are specific to a major and cannot exist without it

## Restrict Delete Constraints

The following relationships use `onDelete: Restrict` to prevent deletion of parent records when dependent records exist:

### 1. Major → Applications
- **Relationship**: `Major.applications → Application.major`
- **Behavior**: Cannot delete a major if applications reference it
- **Rationale**: Prevents data loss and maintains historical admission records (Requirement 11.4)
- **Error**: Attempting to delete a major with applications will throw a foreign key constraint error

### 2. AdmissionSession → Applications
- **Relationship**: `AdmissionSession.applications → Application.session`
- **Behavior**: Cannot delete an admission session if applications reference it
- **Rationale**: Prevents data loss and maintains historical admission records (Requirement 11.2)
- **Error**: Attempting to delete a session with applications will throw a foreign key constraint error

## Set Null Constraints

The following relationships use `onDelete: SetNull` to set the foreign key to null when the parent is deleted:

### 1. Category → Posts
- **Relationship**: `Category.posts → Post.category`
- **Behavior**: When a category is deleted, posts in that category have their `categoryId` set to null
- **Rationale**: Posts can exist without a category

### 2. User → Posts
- **Relationship**: `User.posts → Post.author`
- **Behavior**: When a user is deleted, posts authored by that user have their `authorId` set to null
- **Rationale**: Posts should be preserved even if the author is deleted

### 3. User → Media Files
- **Relationship**: `User.mediaFiles → MediaFile.uploader`
- **Behavior**: When a user is deleted, media files uploaded by that user have their `uploadedBy` set to null
- **Rationale**: Media files should be preserved even if the uploader is deleted

## Enum Constraints

The following enums are enforced at the database level through Prisma:

1. **PostStatus**: `draft`, `published`
2. **SessionStatus**: `upcoming`, `active`, `closed`
3. **AdmissionStatus**: `pending`, `admitted`, `not_admitted`
4. **EmailStatus**: `pending`, `processing`, `sent`, `failed`

PostgreSQL automatically validates that only these values can be stored in the respective columns.

## Unique Constraints

The following unique constraints ensure data integrity:

1. **User.username**: Prevents duplicate usernames
2. **User.email**: Prevents duplicate email addresses
3. **Permission.name**: Prevents duplicate permission names
4. **Role.name**: Prevents duplicate role names
5. **Category.slug**: Prevents duplicate category slugs
6. **Post.slug**: Prevents duplicate post slugs
7. **Major.code**: Prevents duplicate major codes
8. **Student.idCard**: Prevents duplicate ID card numbers
9. **SessionQuota**: Unique combination of `[sessionId, majorId, admissionMethod]`
10. **Application**: Unique combination of `[studentId, sessionId, preferencePriority]`

## Testing

Referential integrity constraints are tested in `src/prisma/prisma.service.spec.ts`:

- ✅ Cascade delete: Student → Applications
- ✅ Restrict delete: Major → Applications
- ✅ Restrict delete: AdmissionSession → Applications
- ✅ Cascade delete: User → UserRoles
- ✅ Cascade delete: Role → RolePermissions

## Migration

The referential integrity constraints were configured in migration:
- `20260121073234_add_referential_integrity_constraints`

This migration changed the foreign key constraints for:
- `Application.majorId`: Changed from CASCADE to RESTRICT
- `Application.sessionId`: Changed from CASCADE to RESTRICT

## Requirements Validation

- ✅ **Requirement 11.1**: Referential integrity between students and applications enforced via CASCADE
- ✅ **Requirement 11.2**: Referential integrity between applications and majors enforced via RESTRICT
- ✅ **Requirement 11.3**: Referential integrity between roles and permissions enforced via CASCADE
- ✅ **Requirement 11.4**: Major deletion prevented if applications reference it via RESTRICT
- ✅ **Requirement 11.5**: User deletion removes associated role assignments via CASCADE
- ✅ **Enum constraints**: All enums properly defined and enforced by PostgreSQL
