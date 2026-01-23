# RBAC Module Implementation

## Overview

The RBAC (Role-Based Access Control) module has been successfully implemented for the Admission Management System. This module provides dynamic permission and role management capabilities, allowing administrators to control access to system features without code changes.

## Components Implemented

### 1. DTOs (Data Transfer Objects)

- `CreatePermissionDto` - For creating new permissions
- `CreateRoleDto` - For creating new roles
- `AssignPermissionsDto` - For assigning permissions to roles
- `AssignRolesDto` - For assigning roles to users

### 2. Service Layer

**RBACService** (`src/rbac/rbac.service.ts`)

Implements the following methods:
- `createPermission(data)` - Creates a new permission
- `createRole(data)` - Creates a new role
- `assignPermissionsToRole(roleId, permissionIds)` - Assigns multiple permissions to a role
- `assignRolesToUser(userId, roleIds)` - Assigns multiple roles to a user
- `getUserPermissions(userId)` - Retrieves all permissions for a user (deduplicated across roles)
- `hasPermission(userId, permissionName)` - Checks if a user has a specific permission

### 3. Guards and Decorators

**PermissionsGuard** (`src/rbac/guards/permissions.guard.ts`)
- Validates that authenticated users have required permissions before accessing protected routes
- Integrates with NestJS Reflector to read permission metadata
- Throws `ForbiddenException` when permissions are missing

**@RequirePermissions Decorator** (`src/rbac/decorators/require-permissions.decorator.ts`)
- Decorator for marking routes with required permissions
- Usage: `@RequirePermissions('create_major', 'edit_major')`

### 4. Controller

**RBACController** (`src/rbac/rbac.controller.ts`)

Provides the following endpoints:
- `POST /permissions` - Create a new permission (requires `manage_permissions`)
- `POST /roles` - Create a new role (requires `manage_roles`)
- `POST /roles/:id/permissions` - Assign permissions to a role (requires `manage_roles`)
- `POST /users/:id/roles` - Assign roles to a user (requires `manage_users`)
- `GET /users/:id/permissions` - Get all permissions for a user (requires `view_permissions`)

All endpoints are protected with `JwtAuthGuard` and `PermissionsGuard`.

## Database Schema

The RBAC module uses the following Prisma models (already defined in schema):

- `User` - System users
- `Permission` - Atomic actions (e.g., create_major, import_student)
- `Role` - Named collections of permissions
- `RolePermission` - Many-to-many relationship between roles and permissions
- `UserRole` - Many-to-many relationship between users and roles

## Testing

### Unit Tests

- **RBACService Tests** (29 tests) - Tests all service methods including:
  - Permission creation with duplicate detection
  - Role creation with duplicate detection
  - Permission assignment to roles
  - Role assignment to users
  - Permission retrieval and deduplication
  - Permission checking

- **RBACController Tests** (5 tests) - Tests all controller endpoints

- **PermissionsGuard Tests** (6 tests) - Tests guard behavior including:
  - Allowing access when no permissions required
  - Allowing access when user has permissions
  - Denying access when permissions missing
  - Handling unauthenticated users

### Integration Tests

- **RBAC E2E Tests** (11 tests) - End-to-end tests covering:
  - Creating permissions and roles
  - Assigning permissions to roles
  - Assigning roles to users
  - Retrieving user permissions
  - Authentication and authorization flows
  - Error handling (404, 409, 401, 403)

**All 44 unit tests pass ✓**
**All 11 e2e tests pass ✓**

## Usage Example

```typescript
// In a controller
@Controller('majors')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MajorsController {
  
  @Post()
  @RequirePermissions('create_major')
  async createMajor(@Body() data: CreateMajorDto) {
    // Only users with 'create_major' permission can access this
    return this.majorsService.create(data);
  }
  
  @Delete(':id')
  @RequirePermissions('delete_major')
  async deleteMajor(@Param('id') id: string) {
    // Only users with 'delete_major' permission can access this
    return this.majorsService.delete(id);
  }
}
```

## Error Handling

The module provides appropriate HTTP status codes:
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Valid token but missing required permissions
- `404 Not Found` - User, role, or permission not found
- `409 Conflict` - Duplicate permission or role name

## Integration with AppModule

The RBAC module has been added to `AppModule` and is ready for use throughout the application.

## Next Steps

To use the RBAC system:

1. Create permissions for your system actions (e.g., `create_major`, `import_student`, `run_filter`)
2. Create roles and assign permissions to them (e.g., `admin` role with all permissions)
3. Assign roles to users
4. Protect your routes with `@UseGuards(JwtAuthGuard, PermissionsGuard)` and `@RequirePermissions(...)`

## Requirements Satisfied

This implementation satisfies the following requirements from the specification:

- **Requirement 2.1**: Maintains a catalog of permissions representing atomic actions ✓
- **Requirement 2.2**: Allows admins to create roles and assign permissions ✓
- **Requirement 2.3**: Allows admins to assign roles to users ✓
- **Requirement 2.4**: Verifies user permissions before allowing actions ✓
- **Requirement 2.5**: Rejects requests when permissions are missing ✓
- **Requirement 2.6**: Provides middleware for permission checking ✓
