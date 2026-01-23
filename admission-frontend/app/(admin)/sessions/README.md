# Sessions Module

## Overview

The Sessions module provides CRUD operations for managing admission sessions. Sessions represent time periods during which admissions are conducted.

## Features

- **List Sessions**: Display all sessions in a DataGrid with pagination
- **Create Session**: Add new admission sessions with validation
- **Edit Session**: Update existing session information
- **Delete Session**: Remove sessions (with validation check for associated students)
- **Search**: Filter sessions by name or year
- **Status Filter**: Filter sessions by status (upcoming, active, closed)

## Requirements Implemented

- **Requirement 11.1**: Display sessions list in DataGrid
- **Requirement 11.2**: Create session with FormModal
- **Requirement 11.3**: Edit session with FormModal
- **Requirement 11.4**: Define validation rules including date validation
- **Requirement 11.5**: Delete session with confirmation
- **Requirement 11.6**: Prevent deletion of sessions with associated students
- **Requirement 11.7**: Validate that end date is after start date

## Data Model

```typescript
interface Session {
  id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
}
```

## Validation Rules

### Session Name
- Minimum 3 characters
- Maximum 200 characters
- Required

### Year
- Must be an integer
- Minimum 2000
- Maximum 2100
- Required

### Start Date
- Must be a valid date
- Required

### End Date
- Must be a valid date
- Must be after start date
- Required

### Status
- Must be one of: 'upcoming', 'active', 'closed'
- Defaults to 'upcoming'

## API Integration

The module uses the `ProgramsService` from the generated API client:

- `programControllerFindAllSessions()`: Fetch all sessions
- `programControllerCreateSession(data)`: Create new session
- `programControllerUpdateSession(id, data)`: Update session
- `programControllerDeleteSession(id)`: Delete session

## Error Handling

The module handles the following error cases:

- **403 Forbidden**: User lacks permission to perform the action
- **404 Not Found**: Session not found
- **409 Conflict**: Cannot delete session with associated students

## Components Used

- **DataGrid**: Displays sessions in a table with pagination and sorting
- **FormModal**: Modal dialog for create and edit forms
- **ConfirmDialog**: Confirmation dialog for delete action
- **SearchBar**: Search input with debounce
- **FilterPanel**: Status filter dropdown

## Hooks Used

- **usePagination**: Manages pagination state
- **useModal**: Manages modal open/close state

## Testing

Unit tests are provided in `schema.test.ts` to validate:
- Valid session data
- Name length constraints
- Year range constraints
- Date format validation
- Date relationship validation (end date after start date)
- Status enum validation
- Partial updates for edit operations

## Usage

Navigate to `/admin/sessions` to access the Sessions management page.

### Creating a Session

1. Click "Add Session" button
2. Fill in the form:
   - Session Name (e.g., "Admission 2024")
   - Year (e.g., 2024)
   - Start Date
   - End Date (must be after start date)
   - Status (upcoming, active, or closed)
3. Click "Submit"

### Editing a Session

1. Click the "Edit" button on a session row
2. Modify the fields as needed
3. Click "Submit"

### Deleting a Session

1. Click the "Delete" button on a session row
2. Confirm the deletion in the dialog
3. Note: Sessions with associated students cannot be deleted

### Searching and Filtering

- Use the search bar to filter by session name or year
- Use the status dropdown to filter by session status
- Filters are applied in real-time
