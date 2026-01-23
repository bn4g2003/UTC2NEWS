# Requirements Document - Admission Frontend

## Introduction

Hệ thống frontend quản lý tuyển sinh (Admission Management System Frontend) là ứng dụng web được xây dựng bằng Next.js 14+, cung cấp hai giao diện chính:
1. **Admin Interface**: Giao diện quản trị dành cho nhân viên tuyển sinh, sử dụng Ant Design
2. **Public Interface**: Giao diện công khai theo phong cách Government Portal, sử dụng Shadcn/ui

Hệ thống tích hợp với backend NestJS đã có sẵn thông qua TypeScript API client được generate từ OpenAPI, hỗ trợ đầy đủ quy trình tuyển sinh từ nhập liệu đến xuất kết quả.

## Glossary

- **Admin_Interface**: Giao diện quản trị dành cho nhân viên tuyển sinh với đầy đủ quyền CRUD
- **Public_Interface**: Giao diện công khai cho người dùng tra cứu thông tin tuyển sinh
- **API_Client**: TypeScript client được generate từ OpenAPI specification của backend
- **RBAC**: Role-Based Access Control - hệ thống phân quyền dựa trên vai trò
- **Virtual_Filter**: Thuật toán lọc ảo để xử lý kết quả tuyển sinh
- **DataGrid**: Component bảng dữ liệu có phân trang, sắp xếp, lọc
- **FormModal**: Component modal chứa form nhập liệu
- **FormDrawer**: Component drawer (ngăn kéo) chứa form nhập liệu
- **JWT_Token**: JSON Web Token dùng cho xác thực, có thời hạn 24 giờ
- **Government_Portal_Style**: Phong cách thiết kế trang trọng, tin cậy như cổng thông tin điện tử chính phủ

## Requirements

### Requirement 1: Project Setup and Configuration

**User Story:** As a developer, I want to set up the Next.js 14+ project with proper configuration, so that the development environment is ready for building the admission frontend.

#### Acceptance Criteria

1. THE System SHALL use Next.js 14 or higher with App Router architecture
2. THE System SHALL use TypeScript for all source code files
3. THE System SHALL integrate Ant Design library for Admin Interface components
4. THE System SHALL integrate Shadcn/ui library for Public Interface components
5. THE System SHALL configure the existing API client from admission-frontend/src/api/ directory
6. THE System SHALL organize code following the specified folder structure with (admin) and (public) route groups
7. THE System SHALL configure Zod for schema validation
8. THE System SHALL configure React Hook Form for form management
9. THE System SHALL support Vietnamese language as primary language

### Requirement 2: Authentication System

**User Story:** As a user, I want to authenticate securely using JWT tokens, so that my session is protected and I can access authorized features.

#### Acceptance Criteria

1. WHEN a user submits valid credentials, THE Authentication_System SHALL generate and store JWT access token with 24-hour expiration
2. WHEN a user's token expires, THE Authentication_System SHALL redirect the user to the login page
3. WHEN an authenticated user navigates to protected routes, THE Authentication_System SHALL validate the JWT token before allowing access
4. WHEN a user logs out, THE Authentication_System SHALL clear all stored authentication tokens
5. THE Authentication_System SHALL store tokens securely in httpOnly cookies or secure storage
6. WHEN authentication fails, THE Authentication_System SHALL display clear error messages to the user

### Requirement 3: Authorization and RBAC

**User Story:** As an administrator, I want role-based access control, so that users can only perform actions they are authorized for.

#### Acceptance Criteria

1. WHEN a user attempts to access a protected resource, THE RBAC_System SHALL verify the user has the required permission
2. WHEN a user lacks required permissions, THE RBAC_System SHALL deny access and display an appropriate message
3. THE RBAC_System SHALL check permissions at the component level for UI elements
4. THE RBAC_System SHALL check permissions at the API level before making requests
5. WHEN user permissions change, THE RBAC_System SHALL update the user's access rights immediately
6. THE RBAC_System SHALL support granular permissions for each CRUD operation (create, read, update, delete)

### Requirement 4: Admin Layout and Navigation

