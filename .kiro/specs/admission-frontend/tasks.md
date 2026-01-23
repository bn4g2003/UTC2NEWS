# Implementation Plan: Admission Frontend

## Overview

Kế hoạch triển khai hệ thống frontend quản lý tuyển sinh với Next.js 14+, bao gồm Admin Interface (Ant Design) và Public Interface (Shadcn/ui). Các tasks được tổ chức theo thứ tự: setup → core infrastructure → reusable components → modules → testing.

## Tasks

- [x] 1. Project setup and configuration
  - Configure Next.js 14+ with App Router and TypeScript
  - Install and configure Ant Design for admin interface
  - Install and configure Shadcn/ui for public interface
  - Configure Zod and React Hook Form
  - Configure Zustand for state management
  - Set up folder structure with (admin) and (public) route groups
  - Configure environment variables and API client
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 30.1, 30.2, 30.3_

- [x] 2. Authentication system implementation
  - [x] 2.1 Create auth store with Zustand
    - Implement AuthState interface with user, token, permissions
    - Implement login, logout, refreshToken, checkPermission actions
    - _Requirements: 2.1, 2.4_
  
  - [x] 2.2 Create useAuth hook
    - Implement hook returning user, isAuthenticated, login, logout, checkPermission
    - _Requirements: 2.1, 2.4, 2.6_
  
  - [x] 2.3 Create auth middleware for protected routes
    - Implement middleware to validate JWT tokens
    - Redirect to login on expired/invalid tokens
    - _Requirements: 2.2, 2.3_
  
  - [x] 2.4 Create login page
    - Build login form with username and password fields
    - Integrate with auth store
    - Display error messages for invalid credentials
    - _Requirements: 2.1, 2.6_
  
  - [ ]* 2.5 Write property tests for authentication
    - **Property 1: Valid credentials generate valid tokens**
    - **Property 2: Expired tokens trigger re-authentication**
    - **Property 3: Valid tokens grant access to protected routes**
    - **Property 4: Logout clears all authentication state**
    - **Property 5: Invalid credentials produce error messages**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6**

- [ ] 3. Authorization and RBAC implementation
  - [x] 3.1 Create usePermissions hook
    - Implement permission checking logic
    - Return hasPermission and isLoading states
    - _Requirements: 3.1, 3.2_
  
  - [x] 3.2 Create ProtectedComponent wrapper
    - Wrap components with permission requirements
    - Hide/show based on user permissions
    - _Requirements: 3.3_
  
  - [x] 3.3 Create API permission checker
    - Check permissions before making API requests
    - _Requirements: 3.4_

  
  - [ ]* 3.4 Write property tests for RBAC
    - **Property 6: Permission checking controls resource access**
    - **Property 7: UI elements respect permission requirements**
    - **Property 8: API requests respect permission requirements**
    - **Property 9: Permission updates take effect immediately**
    - **Property 10: CRUD permissions are independent**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

- [x] 4. Admin layout and navigation
  - [x] 4.1 Create AdminLayout component
    - Build layout with sidebar, header, and content area
    - _Requirements: 4.1, 4.2_
  
  - [x] 4.2 Create Sidebar component
    - Build navigation menu with icons and labels
    - Implement collapse/expand functionality
    - Persist collapse state in localStorage
    - Highlight active menu item based on route
    - _Requirements: 4.1, 4.4, 4.5, 4.6, 4.7_
  
  - [x] 4.3 Create Header component
    - Display user profile and logout button
    - _Requirements: 4.2_
  
  - [x] 4.4 Create Breadcrumb component
    - Generate breadcrumb from current route
    - _Requirements: 4.3_
  
  - [ ]* 4.5 Write property tests for navigation
    - **Property 11: Breadcrumb reflects current route**
    - **Property 12: Menu navigation updates route**
    - **Property 13: Active menu item matches current route**
    - **Property 14: Sidebar state persists across sessions**
    - **Validates: Requirements 4.3, 4.4, 4.5, 4.7**

