# Virtual Filter Module

## Overview

The Virtual Filter module provides an interface for running the virtual filter algorithm to process admission applications. The filter processes applications based on student preferences, academic scores, program quotas, and subject combination requirements.

## Features

### 1. Filter Configuration (Requirement 13.1, 13.2)
- Select admission session from active sessions
- Display session information (name, year, status)
- Validation to ensure session is selected before running filter

### 2. Filter Execution (Requirement 13.3, 13.4, 13.5)
- Run filter button to start the process
- Real-time progress indicator with percentage
- Progress messages showing current processing stage:
  - Initializing filter algorithm
  - Loading student applications
  - Processing preferences
  - Calculating scores and rankings
  - Applying program quotas
  - Generating admission decisions
  - Finalizing results
- Simulated progress updates (since API is synchronous)

### 3. Filter Results Display (Requirement 13.6)
- Summary statistics:
  - Total Processed: Total number of applications processed
  - Accepted: Number of students accepted
  - Rejected: Number of students rejected
  - Pending: Number of applications still pending
- Visual cards with color-coded statistics
- Next steps guidance

### 4. Error Handling (Requirement 13.7)
- Permission errors (403): "You do not have permission to run the filter"
- Not found errors (404): "Session not found"
- Validation errors (400): Display specific error message
- Server errors (500+): "Server error occurred while processing filter"
- Network errors: Generic error message with console logging

### 5. Cancel Functionality (Requirement 13.8)
- Cancel button available during filter execution
- Graceful cancellation with status update
- Note: Since the API call is synchronous, cancellation only updates UI state

## API Integration

### Endpoints Used
- `GET /sessions` - Fetch available sessions (via ProgramsService)
- `POST /sessions/{id}/run-filter` - Execute filter algorithm (via FilterService)

### API Response Format
```typescript
{
  totalProcessed: number;
  accepted: number;
  rejected: number;
  pending: number;
}
```

## Component Structure

```
FilterPage
├── Filter Configuration Card
│   ├── Session Selection Dropdown
│   ├── Session Information Alert
│   └── Action Buttons (Run, Cancel, Reset)
├── Filter Progress Card
│   ├── Loading Spinner
│   ├── Progress Bar
│   └── Status Messages
├── Filter Results Card
│   ├── Statistics Grid
│   └── Next Steps Alert
└── Information Card
    └── About Virtual Filter
```

## State Management

### FilterProgress State
```typescript
interface FilterProgress {
  status: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  message: string;
  result?: {
    totalProcessed: number;
    accepted: number;
    rejected: number;
    pending: number;
  };
  error?: string;
  cancelRequested?: boolean;
}
```

## User Flow

1. **Initial State**
   - Page loads and fetches active sessions
   - First active session is auto-selected
   - Run Filter button is enabled

2. **Running Filter**
   - User clicks "Run Filter"
   - Progress card appears with spinner and progress bar
   - Progress updates every 500ms with new messages
   - Cancel button becomes available

3. **Completion**
   - Progress reaches 100%
   - Success message displayed
   - Results card shows statistics
   - Reset button becomes available

4. **Error Handling**
   - Error alert displayed with specific message
   - Progress bar shows exception status
   - Reset button becomes available

5. **Cancellation**
   - User clicks "Cancel"
   - Cancellation message displayed
   - Status changes to cancelled
   - Reset button becomes available

## Permissions Required

- `run_filter` permission to execute the filter algorithm

## Notes

- The filter operation is atomic and idempotent
- Running the filter multiple times on the same session produces the same results
- Only active sessions are available for filtering
- Progress simulation is used since the API is synchronous
- True cancellation would require an abort endpoint or AbortController implementation

## Future Enhancements

1. Real-time progress polling if backend supports async processing
2. WebSocket integration for live progress updates
3. Detailed error logs and debugging information
4. Export filter results directly from this page
5. Schedule filter execution for specific times
6. Batch filter execution for multiple sessions