**User Story:** As an admin user, I want a consistent layout with navigation, so that I can easily access different modules.

#### Acceptance Criteria

1. THE Admin_Interface SHALL display a sidebar with navigation menu for all modules
2. THE Admin_Interface SHALL display a header with user profile and logout button
3. THE Admin_Interface SHALL display breadcrumb navigation showing current location
4. WHEN a user clicks a menu item, THE Admin_Interface SHALL navigate to the corresponding module
5. THE Admin_Interface SHALL highlight the active menu item based on current route
6. THE Admin_Interface SHALL be responsive and collapse sidebar on mobile devices
7. THE Admin_Interface SHALL persist sidebar collapse state in local storage

### Requirement 5: Reusable DataGrid Component

**User Story:** As a developer, I want a reusable DataGrid component, so that I can display tabular data consistently across all modules.

#### Acceptance Criteria

1. THE DataGrid SHALL display data in a table format with configurable columns
2. THE DataGrid SHALL support pagination with configurable page size
3. THE DataGrid SHALL support sorting by clicking column headers
4. THE DataGrid SHALL support filtering with a search bar and filter panel
5. THE DataGrid SHALL support row selection with checkboxes
6. THE DataGrid SHALL support custom action buttons per row (edit, delete, view)
7. THE DataGrid SHALL display loading skeleton while fetching data
8. WHEN data fetching fails, THE DataGrid SHALL display an error message
9. THE DataGrid SHALL support responsive layout for mobile devices

### Requirement 6: Reusable Form Components

**User Story:** As a developer, I want reusable FormModal and FormDrawer components, so that I can create consistent forms across all modules.

#### Acceptance Criteria

1. THE FormModal SHALL display a modal dialog containing a form
2. THE FormDrawer SHALL display a drawer panel containing a form
3. WHEN a form is submitted with valid data, THE Form_Component SHALL call the provided onSubmit callback
4. WHEN a form is submitted with invalid data, THE Form_Component SHALL display validation errors inline
5. THE Form_Component SHALL integrate with React Hook Form for form state management
6. THE Form_Component SHALL integrate with Zod for schema validation
7. THE Form_Component SHALL display loading state during submission
8. WHEN form submission succeeds, THE Form_Component SHALL close and show success notification
9. WHEN form submission fails, THE Form_Component SHALL display error notification and keep form open

### Requirement 7: Users Module (Admin)

**User Story:** As an administrator, I want to manage users, so that I can control who has access to the system.

#### Acceptance Criteria

1. THE Users_Module SHALL display a list of all users in a DataGrid
2. WHEN an admin clicks "Add User", THE Users_Module SHALL open a FormModal for creating new user
3. WHEN an admin clicks "Edit" on a user row, THE Users_Module SHALL open a FormModal with user data pre-filled
4. WHEN an admin clicks "Delete" on a user row, THE Users_Module SHALL show a confirmation dialog
5. WHEN delete is confirmed, THE Users_Module SHALL call the API to delete the user and refresh the list
6. THE Users_Module SHALL support searching users by name, email, or username
7. THE Users_Module SHALL support filtering users by role or status
8. THE Users_Module SHALL validate user data before submission using Zod schema

### Requirement 8: Roles and Permissions Module (Admin)

**User Story:** As an administrator, I want to manage roles and permissions, so that I can define what actions each role can perform.

#### Acceptance Criteria

1. THE Roles_Module SHALL display a list of all roles in a DataGrid
2. WHEN an admin clicks "Add Role", THE Roles_Module SHALL open a FormModal for creating new role
3. WHEN an admin clicks "Edit" on a role row, THE Roles_Module SHALL open a FormDrawer showing role details and permissions
4. THE Roles_Module SHALL display all available permissions grouped by module
5. THE Roles_Module SHALL allow selecting/deselecting permissions using checkboxes
6. WHEN an admin saves role changes, THE Roles_Module SHALL update the role and its permissions
7. WHEN an admin clicks "Delete" on a role row, THE Roles_Module SHALL show a confirmation dialog
8. THE Roles_Module SHALL prevent deletion of roles that are assigned to users