- [-] 5. Reusable DataGrid component
  - [ ] 5.1 Create DataGrid component
    - Implement table rendering with configurable columns
    - Implement pagination controls
    - Implement sorting by column headers
    - Implement row selection with checkboxes
    - Implement action buttons per row
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6_
  
  - [x] 5.2 Create DataGridSkeleton component
    - Display loading skeleton while fetching data
    - _Requirements: 5.7_
  
  - [x] 5.3 Create SearchBar component
    - Implement search input with debounce
    - _Requirements: 5.4_
  
  - [x] 5.4 Create FilterPanel component
    - Implement filter controls
    - _Requirements: 5.4_
  
  - [x] 5.5 Create usePagination hook
    - Implement pagination state and controls
    - _Requirements: 5.2_
  
  - [ ]* 5.6 Write property tests for DataGrid
    - **Property 15: DataGrid renders all provided data**
    - **Property 16: Pagination divides data correctly**
    - **Property 17: Sorting orders data correctly**
    - **Property 18: Filtering shows only matching records**
    - **Property 19: Row selection tracks selected rows**
    - **Property 20: Action buttons trigger callbacks**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

- [x] 6. Reusable form components
  - [x] 6.1 Create FormModal component
    - Implement modal dialog with form integration
    - Integrate React Hook Form and Zod validation
    - Handle form submission and error display
    - _Requirements: 6.1, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_
  
  - [x] 6.2 Create FormDrawer component
    - Implement drawer panel with form integration
    - Integrate React Hook Form and Zod validation
    - Handle form submission and error display
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_
  
  - [x] 6.3 Create ConfirmDialog component
    - Implement confirmation dialog for delete actions
    - _Requirements: 7.4, 9.5, 10.5_
  
  - [x] 6.4 Create useModal hook
    - Implement modal state management
    - _Requirements: 6.1, 6.2_
  
  - [ ]* 6.5 Write property tests for form components
    - **Property 21: Valid form data triggers submission**
    - **Property 22: Invalid form data shows validation errors**
    - **Property 23: Zod schema validation is enforced**
    - **Property 24: Successful submission closes form**
    - **Property 25: Failed submission keeps form open**
    - **Validates: Requirements 6.3, 6.4, 6.6, 6.8, 6.9**

- [x] 7. Users module (Admin)
  - [x] 7.1 Create Users page component
    - Display users list in DataGrid
    - Implement search and filter functionality
    - _Requirements: 7.1, 7.6, 7.7_
  
  - [x] 7.2 Create User form schema with Zod
    - Define validation rules for user data
    - _Requirements: 7.8_
  
  - [x] 7.3 Implement user CRUD operations
    - Create user with FormModal
    - Edit user with FormModal
    - Delete user with confirmation
    - _Requirements: 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 7.4 Write property tests for Users module
    - **Property 26: Edit action pre-fills form with record data**
    - **Property 27: Delete confirmation removes record**
    - **Property 28: Search filters records by query**
    - **Property 29: Filter shows only matching records**
    - **Property 30: Validation prevents invalid submissions**
    - **Validates: Requirements 7.3, 7.5, 7.6, 7.7, 7.8**

- [x] 8. Roles and Permissions module (Admin)
  - [x] 8.1 Create Roles page component
    - Display roles list in DataGrid
    - _Requirements: 8.1_
  
  - [x] 8.2 Create Role form schema with Zod
    - Define validation rules for role data
    - _Requirements: 8.2_
  
  - [x] 8.3 Create Permissions selector component
    - Display permissions grouped by module
    - Implement checkbox selection
    - _Requirements: 8.4, 8.5_
  
  - [x] 8.4 Implement role CRUD operations
    - Create role with FormModal
    - Edit role with FormDrawer (with permissions)
    - Delete role with validation check
    - _Requirements: 8.2, 8.3, 8.6, 8.7, 8.8_
  
  - [ ]* 8.5 Write property tests for Roles module
    - **Property 31: Assigned roles cannot be deleted**
    - **Validates: Requirements 8.8**

