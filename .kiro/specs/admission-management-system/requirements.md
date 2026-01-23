# Requirements Document

## Introduction

This document specifies the requirements for an Admission Management System (Hệ thống quản lý tuyển sinh) - an internal management system designed to handle large-scale student admission processing with dynamic role-based access control, Excel data import, virtual filtering algorithms, and automated result notifications.

## Glossary

- **System**: The Admission Management System
- **Staff_User**: An authenticated user with assigned roles and permissions
- **Admin**: A staff user with full system access and role management capabilities
- **Student_Record**: A data entry representing a student's application information
- **Application**: A student's preference entry linking student, major, admission method, and priority
- **Major**: An academic program with code, name, and subject combinations
- **Admission_Session**: A time-bound period for processing admissions (e.g., Round 1, Supplementary)
- **Quota**: The maximum number of students that can be admitted to a major in a session
- **Virtual_Filter**: The algorithm that processes student applications by preference priority
- **Admission_Method**: The evaluation approach (e.g., entrance exam, high school transcript)
- **Priority_Points**: Additional points awarded based on student circumstances
- **Preference**: A student's ranked choice of major and method (NV1, NV2, NV3...)
- **Access_Token**: Short-lived JWT token for API authentication
- **Refresh_Token**: Long-lived JWT token for obtaining new access tokens
- **Permission**: An atomic action that can be performed (e.g., create_major, import_student)
- **Role**: A named collection of permissions assigned to users
- **Post**: A content article for admission information or guides
- **Category**: A grouping mechanism for organizing posts
- **Media_File**: An uploaded file (image or PDF) for admission announcements
- **FAQ**: A frequently asked question entry with question and answer
- **Excel_Template**: A standardized Excel format for bulk student data import
- **Result_List**: The final list of students who passed admission criteria
- **Email_Queue**: A background job queue for processing batch email notifications

## Requirements

### Requirement 1: Authentication and Token Management

**User Story:** As a staff user, I want to authenticate securely using JWT tokens, so that my session is protected.

#### Acceptance Criteria

1. WHEN a staff user provides valid credentials, THE System SHALL generate an access token with extended expiration (24 hours)
2. WHEN an invalid or expired token is presented, THE System SHALL reject the request and return an authentication error

### Requirement 2: Dynamic Role-Based Access Control (RBAC)

**User Story:** As an admin, I want to manage roles and permissions dynamically, so that I can control what actions different staff members can perform without code changes.

#### Acceptance Criteria

1. THE System SHALL maintain a catalog of permissions representing atomic actions
2. THE System SHALL allow admins to create roles and assign multiple permissions to each role
3. THE System SHALL allow admins to assign one or more roles to staff users
4. WHEN a staff user attempts an action, THE System SHALL verify the user has a role containing the required permission
5. WHEN a staff user lacks the required permission, THE System SHALL reject the request and return an authorization error
6. THE System SHALL provide middleware that checks permissions based on HTTP request path and method

### Requirement 3: Content Management System

**User Story:** As a content manager, I want to create and publish admission information articles, so that prospective students can access guides and announcements.

#### Acceptance Criteria

1. THE System SHALL allow staff users to create categories for organizing posts
2. THE System SHALL allow staff users to create posts with title, content, category, and status
3. THE System SHALL support post status values of Draft and Published
4. WHEN a post is in Draft status, THE System SHALL exclude it from public queries
5. THE System SHALL allow staff users to upload media files in image and PDF formats
6. THE System SHALL associate uploaded media files with posts or announcements
7. THE System SHALL allow staff users to create FAQ entries with question and answer fields

### Requirement 4: Program and Session Management

**User Story:** As an admission coordinator, I want to configure majors and admission sessions, so that I can define what programs are available and when applications are accepted.

#### Acceptance Criteria

1. THE System SHALL allow staff users to create majors with code, name, and subject combinations
2. THE System SHALL enforce unique major codes across all majors
3. THE System SHALL allow staff users to create admission sessions with name, start date, and end date
4. THE System SHALL allow staff users to configure quotas for each major within an admission session
5. THE System SHALL allow staff users to specify admission methods for each major-session combination
6. WHEN configuring quotas, THE System SHALL validate that quota values are positive integers

### Requirement 5: Student Data Import from Excel

**User Story:** As a data entry staff member, I want to import student applications from Excel files, so that I can process large volumes of applications efficiently.

#### Acceptance Criteria

1. THE System SHALL provide a standard Excel template format for student data import
2. WHEN an Excel file is uploaded, THE System SHALL validate that it matches the standard template structure
3. WHEN processing Excel data, THE System SHALL validate each student record for required fields
4. WHEN processing Excel data, THE System SHALL detect duplicate ID card numbers and reject duplicate entries
5. WHEN processing Excel data, THE System SHALL validate that referenced major codes exist in the system
6. WHEN validation fails for any record, THE System SHALL return detailed error information indicating which rows failed and why
7. WHEN all validations pass, THE System SHALL create student records and associated applications in the database
8. THE System SHALL parse preference data from Excel and create application entries with correct priority ordering