### Requirement 9: Students Module (Admin)

**User Story:** As an administrator, I want to manage student records, so that I can maintain accurate student information for admission processing.

#### Acceptance Criteria

1. THE Students_Module SHALL display a list of all students in a DataGrid
2. WHEN an admin clicks "Add Student", THE Students_Module SHALL open a FormDrawer for creating new student
3. WHEN an admin clicks "Edit" on a student row, THE Students_Module SHALL open a FormDrawer with student data pre-filled
4. WHEN an admin clicks "View" on a student row, THE Students_Module SHALL display student details in read-only mode
5. WHEN an admin clicks "Delete" on a student row, THE Students_Module SHALL show a confirmation dialog
6. THE Students_Module SHALL support searching students by ID, name, or ID card number
7. THE Students_Module SHALL support filtering students by program, session, or status
8. THE Students_Module SHALL validate student data before submission using Zod schema

### Requirement 10: Programs Module (Admin)

**User Story:** As an administrator, I want to manage admission programs (majors), so that I can define available programs and their quotas.

#### Acceptance Criteria

1. THE Programs_Module SHALL display a list of all programs (majors) in a DataGrid
2. WHEN an admin clicks "Add Program", THE Programs_Module SHALL open a FormModal for creating new program
3. WHEN an admin clicks "Edit" on a program row, THE Programs_Module SHALL open a FormModal with program data pre-filled
4. THE Programs_Module SHALL allow setting program name, code, quota, and description
5. WHEN an admin clicks "Delete" on a program row, THE Programs_Module SHALL show a confirmation dialog
6. THE Programs_Module SHALL prevent deletion of programs that have associated students
7. THE Programs_Module SHALL display quota information and current enrollment count

### Requirement 11: Sessions Module (Admin)

**User Story:** As an administrator, I want to manage admission sessions, so that I can organize admissions by time period.

#### Acceptance Criteria

1. THE Sessions_Module SHALL display a list of all admission sessions in a DataGrid
2. WHEN an admin clicks "Add Session", THE Sessions_Module SHALL open a FormModal for creating new session
3. WHEN an admin clicks "Edit" on a session row, THE Sessions_Module SHALL open a FormModal with session data pre-filled
4. THE Sessions_Module SHALL allow setting session name, start date, end date, and status
5. WHEN an admin clicks "Delete" on a session row, THE Sessions_Module SHALL show a confirmation dialog
6. THE Sessions_Module SHALL prevent deletion of sessions that have associated students
7. THE Sessions_Module SHALL validate that end date is after start date

### Requirement 12: Excel Import Module (Admin)

**User Story:** As an administrator, I want to import student data from Excel files, so that I can efficiently add multiple students at once.

#### Acceptance Criteria

1. WHEN an admin navigates to Import module, THE Import_Module SHALL display an upload area
2. WHEN an admin uploads an Excel file, THE Import_Module SHALL validate the file format
3. WHEN file format is invalid, THE Import_Module SHALL display error message with format requirements
4. WHEN file format is valid, THE Import_Module SHALL parse the Excel data and display preview table
5. THE Import_Module SHALL highlight validation errors in the preview table
6. WHEN an admin clicks "Confirm Import", THE Import_Module SHALL send valid records to the API
7. THE Import_Module SHALL display progress indicator during import process
8. WHEN import completes, THE Import_Module SHALL display summary of successful and failed records
9. THE Import_Module SHALL allow downloading error report for failed records

### Requirement 13: Virtual Filter Module (Admin)

**User Story:** As an administrator, I want to run the virtual filter algorithm, so that I can process admission results based on defined criteria.

#### Acceptance Criteria

1. WHEN an admin navigates to Filter module, THE Filter_Module SHALL display filter configuration options
2. THE Filter_Module SHALL allow selecting admission session and programs to filter
3. WHEN an admin clicks "Run Filter", THE Filter_Module SHALL call the API to start the filter process
4. THE Filter_Module SHALL display a progress indicator showing filter execution status
5. THE Filter_Module SHALL poll the API for progress updates during filter execution
6. WHEN filter completes successfully, THE Filter_Module SHALL display summary of results
7. WHEN filter fails, THE Filter_Module SHALL display error message with details
8. THE Filter_Module SHALL allow canceling the filter process while running