- [x] 9. Students module (Admin)
  - [x] 9.1 Create Students page component
    - Display students list in DataGrid
    - Implement search and filter functionality
    - _Requirements: 9.1, 9.6, 9.7_
  
  - [x] 9.2 Create Student form schema with Zod
    - Define validation rules for student data including scores
    - _Requirements: 9.8_
  
  - [x] 9.3 Implement student CRUD operations
    - Create student with FormDrawer
    - Edit student with FormDrawer
    - View student details (read-only)
    - Delete student with confirmation
    - _Requirements: 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 9.4 Write property tests for Students module
    - **Property 26: Edit action pre-fills form with record data**
    - **Property 27: Delete confirmation removes record**
    - **Property 28: Search filters records by query**
    - **Property 29: Filter shows only matching records**
    - **Property 30: Validation prevents invalid submissions**
    - **Validates: Requirements 9.3, 9.5, 9.6, 9.7, 9.8**

- [x] 10. Programs module (Admin)
  - [x] 10.1 Create Programs page component
    - Display programs list in DataGrid with quota info
    - _Requirements: 10.1, 10.7_
  
  - [x] 10.2 Create Program form schema with Zod
    - Define validation rules for program data
    - _Requirements: 10.4_
  
  - [x] 10.3 Implement program CRUD operations
    - Create program with FormModal
    - Edit program with FormModal
    - Delete program with validation check
    - _Requirements: 10.2, 10.3, 10.5, 10.6_
  
  - [ ]* 10.4 Write property tests for Programs module
    - **Property 32: Programs with students cannot be deleted**
    - **Validates: Requirements 10.6**

- [x] 11. Sessions module (Admin)
  - [x] 11.1 Create Sessions page component
    - Display sessions list in DataGrid
    - _Requirements: 11.1_
  
  - [x] 11.2 Create Session form schema with Zod
    - Define validation rules including date validation
    - _Requirements: 11.4, 11.7_
  
  - [x] 11.3 Implement session CRUD operations
    - Create session with FormModal
    - Edit session with FormModal
    - Delete session with validation check
    - _Requirements: 11.2, 11.3, 11.5, 11.6_
  
  - [ ]* 11.4 Write property tests for Sessions module
    - **Property 33: Sessions with students cannot be deleted**
    - **Validates: Requirements 11.6**

- [x] 12. Excel Import module (Admin)
  - [x] 12.1 Create Import page component
    - Display upload area with drag-and-drop
    - _Requirements: 12.1_
  
  - [x] 12.2 Implement Excel file validation
    - Validate file format and structure
    - Display error messages for invalid files
    - _Requirements: 12.2, 12.3_
  
  - [x] 12.3 Implement Excel parsing and preview
    - Parse Excel data using library (e.g., xlsx)
    - Display preview table with validation errors highlighted
    - _Requirements: 12.4, 12.5_
  
  - [x] 12.4 Implement import confirmation and execution
    - Send valid records to API
    - Display progress indicator
    - Show import summary
    - Allow downloading error report
    - _Requirements: 12.6, 12.7, 12.8, 12.9_
  
  - [ ]* 12.5 Write property tests for Import module
    - **Property 35: Invalid file format shows error**
    - **Property 36: Valid Excel file is parsed and previewed**
    - **Property 37: Invalid records are highlighted in preview**
    - **Property 38: Only valid records are imported**
    - **Property 39: Import summary shows accurate counts**
    - **Validates: Requirements 12.3, 12.4, 12.5, 12.6, 12.8**

