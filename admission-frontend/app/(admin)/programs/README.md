# Programs Module (Admin)

## Overview

The Programs module provides a complete CRUD interface for managing admission programs (majors). It allows administrators to create, view, edit, and delete academic programs with quota tracking.

## Features

### 1. Programs List (Requirement 10.1, 10.7)
- Display all programs in a DataGrid with pagination
- Show program code, name, description, quota information, and status
- Display quota utilization with enrollment count and percentage filled
- Sort by any column
- Real-time data fetching from API

### 2. Search and Filter
- Search programs by code, name, or description
- Filter programs by status (Active/Inactive)
- Instant filtering with pagination reset

### 3. Create Program (Requirement 10.2)
- Modal form for creating new programs
- Required fields: code, name
- Optional fields: description, status
- Validation:
  - Code: 2-20 characters, uppercase letters, numbers, underscores, hyphens
  - Name: 3-200 characters
  - Description: max 1000 characters
- Handles duplicate code error (409)
- Handles permission error (403)

### 4. Edit Program (Requirement 10.3)
- Modal form for editing existing programs
- Pre-fills form with current program data
- Program code is disabled (cannot be changed)
- All other fields can be updated
- Validation same as create
- Handles not found error (404)
- Handles permission error (403)

### 5. Delete Program (Requirement 10.5, 10.6)
- Confirmation dialog before deletion
- Prevents deletion of programs with associated students (409 error)
- Shows user-friendly error message when deletion is blocked
- Handles not found error (404)
- Handles permission error (403)

## Data Structure

```typescript
interface Program {
  id: string;
  code: string;              // Unique program code (e.g., "CS", "EE")
  name: string;              // Program name
  description?: string;      // Optional description
  subjectCombinations: Record<string, any>;  // Subject combinations for admission
  isActive: boolean;         // Active/Inactive status
  quota?: number;            // Admission quota
  currentEnrollment?: number; // Current enrollment count
  createdAt: string;
  updatedAt: string;
}
```

## Validation Schema (Requirement 10.4)

### Create Program Schema
- **code**: Required, 2-20 chars, uppercase letters/numbers/underscores/hyphens
- **name**: Required, 3-200 chars
- **description**: Optional, max 1000 chars
- **subjectCombinations**: Record object, defaults to {}
- **isActive**: Boolean, defaults to true

### Update Program Schema
- Same as create schema
- Code field is disabled in UI (cannot be changed)

## API Integration

Uses `ProgramsService` from generated API client:

- **Create**: `programControllerCreateMajor(data)`
- **Read**: `programControllerFindAllMajors(active?)`
- **Update**: `programControllerUpdateMajor(id, data)`
- **Delete**: `programControllerDeleteMajor(id)`

## Error Handling

### Create/Update Errors
- **409 Conflict**: Program code already exists
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Program not found (update only)

### Delete Errors
- **409 Conflict**: Cannot delete program with associated students (Requirement 10.6)
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Program not found

All errors display user-friendly messages via Ant Design message component.

## Components Used

- **DataGrid**: Displays programs list with pagination, sorting, and actions
- **FormModal**: Modal dialog for create and edit forms
- **ConfirmDialog**: Confirmation dialog for delete action
- **usePagination**: Custom hook for pagination state
- **useModal**: Custom hook for modal state management

## Permissions

The module respects backend permissions:
- **create_major**: Required for creating programs
- **update_major**: Required for updating programs (same permission as create)
- **delete_major**: Required for deleting programs (same permission as create)

## Testing

To test the module:

1. **Create Program**:
   - Click "Add Program" button
   - Fill in code (e.g., "CS"), name, and description
   - Submit and verify success message
   - Verify program appears in list

2. **Edit Program**:
   - Click "Edit" action on any program
   - Modify name or description
   - Submit and verify success message
   - Verify changes appear in list

3. **Delete Program**:
   - Click "Delete" action on a program without students
   - Confirm deletion
   - Verify success message and program removed from list
   - Try deleting a program with students - should show error

4. **Search and Filter**:
   - Enter search query and verify filtering
   - Change status filter and verify filtering
   - Verify pagination resets on search/filter

## Future Enhancements

- Subject combinations editor in the form
- Bulk import/export of programs
- Program statistics and analytics
- Historical enrollment data
- Integration with quota management
