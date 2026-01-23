# Requirements Document

## Introduction

This document defines the requirements for standardizing permissions across the admission management system. Currently, the system has inconsistent permission naming conventions across three layers: database seed file, backend controllers, and frontend application. This inconsistency creates maintenance challenges, increases the risk of authorization bugs, and makes the system harder to understand and extend.

The standardization will establish a single, consistent permission naming convention and ensure all three layers use identical permission identifiers.

## Glossary

- **Permission**: A named authorization grant that allows a user to perform a specific action on a specific resource
- **Resource**: A domain entity in the system (e.g., users, students, programs, sessions, quotas)
- **Action**: An operation that can be performed on a resource (e.g., create, read, update, delete)
- **Backend_Seed**: The Prisma seed file that initializes default permissions in the database
- **Backend_Controller**: NestJS controller classes that enforce permissions via the RequirePermissions decorator
- **Frontend**: Next.js application that checks permissions before rendering UI elements or making API calls
- **RBAC_System**: Role-Based Access Control system that manages permissions, roles, and user assignments
- **Permission_Format**: The standardized naming convention for permissions (resource:action)

## Requirements

### Requirement 1: Define Standardized Permission Naming Convention

**User Story:** As a system architect, I want a single, consistent permission naming convention, so that all layers of the application use identical permission identifiers.

#### Acceptance Criteria

1. THE System SHALL use the format "resource:action" for all permission names
2. THE System SHALL use lowercase letters for both resource and action components
3. THE System SHALL use underscores for multi-word resources (e.g., "admission_sessions:create")
4. THE System SHALL use standard CRUD action names: create, read, update, delete
5. THE System SHALL use domain-specific action names where CRUD is insufficient (e.g., export, import, send, run, publish, assign)

### Requirement 2: Define Complete Permission List

**User Story:** As a system architect, I want a comprehensive list of all required permissions, so that I can ensure complete coverage of system functionality.

#### Acceptance Criteria

1. THE System SHALL define permissions for all user management operations
2. THE System SHALL define permissions for all student management operations
3. THE System SHALL define permissions for all program management operations (majors, sessions, quotas)
4. THE System SHALL define permissions for all import operations
5. THE System SHALL define permissions for all filter operations
6. THE System SHALL define permissions for all result operations
7. THE System SHALL define permissions for all email operations
8. THE System SHALL define permissions for all CMS operations (posts, FAQs, categories, media)
9. THE System SHALL define permissions for all configuration operations
10. THE System SHALL define permissions for all RBAC operations (roles, permissions, assignments)

### Requirement 3: Update Database Seed File

**User Story:** As a database administrator, I want the seed file to use standardized permission names, so that the database contains consistent permission identifiers.

#### Acceptance Criteria

1. WHEN the seed file creates permissions, THE Backend_Seed SHALL use the standardized permission format
2. WHEN the seed file creates permissions, THE Backend_Seed SHALL include all permissions from the complete permission list
3. WHEN the seed file creates permissions, THE Backend_Seed SHALL include descriptive text for each permission
4. THE Backend_Seed SHALL remove any deprecated permission names not in the standardized list

### Requirement 4: Update Backend Controllers

**User Story:** As a backend developer, I want all controllers to use standardized permission names, so that authorization checks are consistent across the API.

#### Acceptance Criteria

1. WHEN a controller method requires authorization, THE Backend_Controller SHALL use the RequirePermissions decorator with standardized permission names
2. THE Backend_Controller SHALL replace all legacy permission names with standardized equivalents
3. WHEN multiple permissions are required, THE Backend_Controller SHALL use multiple standardized permission names
4. THE Backend_Controller SHALL ensure every protected endpoint references at least one standardized permission

### Requirement 5: Update Frontend Permission Checks

**User Story:** As a frontend developer, I want the frontend to use standardized permission names, so that UI authorization checks match backend enforcement.

#### Acceptance Criteria

1. WHEN the frontend checks permissions, THE Frontend SHALL use the standardized permission format
2. THE Frontend SHALL update the PERMISSIONS constant object to use standardized permission names
3. THE Frontend SHALL update all permission check calls to use standardized permission names
4. THE Frontend SHALL update all permission group definitions to use standardized permission names

### Requirement 6: Ensure Cross-Layer Consistency

**User Story:** As a system architect, I want all three layers to use identical permission names, so that authorization is consistent throughout the system.

#### Acceptance Criteria

1. FOR ALL permissions in the database seed, THE System SHALL have matching permission checks in backend controllers
2. FOR ALL permissions used in backend controllers, THE System SHALL have matching permission definitions in the database seed
3. FOR ALL permissions used in the frontend, THE System SHALL have matching permission definitions in the database seed
4. WHEN a permission is added to any layer, THE System SHALL require it to be added to all three layers

### Requirement 7: Create Permission Mapping Documentation

**User Story:** As a developer, I want documentation that maps old permission names to new standardized names, so that I can understand the migration.

#### Acceptance Criteria

1. THE System SHALL document the mapping from legacy backend seed permissions to standardized permissions
2. THE System SHALL document the mapping from legacy backend controller permissions to standardized permissions
3. THE System SHALL document the mapping from legacy frontend permissions to standardized permissions
4. THE System SHALL identify any permissions that are being added, removed, or consolidated

### Requirement 8: Maintain Database Safety During Migration

**User Story:** As a system administrator, I want the migration to preserve existing data, so that role assignments are not lost.

#### Acceptance Criteria

1. WHEN updating the database seed, THE Backend_Seed SHALL use upsert operations to avoid data loss
2. WHEN updating permissions, THE System SHALL preserve existing role-permission assignments where possible