- [x] 13. Virtual Filter module (Admin)
  - [x] 13.1 Create Filter page component
    - Display filter configuration form
    - _Requirements: 13.1, 13.2_
  
  - [x] 13.2 Implement filter execution
    - Call API to start filter process
    - Display progress indicator
    - Poll API for progress updates
    - _Requirements: 13.3, 13.4, 13.5_
  
  - [x] 13.3 Implement filter results display
    - Show summary of results
    - Display error messages on failure
    - Allow canceling filter process
    - _Requirements: 13.6, 13.7, 13.8_

- [x] 14. Results Export module (Admin)
  - [x] 14.1 Create Results page component
    - Display list of processed results
    - Implement filtering by session, program, status
    - _Requirements: 14.1, 14.2_
  
  - [x] 14.2 Implement results preview
    - Display results before export
    - _Requirements: 14.7_
  
  - [x] 14.3 Implement Excel export
    - Call API to generate Excel file
    - Display progress indicator
    - Trigger file download
    - Handle export errors
    - _Requirements: 14.3, 14.4, 14.5, 14.6_

- [x] 15. Email Notification module (Admin)
  - [x] 15.1 Create Email page component
    - Display email sending interface
    - _Requirements: 15.1_
  
  - [x] 15.2 Implement recipient selection
    - Allow selecting recipient groups
    - Display recipient count
    - _Requirements: 15.2_
  
  - [x] 15.3 Implement email preview
    - Display email template preview
    - _Requirements: 15.3_
  
  - [x] 15.4 Implement email sending
    - Show confirmation dialog
    - Call API to queue emails
    - Display progress indicator
    - Show sending summary
    - _Requirements: 15.4, 15.5, 15.6, 15.7_
  
  - [x] 15.5 Implement email history
    - Display email sending history
    - _Requirements: 15.8_

- [x] 16. CMS Posts module (Admin)
  - [x] 16.1 Create Posts page component
    - Display posts list in DataGrid
    - Implement search and filter functionality
    - _Requirements: 16.1, 16.8, 16.9_
  
  - [x] 16.2 Create Post form schema with Zod
    - Define validation rules for post data
    - _Requirements: 16.5_
  
  - [x] 16.3 Implement rich text editor
    - Integrate rich text editor for post content
    - _Requirements: 16.4_
  
  - [x] 16.4 Implement image upload
    - Allow uploading featured image
    - _Requirements: 16.6_
  
  - [x] 16.5 Implement post CRUD operations
    - Create post with FormDrawer
    - Edit post with FormDrawer
    - Delete post with confirmation
    - _Requirements: 16.2, 16.3, 16.7_
  
  - [ ]* 16.6 Write property tests for Posts module
    - **Property 26: Edit action pre-fills form with record data**
    - **Property 27: Delete confirmation removes record**
    - **Property 28: Search filters records by query**
    - **Property 29: Filter shows only matching records**
    - **Validates: Requirements 16.3, 16.7, 16.8, 16.9**

- [x] 17. CMS Categories module (Admin)
  - [x] 17.1 Create Categories page component
    - Display categories list in DataGrid
    - _Requirements: 17.1_
  
  - [x] 17.2 Create Category form schema with Zod
    - Define validation rules for category data
    - _Requirements: 17.4_
  
  - [x] 17.3 Implement category CRUD operations
    - Create category with FormModal
    - Edit category with FormModal
    - Delete category with validation check
    - _Requirements: 17.2, 17.3, 17.5, 17.6_
  
  - [ ]* 17.4 Write property tests for Categories module
    - **Property 34: Categories with posts cannot be deleted**
    - **Validates: Requirements 17.6**