### Requirement 14: Results Export Module (Admin)

**User Story:** As an administrator, I want to export admission results to Excel, so that I can share results with stakeholders.

#### Acceptance Criteria

1. WHEN an admin navigates to Results module, THE Results_Module SHALL display list of processed results
2. THE Results_Module SHALL allow filtering results by session, program, or status
3. WHEN an admin clicks "Export to Excel", THE Results_Module SHALL call the API to generate Excel file
4. THE Results_Module SHALL display progress indicator during export generation
5. WHEN export completes, THE Results_Module SHALL automatically download the Excel file
6. WHEN export fails, THE Results_Module SHALL display error message
7. THE Results_Module SHALL allow previewing results before export

### Requirement 15: Email Notification Module (Admin)

**User Story:** As an administrator, I want to send email notifications to students, so that they can be informed of their admission results.

#### Acceptance Criteria

1. WHEN an admin navigates to Email module, THE Email_Module SHALL display email sending interface
2. THE Email_Module SHALL allow selecting recipient groups (all students, specific program, specific status)
3. THE Email_Module SHALL allow previewing email template before sending
4. WHEN an admin clicks "Send Emails", THE Email_Module SHALL show confirmation dialog with recipient count
5. WHEN send is confirmed, THE Email_Module SHALL call the API to queue emails
6. THE Email_Module SHALL display progress indicator showing email sending status
7. WHEN sending completes, THE Email_Module SHALL display summary of successful and failed emails
8. THE Email_Module SHALL allow viewing email sending history

### Requirement 16: CMS Module - Posts (Admin)

**User Story:** As an administrator, I want to manage posts (news, announcements), so that I can publish content on the public interface.

#### Acceptance Criteria

1. THE Posts_Module SHALL display a list of all posts in a DataGrid
2. WHEN an admin clicks "Add Post", THE Posts_Module SHALL open a FormDrawer for creating new post
3. WHEN an admin clicks "Edit" on a post row, THE Posts_Module SHALL open a FormDrawer with post data pre-filled
4. THE Posts_Module SHALL provide a rich text editor for post content
5. THE Posts_Module SHALL allow setting post title, slug, excerpt, content, category, and publish status
6. THE Posts_Module SHALL allow uploading featured image for post
7. WHEN an admin clicks "Delete" on a post row, THE Posts_Module SHALL show a confirmation dialog
8. THE Posts_Module SHALL support searching posts by title or content
9. THE Posts_Module SHALL support filtering posts by category or status

### Requirement 17: CMS Module - Categories (Admin)

**User Story:** As an administrator, I want to manage post categories, so that I can organize content effectively.

#### Acceptance Criteria

1. THE Categories_Module SHALL display a list of all categories in a DataGrid
2. WHEN an admin clicks "Add Category", THE Categories_Module SHALL open a FormModal for creating new category
3. WHEN an admin clicks "Edit" on a category row, THE Categories_Module SHALL open a FormModal with category data pre-filled
4. THE Categories_Module SHALL allow setting category name, slug, and description
5. WHEN an admin clicks "Delete" on a category row, THE Categories_Module SHALL show a confirmation dialog
6. THE Categories_Module SHALL prevent deletion of categories that have associated posts

### Requirement 18: CMS Module - FAQs (Admin)

**User Story:** As an administrator, I want to manage FAQs, so that I can provide answers to common questions on the public interface.

#### Acceptance Criteria

1. THE FAQs_Module SHALL display a list of all FAQs in a DataGrid
2. WHEN an admin clicks "Add FAQ", THE FAQs_Module SHALL open a FormModal for creating new FAQ
3. WHEN an admin clicks "Edit" on a FAQ row, THE FAQs_Module SHALL open a FormModal with FAQ data pre-filled
4. THE FAQs_Module SHALL allow setting FAQ question, answer, and display order
5. WHEN an admin clicks "Delete" on a FAQ row, THE FAQs_Module SHALL show a confirmation dialog
6. THE FAQs_Module SHALL support reordering FAQs by drag-and-drop or order number