### Requirement 6: Manual Student Data Entry

**User Story:** As a data entry staff member, I want to manually add or edit individual student records, so that I can correct errors or add students who were not in the bulk import.

#### Acceptance Criteria

1. THE System SHALL provide a form interface for creating individual student records
2. THE System SHALL provide a form interface for editing existing student records
3. WHEN creating or editing a student record, THE System SHALL validate all required fields are present
4. WHEN creating a student record, THE System SHALL check for duplicate ID card numbers and reject duplicates
5. THE System SHALL allow staff users to add, edit, or remove preference entries for a student
6. WHEN adding preferences, THE System SHALL validate that major codes and admission methods are valid

### Requirement 7: Score Calculation

**User Story:** As an admission processor, I want the system to calculate admission scores automatically, so that students are evaluated consistently according to defined formulas.

#### Acceptance Criteria

1. THE System SHALL calculate admission scores by combining subject scores and priority points
2. THE System SHALL apply different score calculation formulas based on the admission method
3. WHEN subject scores are missing for a required subject, THE System SHALL mark the application as ineligible
4. THE System SHALL store calculated scores with each application record
5. WHEN score calculation formulas are updated, THE System SHALL provide a mechanism to recalculate all affected scores

### Requirement 8: Virtual Filtering Algorithm

**User Story:** As an admission processor, I want to run the virtual filtering algorithm, so that students are admitted to their highest preference where they qualify, and lower preferences are freed for other students.

#### Acceptance Criteria

1. WHEN the virtual filter runs, THE System SHALL process applications in descending score order within each major
2. WHEN a student is admitted to a preference, THE System SHALL remove that student from all lower-priority preferences
3. WHEN a student is removed from a lower preference, THE System SHALL recalculate admission status for remaining students in that major
4. WHEN a major reaches its quota, THE System SHALL mark all remaining applications for that major as not admitted
5. THE System SHALL process all preferences in priority order (NV1 before NV2, NV2 before NV3, etc.)
6. WHEN the virtual filter completes, THE System SHALL generate a final result list of admitted students
7. THE System SHALL ensure the virtual filter algorithm is idempotent for the same input data

### Requirement 9: Result Export

**User Story:** As an admission coordinator, I want to export admission results to Excel, so that I can share official results with stakeholders.

#### Acceptance Criteria

1. THE System SHALL generate an Excel file containing all admitted students
2. WHEN generating the result file, THE System SHALL include student information, admitted major, admission method, and final score
3. THE System SHALL format the Excel output according to official result template specifications
4. WHEN the result export is requested, THE System SHALL complete within 30 seconds for up to 10,000 student records

### Requirement 10: Automated Email Notifications

**User Story:** As an admission coordinator, I want to send admission result emails automatically, so that students are notified promptly without manual effort.

#### Acceptance Criteria

1. THE System SHALL queue email notifications for all admitted students
2. WHEN emails are queued, THE System SHALL use a background job queue to process them asynchronously
3. WHEN processing email jobs, THE System SHALL send individual emails to each admitted student
4. WHEN an email fails to send, THE System SHALL retry up to 3 times with exponential backoff
5. WHEN an email fails after all retries, THE System SHALL log the failure for manual review
6. THE System SHALL track email delivery status for each student notification
7. WHEN queuing emails, THE System SHALL return immediately without waiting for email delivery

### Requirement 11: Data Integrity and Validation

**User Story:** As a system administrator, I want the system to maintain data integrity, so that admission decisions are based on accurate and consistent data.

#### Acceptance Criteria

1. THE System SHALL enforce referential integrity between students and applications
2. THE System SHALL enforce referential integrity between applications and majors
3. THE System SHALL enforce referential integrity between roles and permissions
4. WHEN a major is deleted, THE System SHALL prevent deletion if applications reference that major
5. WHEN a user is deleted, THE System SHALL remove associated role assignments
6. THE System SHALL use database transactions for multi-step operations to ensure atomicity

### Requirement 12: System Configuration Management

**User Story:** As a system administrator, I want to configure system-wide settings, so that I can adjust system behavior without code changes.

#### Acceptance Criteria

1. THE System SHALL store configuration settings in a settings table
2. THE System SHALL allow administrators to update configuration values
3. THE System SHALL validate configuration values against expected types and ranges
4. WHEN configuration values are updated, THE System SHALL apply changes without requiring system restart
5. THE System SHALL provide default values for all configuration settings