- [-] 18. CMS FAQs module (Admin)
  - [x] 18.1 Create FAQs page component
    - Display FAQs list in DataGrid
    - _Requirements: 18.1_
  
  - [x] 18.2 Create FAQ form schema with Zod
    - Define validation rules for FAQ data
    - _Requirements: 18.4_
  
  - [x] 18.3 Implement FAQ reordering
    - Support drag-and-drop or order number
    - _Requirements: 18.6_
  
  - [x] 18.4 Implement FAQ CRUD operations
    - Create FAQ with FormModal
    - Edit FAQ with FormModal
    - Delete FAQ with confirmation
    - _Requirements: 18.2, 18.3, 18.5_
  
  - [ ]* 18.5 Write property tests for FAQs module
    - **Property 26: Edit action pre-fills form with record data**
    - **Property 27: Delete confirmation removes record**
    - **Validates: Requirements 18.3, 18.5**

- [x] 19. CMS Media module (Admin)
  - [x] 19.1 Create Media page component
    - Display media files in grid layout
    - _Requirements: 19.1_
  
  - [x] 19.2 Implement file upload
    - Validate file type and size
    - Upload files to server
    - Display new files in grid
    - _Requirements: 19.2, 19.3, 19.4_
  
  - [x] 19.3 Implement file details view
    - Display file details and preview
    - Allow copying file URL
    - _Requirements: 19.5, 19.6_
  
  - [x] 19.4 Implement file deletion
    - Delete file with confirmation
    - _Requirements: 19.7_
  
  - [x] 19.5 Implement file search
    - Search files by name
    - _Requirements: 19.8_
  
  - [ ]* 19.6 Write property tests for Media module
    - **Property 28: Search filters records by query**
    - **Validates: Requirements 19.8**

- [ ] 20. Dashboard module (Admin)
  - [ ] 20.1 Create Dashboard page component
    - Display statistics cards
    - _Requirements: 20.1, 20.2, 20.3_
  
  - [ ] 20.2 Implement charts
    - Display applications over time chart
    - Display applications by program chart
    - _Requirements: 20.4, 20.5_
  
  - [ ] 20.3 Implement recent activities
    - Display recent activities or notifications
    - _Requirements: 20.6_
  
  - [ ] 20.4 Implement data fetching and loading states
    - Fetch statistics from API
    - Display loading skeleton
    - Refresh on navigation
    - _Requirements: 20.7, 20.8_

- [x] 21. Public layout and navigation
  - [x] 21.1 Create PublicLayout component
    - Build layout with header and footer
    - _Requirements: 21.1, 21.2_
  
  - [x] 21.2 Create Public Header component
    - Display logo and navigation menu
    - Implement responsive navigation
    - Highlight active menu item
    - _Requirements: 21.1, 21.6, 21.7_
  
  - [x] 21.3 Create Public Footer component
    - Display contact information and links
    - _Requirements: 21.2_
  
  - [x] 21.4 Configure Government Portal theme
    - Set formal colors (blue, white, gray)
    - Configure blocky layout style
    - Ensure responsive design
    - _Requirements: 21.3, 21.4, 21.5_

- [x] 22. Public Homepage
  - [x] 22.1 Create Homepage component
    - Display hero section
    - Display featured news
    - Display quick links
    - Display admission statistics
    - _Requirements: 22.1, 22.2, 22.3, 22.4_
  
  - [x] 22.2 Implement content fetching
    - Load latest posts from CMS API
    - Handle navigation to post detail
    - _Requirements: 22.5, 22.6, 22.7_

- [x] 23. Result Lookup page (Public)
  - [x] 23.1 Create Result Lookup page component
    - Display search form with ID card input
    - _Requirements: 23.1_
  
  - [x] 23.2 Create ID card validation schema
    - Validate ID card number format
    - _Requirements: 23.6_
  
  - [x] 23.3 Implement result search
    - Call API to fetch result
    - Display loading indicator
    - _Requirements: 23.2, 23.7_
  
  - [x] 23.4 Implement result display
    - Display student information and status
    - Display program, score, ranking
    - Display "not found" message
    - _Requirements: 23.3, 23.4, 23.5_
  
  - [ ]* 23.5 Write property tests for Result Lookup
    - **Property 40: Valid ID card number fetches result**
    - **Property 41: Found results display complete information**
    - **Property 42: Not found results show appropriate message**
    - **Property 43: Invalid ID format prevents submission**
    - **Validates: Requirements 23.2, 23.3, 23.4, 23.6**

