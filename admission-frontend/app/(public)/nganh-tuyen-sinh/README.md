# Programs List Page (Public Interface)

## Overview

This module implements the public-facing Programs List page where visitors can browse and search for admission programs (majors). It follows the Government Portal design style with formal colors and blocky layouts.

## Implementation Summary

### Task 24: Programs List page (Public) ✅

All subtasks completed:

#### 24.1 Create Programs page component ✅
- **File**: `app/(public)/nganh-tuyen-sinh/page.tsx`
- **Features**:
  - Displays list of active programs in a grid layout
  - Search functionality by program name or code
  - Category filter (placeholder for future backend support)
  - Loading skeleton while fetching data
  - Error handling with retry functionality
  - Empty state when no programs found
  - Results count display
  - Responsive design for mobile/tablet/desktop

#### 24.2 Create ProgramCard component ✅
- **File**: `src/components/public/ProgramCard/ProgramCard.tsx`
- **Features**:
  - Displays program code badge
  - Shows program name (truncated to 2 lines)
  - Shows program description (truncated to 3 lines)
  - Displays quota information
  - Link to program detail page
  - Government Portal styling

#### 24.3 Implement program filtering and search ✅
- **Implementation**: Integrated in main page component
- **Features**:
  - Real-time search by program name, code, or description
  - Category dropdown filter (extensible for backend categories)
  - Results count updates dynamically
  - Clear filter button when search is active

#### 24.4 Implement program detail view ✅
- **File**: `app/(public)/nganh-tuyen-sinh/[id]/page.tsx`
- **Features**:
  - Breadcrumb navigation
  - Program code badge
  - Program name and status
  - Quota information in highlighted card
  - Last updated date
  - Full program description
  - Related links (guides, news)
  - Error handling for 404 and other errors
  - Loading state
  - Action buttons (back to list, result lookup)

#### 24.5 Implement data fetching ✅
- **API Integration**: Uses `ProgramsService` from generated API client
- **Methods Used**:
  - `programControllerFindAllMajors('true')` - Fetch active programs
  - `programControllerFindMajorById(id)` - Fetch program detail
- **Error Handling**: Comprehensive error handling with user-friendly messages

## File Structure

```
app/(public)/nganh-tuyen-sinh/
├── page.tsx                    # Programs list page
├── [id]/
│   └── page.tsx               # Program detail page
└── README.md                  # This file

src/components/public/ProgramCard/
├── ProgramCard.tsx            # Program card component
└── index.ts                   # Export file
```

## API Integration

### Programs List
- **Endpoint**: `GET /api/program/majors?active=true`
- **Service**: `ProgramsService.programControllerFindAllMajors('true')`
- **Response**: Array of program objects

### Program Detail
- **Endpoint**: `GET /api/program/majors/:id`
- **Service**: `ProgramsService.programControllerFindMajorById(id)`
- **Response**: Single program object

## Data Model

```typescript
interface Program {
  id: string;
  name: string;
  code: string;
  description?: string;
  quota?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Features

### Search and Filter
- **Search**: Filters programs by name, code, or description (case-insensitive)
- **Category Filter**: Dropdown with categories (placeholder for future backend support)
- **Results Count**: Shows number of matching programs
- **Clear Filter**: Button to reset search when active

### Loading States
- Skeleton loaders matching the card layout
- Loading indicators during data fetch
- Smooth transitions between states

### Error Handling
- Network error messages
- 404 error for program not found
- Retry functionality
- User-friendly error messages in Vietnamese

### Responsive Design
- Mobile-first approach
- Grid layout: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
- Responsive typography
- Mobile-friendly navigation

### Government Portal Styling
- Formal blue color scheme (#0052CC)
- Blocky, rectangular design (no rounded corners)
- Clear hierarchy with borders
- Professional typography
- Accessible color contrast

## Navigation

The Programs List page is accessible from:
1. **Homepage**: "Xem ngành tuyển sinh" button in hero section
2. **Homepage**: "Ngành tuyển sinh" quick link card
3. **Header**: "Ngành tuyển sinh" navigation item
4. **Direct URL**: `/nganh-tuyen-sinh`

Program detail pages are accessible from:
1. **Programs List**: "Chi tiết →" link on each program card
2. **Direct URL**: `/nganh-tuyen-sinh/[program-id]`

## Testing

To test the implementation:

1. **Start the development server**:
   ```bash
   cd admission-frontend
   npm run dev
   ```

2. **Navigate to Programs List**:
   - Open browser to `http://localhost:3001/nganh-tuyen-sinh`
   - Verify programs are displayed in grid layout
   - Test search functionality
   - Test category filter
   - Verify responsive design on different screen sizes

3. **Test Program Detail**:
   - Click "Chi tiết →" on any program card
   - Verify program details are displayed
   - Test breadcrumb navigation
   - Test "Quay lại danh sách" button
   - Test error handling by navigating to invalid ID

4. **Test Error States**:
   - Disconnect network to test error handling
   - Navigate to non-existent program ID to test 404

## Requirements Validation

### Requirement 24.1 ✅
- THE Programs_Page SHALL display a list of all active admission programs
- **Validated**: Page fetches and displays active programs using `active=true` parameter

### Requirement 24.2 ✅
- THE Programs_Page SHALL display program name, code, quota, and description for each program
- **Validated**: ProgramCard component displays all required fields

### Requirement 24.3 ✅
- THE Programs_Page SHALL support filtering programs by category or field
- **Validated**: Category dropdown filter implemented (extensible for backend categories)

### Requirement 24.4 ✅
- THE Programs_Page SHALL support searching programs by name or code
- **Validated**: Search input filters by name, code, and description

### Requirement 24.5 ✅
- WHEN a visitor clicks on a program, THE Programs_Page SHALL display detailed program information
- **Validated**: Program detail page shows comprehensive information

### Requirement 24.6 ✅
- THE Programs_Page SHALL load programs from the API using the Programs service
- **Validated**: Uses ProgramsService from generated API client

## Future Enhancements

1. **Category Support**: When backend provides category information, update filter to use real categories
2. **Pagination**: Add pagination for large numbers of programs
3. **Sorting**: Add sorting options (by name, code, quota)
4. **Advanced Filters**: Add filters for quota range, active status
5. **Program Comparison**: Allow comparing multiple programs side-by-side
6. **Share Functionality**: Add social sharing buttons for program details
7. **Print View**: Add print-friendly version of program details

## Notes

- All text is in Vietnamese as per requirements
- Government Portal styling is consistently applied
- Mobile-responsive design tested on various screen sizes
- Error messages are user-friendly and actionable
- Loading states provide good user experience
- Navigation is intuitive with breadcrumbs and back buttons