### Requirement 19: CMS Module - Media Files (Admin)

**User Story:** As an administrator, I want to manage media files, so that I can upload and organize images and documents.

#### Acceptance Criteria

1. THE Media_Module SHALL display a grid of all uploaded media files
2. WHEN an admin uploads a file, THE Media_Module SHALL validate file type and size
3. THE Media_Module SHALL support uploading images (jpg, png, gif, webp) and documents (pdf, doc, xls)
4. WHEN upload succeeds, THE Media_Module SHALL display the new file in the grid
5. WHEN an admin clicks on a media file, THE Media_Module SHALL display file details and preview
6. THE Media_Module SHALL allow copying file URL to clipboard
7. WHEN an admin clicks "Delete" on a media file, THE Media_Module SHALL show a confirmation dialog
8. THE Media_Module SHALL support searching files by name

### Requirement 20: Dashboard Module (Admin)

**User Story:** As an administrator, I want to view a dashboard with statistics, so that I can monitor the admission process at a glance.

#### Acceptance Criteria

1. THE Dashboard SHALL display total number of students
2. THE Dashboard SHALL display total number of programs
3. THE Dashboard SHALL display total number of applications by status (pending, accepted, rejected)
4. THE Dashboard SHALL display chart showing applications over time
5. THE Dashboard SHALL display chart showing applications by program
6. THE Dashboard SHALL display recent activities or notifications
7. THE Dashboard SHALL refresh statistics when user navigates to it
8. THE Dashboard SHALL display loading skeleton while fetching statistics

### Requirement 21: Public Layout and Navigation

**User Story:** As a visitor, I want a clear and professional public interface, so that I can easily find admission information.

#### Acceptance Criteria

1. THE Public_Interface SHALL display a header with logo and main navigation menu
2. THE Public_Interface SHALL display a footer with contact information and useful links
3. THE Public_Interface SHALL use Government Portal style with formal colors (blue, white, gray)
4. THE Public_Interface SHALL use blocky layout with clear content sections
5. THE Public_Interface SHALL be responsive and mobile-friendly
6. WHEN a visitor clicks a navigation link, THE Public_Interface SHALL navigate to the corresponding page
7. THE Public_Interface SHALL highlight the active navigation item based on current route

### Requirement 22: Public Homepage

**User Story:** As a visitor, I want to view the homepage with admission information, so that I can learn about the admission process.

#### Acceptance Criteria

1. THE Homepage SHALL display a hero section with main admission announcement
2. THE Homepage SHALL display featured news and announcements
3. THE Homepage SHALL display quick links to important pages (result lookup, programs, guides)
4. THE Homepage SHALL display admission statistics or highlights
5. THE Homepage SHALL display latest posts from CMS
6. THE Homepage SHALL load content from the API using the CMS service
7. WHEN a visitor clicks on a news item, THE Homepage SHALL navigate to the full post page

### Requirement 23: Result Lookup Page (Public)

**User Story:** As a student, I want to look up my admission result using my ID card number, so that I can check if I was accepted.

#### Acceptance Criteria

1. THE Result_Lookup_Page SHALL display a search form with ID card number input
2. WHEN a student submits a valid ID card number, THE Result_Lookup_Page SHALL call the API to fetch result
3. WHEN result is found, THE Result_Lookup_Page SHALL display student information and admission status
4. WHEN result is not found, THE Result_Lookup_Page SHALL display "No result found" message
5. THE Result_Lookup_Page SHALL display program name, score, and ranking if accepted
6. THE Result_Lookup_Page SHALL validate ID card number format before submission
7. THE Result_Lookup_Page SHALL display loading indicator during search

### Requirement 24: Programs List Page (Public)

**User Story:** As a visitor, I want to view the list of admission programs, so that I can learn about available majors and their quotas.

#### Acceptance Criteria