- [x] 24. Programs List page (Public)
  - [x] 24.1 Create Programs page component
    - Display list of active programs
    - _Requirements: 24.1, 24.2_
  
  - [x] 24.2 Create ProgramCard component
    - Display program information
    - _Requirements: 24.2_
  
  - [x] 24.3 Implement program filtering and search
    - Filter by category or field
    - Search by name or code
    - _Requirements: 24.3, 24.4_
  
  - [x] 24.4 Implement program detail view
    - Display detailed program information
    - _Requirements: 24.5_
  
  - [x] 24.5 Implement data fetching
    - Load programs from API
    - _Requirements: 24.6_
  
  - [ ]* 24.6 Write property tests for Programs page
    - **Property 29: Filter shows only matching records**
    - **Validates: Requirements 24.4**

- [x] 25. News and Posts page (Public)
  - [x] 25.1 Create News page component
    - Display list of published posts
    - _Requirements: 25.1, 25.2_
  
  - [x] 25.2 Create NewsCard component
    - Display post preview with image
    - _Requirements: 25.2_
  
  - [x] 25.3 Implement pagination
    - Paginate posts list
    - _Requirements: 25.3_
  
  - [x] 25.4 Implement category filtering
    - Filter posts by category
    - _Requirements: 25.4_
  
  - [x] 25.5 Create Post Detail page component
    - Display full post content with rich text
    - _Requirements: 25.5, 25.6_
  
  - [x] 25.6 Implement data fetching
    - Load posts from CMS API
    - _Requirements: 25.7_

- [x] 26. Guides and FAQs page (Public)
  - [x] 26.1 Create Guides page component
    - Display list of guide posts
    - _Requirements: 26.1_
  
  - [x] 26.2 Create FAQ accordion component
    - Display FAQs in accordion format
    - Expand/collapse on click
    - _Requirements: 26.2, 26.3_
  
  - [x] 26.3 Implement template downloads
    - Allow downloading template files
    - _Requirements: 26.4_
  
  - [x] 26.4 Implement FAQ grouping
    - Group FAQs by category
    - _Requirements: 26.6_
  
  - [x] 26.5 Implement data fetching
    - Load FAQs from CMS API
    - _Requirements: 26.5_

- [ ] 27. Error handling and notifications
  - [ ] 27.1 Create ErrorBoundary component
    - Catch React errors
    - Display fallback UI
    - Log errors to console
    - _Requirements: 27.5, 27.6, 27.7_
  
  - [ ] 27.2 Create Toast notification system
    - Implement success, error, warning, info toasts
    - _Requirements: 27.1, 27.4_
  
  - [ ] 27.3 Implement API error handling
    - Handle authentication, authorization, validation errors
    - Display user-friendly error messages
    - _Requirements: 27.1, 27.3_
  
  - [ ] 27.4 Implement form validation error display
    - Display inline validation errors
    - _Requirements: 27.2_
  
  - [ ]* 27.5 Write property tests for error handling
    - **Property 44: Failed API requests show error notifications**
    - **Property 45: Form validation errors appear inline**
    - **Property 46: Network errors show user-friendly messages**
    - **Property 47: Successful actions show success notifications**
    - **Property 48: React errors are caught by error boundaries**
    - **Property 49: Unexpected errors show fallback UI**
    - **Property 50: Errors are logged to console**
    - **Validates: Requirements 27.1, 27.2, 27.3, 27.4, 27.5, 27.6, 27.7**