1. THE Programs_Page SHALL display a list of all active admission programs
2. THE Programs_Page SHALL display program name, code, quota, and description for each program
3. THE Programs_Page SHALL support filtering programs by category or field
4. THE Programs_Page SHALL support searching programs by name or code
5. WHEN a visitor clicks on a program, THE Programs_Page SHALL display detailed program information
6. THE Programs_Page SHALL load programs from the API using the Programs service

### Requirement 25: News and Posts Page (Public)

**User Story:** As a visitor, I want to read news and announcements, so that I can stay updated on admission information.

#### Acceptance Criteria

1. THE News_Page SHALL display a list of published posts
2. THE News_Page SHALL display post title, excerpt, featured image, and publish date for each post
3. THE News_Page SHALL support pagination for browsing posts
4. THE News_Page SHALL support filtering posts by category
5. WHEN a visitor clicks on a post, THE News_Page SHALL navigate to the full post detail page
6. THE Post_Detail_Page SHALL display full post content with rich text formatting
7. THE News_Page SHALL load posts from the API using the CMS service

### Requirement 26: Guides and FAQs Page (Public)

**User Story:** As a visitor, I want to read guides and FAQs, so that I can understand the admission process and get answers to common questions.

#### Acceptance Criteria

1. THE Guides_Page SHALL display a list of guide posts
2. THE Guides_Page SHALL display a list of FAQs in accordion format
3. WHEN a visitor clicks on a FAQ question, THE Guides_Page SHALL expand to show the answer
4. THE Guides_Page SHALL allow downloading template files (Excel templates, guides)
5. THE Guides_Page SHALL load FAQs from the API using the CMS service
6. THE Guides_Page SHALL group FAQs by category if applicable

### Requirement 27: Error Handling and Notifications

**User Story:** As a user, I want clear error messages and notifications, so that I understand what happened and what to do next.

#### Acceptance Criteria

1. WHEN an API request fails, THE System SHALL display a toast notification with error message
2. WHEN a form validation fails, THE System SHALL display inline error messages for each invalid field
3. WHEN a network error occurs, THE System SHALL display a user-friendly error message
4. WHEN an action succeeds, THE System SHALL display a success toast notification
5. THE System SHALL implement error boundaries to catch and display React errors gracefully
6. WHEN an unexpected error occurs, THE System SHALL display a fallback UI with error details
7. THE System SHALL log errors to console for debugging purposes

### Requirement 28: Loading States and Skeletons

**User Story:** As a user, I want to see loading indicators, so that I know the system is processing my request.

#### Acceptance Criteria

1. WHEN data is being fetched, THE System SHALL display skeleton loaders matching the content layout
2. WHEN a form is being submitted, THE System SHALL display a loading spinner on the submit button
3. WHEN a page is loading, THE System SHALL display a loading indicator
4. WHEN a long-running process is executing, THE System SHALL display a progress bar or percentage
5. THE System SHALL disable interactive elements during loading to prevent duplicate submissions

### Requirement 29: Responsive Design

**User Story:** As a mobile user, I want the interface to work well on my device, so that I can access the system from anywhere.

#### Acceptance Criteria

1. THE System SHALL be fully functional on mobile devices (320px width and above)
2. THE System SHALL be fully functional on tablet devices (768px width and above)
3. THE System SHALL be fully functional on desktop devices (1024px width and above)
4. THE Admin_Interface SHALL collapse sidebar into hamburger menu on mobile devices
5. THE DataGrid SHALL adapt to mobile layout with horizontal scrolling or card view
6. THE FormModal SHALL adapt to full-screen on mobile devices
7. THE Public_Interface SHALL use mobile-first responsive design principles

### Requirement 30: Configuration Management

**User Story:** As a developer, I want centralized configuration, so that I can easily manage environment-specific settings.

#### Acceptance Criteria

1. THE System SHALL store API base URL in environment variables
2. THE System SHALL store authentication configuration in environment variables
3. THE System SHALL provide a configuration module for accessing settings
4. THE System SHALL support different configurations for development, staging, and production
5. THE System SHALL validate required environment variables on startup
6. THE System SHALL provide default values for optional configuration settings