- [ ] 28. Loading states and skeletons
  - [ ] 28.1 Create skeleton loader components
    - Create skeleton for DataGrid
    - Create skeleton for cards
    - Create skeleton for forms
    - _Requirements: 28.1_
  
  - [ ] 28.2 Implement button loading states
    - Display spinner on submit buttons
    - _Requirements: 28.2_
  
  - [ ] 28.3 Implement page loading indicators
    - Display loading indicator for page transitions
    - _Requirements: 28.3_
  
  - [ ] 28.4 Implement progress indicators
    - Display progress bar for long-running processes
    - _Requirements: 28.4_
  
  - [ ] 28.5 Implement loading state management
    - Disable interactive elements during loading
    - _Requirements: 28.5_

- [ ] 29. Responsive design implementation
  - [ ] 29.1 Implement mobile layout for Admin Interface
    - Collapse sidebar into hamburger menu
    - Adapt DataGrid for mobile
    - Make FormModal full-screen on mobile
    - _Requirements: 29.4, 29.5, 29.6_
  
  - [ ] 29.2 Implement mobile layout for Public Interface
    - Use mobile-first responsive design
    - _Requirements: 29.7_
  
  - [ ] 29.3 Test responsive breakpoints
    - Test on mobile (320px+)
    - Test on tablet (768px+)
    - Test on desktop (1024px+)
    - _Requirements: 29.1, 29.2, 29.3_

- [ ] 30. Configuration and environment setup
  - [ ] 30.1 Create environment configuration
    - Set up .env files for different environments
    - Configure API base URL
    - Configure authentication settings
    - _Requirements: 30.1, 30.2_
  
  - [ ] 30.2 Create configuration module
    - Provide centralized access to settings
    - Validate required environment variables
    - Provide default values
    - _Requirements: 30.3, 30.4, 30.5, 30.6_

## Summary

Tổng cộng 30 tasks chính với 150+ sub-tasks, bao gồm:
- **Setup & Infrastructure**: Tasks 1-6 (Project setup, Auth, RBAC, Layout, Reusable components)
- **Admin Modules**: Tasks 7-20 (12 CRUD modules + Dashboard)
- **Public Interface**: Tasks 21-26 (Layout, Homepage, Result Lookup, Programs, News, FAQs)
- **Cross-cutting Concerns**: Tasks 27-30 (Error handling, Loading states, Responsive design, Configuration)

Mỗi module đều có property-based tests tương ứng để đảm bảo correctness.

---

## ⚠️ CRITICAL GUIDELINES

### Form Validation với Ant Design + React Hook Form

**LUÔN đọc file này trước khi implement form mới**: `.kiro/specs/admission-frontend/form-validation-guidelines.md`

**Quy tắc bắt buộc**:
1. ✅ **LUÔN dùng `Controller`** với Ant Design components (Input, Select, InputNumber, DatePicker, etc.)
2. ❌ **KHÔNG BAO GIỜ dùng `form.register()`** với Ant Design components
3. ✅ **LUÔN import Controller**: `import { Controller } from 'react-hook-form';`
4. ✅ **Validation mode**: Dùng `mode: 'onChange'` trong useForm config
5. ✅ **Hỗ trợ tiếng Việt**: Thêm regex validation cho các field tên

**Tại sao?**
- `form.register()` chỉ hoạt động với HTML native inputs
- Ant Design components có cách xử lý events khác → cần dùng Controller
- Nếu không dùng Controller → form không nhận giá trị → validation luôn fail

**Template đúng**:
```tsx
<Controller
  name="fieldName"
  control={form.control}
  render={({ field }) => (
    <Input {...field} placeholder="Enter value" />
  )}
/>
```

**Tham khảo**: Xem Roles page (`app/(admin)/roles/page.tsx`) làm mẫu - đã implement đúng từ đầu.

**Lịch sử**: 2026-01-22 - Đã sửa 7 trang admin (23 fields) do lỗi này. Xem `CONTROLLER_FIX_COMPLETED.md` để biết chi tiết.
