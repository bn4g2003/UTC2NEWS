# Implementation Plan: Admission Management System

## Overview

This implementation plan breaks down the Admission Management System into incremental, testable steps. The system will be built module by module, with each module including its core functionality and tests. The implementation follows a bottom-up approach, starting with infrastructure and foundational modules, then building up to complex business logic.

## Tasks

- [-] 1. Setup infrastructure and database foundation
  - [x] 1.1 Create Docker Compose configuration for PostgreSQL, MinIO, and Redis
    - Create docker-compose.yml in admission-backend directory
    - Define PostgreSQL service with environment variables
    - Define MinIO service for object storage
    - Define Redis service for BullMQ
    - Configure volume mounts for data persistence
    - Create .env.example file with required environment variables
    - _Requirements: Infrastructure setup_
  
  - [x] 1.2 Configure Prisma with PostgreSQL connection
    - Remove TypeORM dependencies (currently installed but not needed)
    - Install Prisma CLI and Prisma Client dependencies
    - Initialize Prisma with `npx prisma init`
    - Configure DATABASE_URL in .env file
    - Set up Prisma Client generation in package.json
    - _Requirements: Infrastructure setup_
  
  - [x] 1.3 Create Prisma schema and initial migration
    - Define all models in prisma/schema.prisma (User, Permission, Role, RolePermission, UserRole, Category, Post, MediaFile, FAQ, Major, AdmissionSession, SessionQuota, Student, Application, EmailNotification, Settings)
    - Add all enums (PostStatus, SessionStatus, AdmissionStatus, EmailStatus)
    - Configure relationships and constraints
    - Create initial migration with `npx prisma migrate dev --name init`
    - Generate Prisma Client
    - _Requirements: Infrastructure setup_
  
  - [ ]* 1.4 Write integration tests for database connection
    - Test database connection establishment
    - Test Prisma Client queries
    - _Requirements: Infrastructure setup_

- [x] 2. Implement authentication module
  - [x] 2.1 Create PrismaModule and PrismaService
    - Create src/prisma/prisma.module.ts
    - Create src/prisma/prisma.service.ts with PrismaClient initialization
    - Export PrismaService for use in other modules
    - Add PrismaModule to AppModule imports
    - _Requirements: Infrastructure setup_
  
  - [x] 2.2 Implement AuthModule with JWT token generation
    - Install dependencies: @nestjs/jwt, @nestjs/passport, passport, passport-jwt, bcrypt, @types/bcrypt
    - Create src/auth directory structure
    - Create AuthService with login, validateUser methods
    - Implement password hashing with bcrypt
    - Implement JWT token generation (access token with 24h expiration)
    - Create LoginDto with class-validator decorators
    - _Requirements: 1.1_
  
  - [x] 2.3 Create JWT guards and strategies
    - Create JwtStrategy extending PassportStrategy
    - Implement JwtAuthGuard for access token validation
    - Configure JWT module with secret and expiration
    - _Requirements: 1.1, 1.2_
  
  - [x] 2.4 Create AuthController with login endpoint
    - Create AuthController with POST /auth/login endpoint
    - Add request validation with ValidationPipe
    - Return access token on successful login
    - _Requirements: 1.1_
  
  - [ ]* 2.5 Write property test for token generation completeness
    - Install fast-check for property-based testing
    - **Property 1: Token generation completeness**
    - **Validates: Requirements 1.1**
  
  - [ ]* 2.6 Write property test for invalid token rejection
    - **Property 2: Invalid token rejection**
    - **Validates: Requirements 1.2**

- [x] 3. Checkpoint - Verify authentication works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement RBAC module
  - [x] 4.1 Create RBACModule and RBACService
    - Create src/rbac directory structure
    - Create RBACService with Prisma integration
    - Implement createPermission method
    - Implement createRole method
    - Implement assignPermissionsToRole method
    - Implement assignRolesToUser method
    - Implement getUserPermissions method
    - Implement hasPermission method
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 4.2 Create PermissionsGuard for route protection
    - Create PermissionsGuard that checks user permissions
    - Create @RequirePermissions decorator
    - Integrate with Reflector for metadata
    - _Requirements: 2.4, 2.5, 2.6_
  
  - [x] 4.3 Create RBACController for role and permission management
    - Implement POST /permissions endpoint
    - Implement POST /roles endpoint
    - Implement POST /roles/:id/permissions endpoint
    - Implement POST /users/:id/roles endpoint
    - Implement GET /users/:id/permissions endpoint
    - Add JwtAuthGuard and PermissionsGuard to endpoints
    - _Requirements: 2.2, 2.3_
  
  - [ ]* 4.4 Write property test for role-permission assignment consistency
    - **Property 5: Role-permission assignment consistency**
    - **Validates: Requirements 2.2**
  
  - [ ]* 4.5 Write property test for user-role assignment consistency
    - **Property 6: User-role assignment consistency**
    - **Validates: Requirements 2.3**
  
  - [ ]* 4.6 Write property test for permission-based access control
    - **Property 7: Permission-based access control**
    - **Validates: Requirements 2.4, 2.5**

- [ ] 5. Implement content management module
  - [x] 5.1 Configure MinIO client for file storage
    - Install minio package
    - Create src/storage directory
    - Create MinioStorageService with uploadFile, downloadFile, deleteFile, generatePresignedUrl methods
    - Configure MinIO connection with environment variables
    - Implement bucket creation on module initialization
    - _Requirements: 3.5_
  
  - [x] 5.2 Create CMSModule and CMSService
    - Create src/cms directory structure
    - Create CMSService with Prisma integration
    - Implement category CRUD methods
    - Implement post CRUD methods with status filtering
    - Implement FAQ CRUD methods
    - Implement media file upload with MinIO integration
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.7_
  
  - [x] 5.3 Create CMSController with content endpoints
    - Implement category endpoints (GET, POST, PUT, DELETE /categories)
    - Implement post endpoints (GET, POST, PUT, DELETE /posts) with status filtering
    - Implement FAQ endpoints (GET, POST, PUT, DELETE /faqs)
    - Implement media upload endpoint (POST /media) with multer
    - Add JwtAuthGuard and PermissionsGuard to all endpoints
    - _Requirements: 3.1, 3.2, 3.5, 3.7_
  
  - [ ]* 5.4 Write property test for entity creation round-trip
    - **Property 8: Entity creation round-trip**
    - **Validates: Requirements 3.1, 3.2, 3.7**
  
  - [ ]* 5.5 Write property test for post status constraint
    - **Property 9: Post status constraint**
    - **Validates: Requirements 3.3**
  
  - [ ]* 5.6 Write property test for draft post exclusion
    - **Property 10: Draft post exclusion**
    - **Validates: Requirements 3.4**
  
  - [ ]* 5.7 Write property test for media file upload round-trip
    - **Property 11: Media file upload round-trip**
    - **Validates: Requirements 3.5**

- [x] 6. Implement program and session management module
  - [x] 6.1 Create ProgramModule and ProgramService
    - Create src/program directory structure
    - Create ProgramService with Prisma integration
    - Implement major CRUD methods with code uniqueness validation
    - Implement admission session CRUD methods
    - Implement quota configuration methods with positive integer validation
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [x] 6.2 Create ProgramController
    - Implement major endpoints (GET, POST, PUT, DELETE /majors)
    - Implement admission session endpoints (GET, POST, PUT, DELETE /sessions)
    - Implement quota configuration endpoints (GET, POST, PUT /quotas)
    - Add JwtAuthGuard and PermissionsGuard
    - _Requirements: 4.1, 4.3, 4.4_
  
  - [ ]* 6.3 Write property test for major creation round-trip
    - **Property 13: Major creation round-trip**
    - **Validates: Requirements 4.1**
  
  - [ ]* 6.4 Write property test for major code uniqueness
    - **Property 14: Major code uniqueness**
    - **Validates: Requirements 4.2**
  
  - [ ]* 6.5 Write property test for session creation round-trip
    - **Property 15: Session creation round-trip**
    - **Validates: Requirements 4.3**
  
  - [ ]* 6.6 Write property test for quota configuration consistency
    - **Property 16: Quota configuration consistency**
    - **Validates: Requirements 4.4, 4.5**
  
  - [ ]* 6.7 Write property test for quota value validation
    - **Property 17: Quota value validation**
    - **Validates: Requirements 4.6**

- [x] 7. Checkpoint - Verify core modules work together
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement student data import module
  - [x] 8.1 Create ImportModule with Excel parsing service
    - Install xlsx package for Excel parsing
    - Create src/import directory structure
    - Create ExcelImportService with validateTemplate and parseStudentData methods
    - Handle subject scores as JSON
    - Handle preference data parsing
    - _Requirements: 5.1, 5.2, 5.8_
  
  - [x] 8.2 Implement ImportValidationService
    - Create ImportValidationService
    - Implement validateStudentRecord for required fields
    - Implement checkDuplicateIdCard method
    - Implement validateMajorCodes method
    - Implement validateRequiredFields method
    - Collect all validation errors (don't fail on first error)
    - _Requirements: 5.3, 5.4, 5.5, 5.6_
  
  - [x] 8.3 Implement ImportService with Prisma transaction support
    - Create ImportService
    - Implement importStudents method with Prisma transaction
    - Create student records in batch
    - Create application records with correct priority ordering
    - Rollback on any validation failure
    - Return detailed ImportResult with success/failure counts
    - _Requirements: 5.4, 5.6, 5.7, 5.8_
  
  - [x] 8.4 Create ImportController with upload endpoint
    - Install @nestjs/platform-express and multer types
    - Create ImportController
    - Implement POST /import/students endpoint with file upload
    - Use FileInterceptor for multipart/form-data handling
    - Return detailed validation errors
    - Add JwtAuthGuard and PermissionsGuard for import_student permission
    - _Requirements: 5.2, 5.6_
  
  - [ ]* 8.5 Write property test for template structure validation
    - **Property 18: Template structure validation**
    - **Validates: Requirements 5.2**
  
  - [ ]* 8.6 Write property test for required field validation
    - **Property 19: Required field validation**
    - **Validates: Requirements 5.3**
  
  - [ ]* 8.7 Write property test for duplicate ID card detection
    - **Property 20: Duplicate ID card detection**
    - **Validates: Requirements 5.4, 6.4**
  
  - [ ]* 8.8 Write property test for major code reference validation
    - **Property 21: Major code reference validation**
    - **Validates: Requirements 5.5**
  
  - [ ]* 8.9 Write property test for validation error reporting completeness
    - **Property 22: Validation error reporting completeness**
    - **Validates: Requirements 5.6**
  
  - [ ]* 8.10 Write property test for import data persistence
    - **Property 23: Import data persistence**
    - **Validates: Requirements 5.7**
  
  - [ ]* 8.11 Write property test for preference priority preservation
    - **Property 24: Preference priority preservation**
    - **Validates: Requirements 5.8**

- [x] 9. Implement manual student entry module
  - [x] 9.1 Create StudentModule and StudentService
    - Create src/student directory structure
    - Create StudentService with Prisma integration
    - Implement createStudent method with validation
    - Implement updateStudent method
    - Implement addPreference, updatePreference, removePreference methods
    - Validate major codes and admission methods
    - Check for duplicate ID cards
    - _Requirements: 6.3, 6.4, 6.5, 6.6_
  
  - [x] 9.2 Create StudentController
    - Implement POST /students endpoint
    - Implement PUT /students/:id endpoint
    - Implement GET /students/:id endpoint
    - Implement POST /students/:id/preferences endpoint
    - Implement PUT /students/:id/preferences/:preferenceId endpoint
    - Implement DELETE /students/:id/preferences/:preferenceId endpoint
    - Add JwtAuthGuard and PermissionsGuard
    - _Requirements: 6.3, 6.5_
  
  - [ ]* 9.3 Write property test for student record validation
    - **Property 25: Student record validation**
    - **Validates: Requirements 6.3**
  
  - [ ]* 9.4 Write property test for preference modification consistency
    - **Property 26: Preference modification consistency**
    - **Validates: Requirements 6.5**
  
  - [ ]* 9.5 Write property test for preference reference validation
    - **Property 27: Preference reference validation**
    - **Validates: Requirements 6.6**

- [x] 10. Implement score calculation module
  - [x] 10.1 Create ScoreModule and ScoreCalculationService
    - Create src/score directory structure
    - Define admission method types and formulas (entrance_exam, high_school_transcript, direct_admission)
    - Create ScoreCalculationService
    - Implement calculateScore method with formula application
    - Implement getRequiredSubjects method
    - Implement isEligible method to check for missing subjects
    - Handle different formulas based on admission method
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 10.2 Integrate score calculation into application processing
    - Update ImportService to calculate scores when applications are created
    - Update StudentService to calculate scores for manual entries
    - Store calculated scores in Application model
    - Mark ineligible applications
    - _Requirements: 7.3, 7.4_
  
  - [ ]* 10.3 Write property test for score calculation formula correctness
    - **Property 28: Score calculation formula correctness**
    - **Validates: Requirements 7.1, 7.2**
  
  - [ ]* 10.4 Write property test for eligibility determination
    - **Property 29: Eligibility determination**
    - **Validates: Requirements 7.3**
  
  - [ ]* 10.5 Write property test for score persistence
    - **Property 30: Score persistence**
    - **Validates: Requirements 7.4**

- [x] 11. Checkpoint - Verify data import and scoring work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement virtual filtering algorithm
  - [x] 12.1 Create FilterModule and VirtualFilterService
    - Create src/filter directory structure
    - Create VirtualFilterService with Prisma integration
    - Implement runFilter method as main entry point
    - Implement calculateScores to compute all application scores
    - Implement rankApplications to sort by score within each major
    - Use Prisma transactions for atomicity
    - _Requirements: 8.1, 8.6_
  
  - [x] 12.2 Implement preference processing logic
    - Implement processPreferences method
    - Process preferences in priority order (NV1, NV2, NV3...)
    - For each preference, process students by rank (highest score first)
    - When student is admitted, remove from all lower preferences
    - Enforce quota limits per major
    - Mark remaining applications as not_admitted when quota reached
    - _Requirements: 8.1, 8.2, 8.4_
  
  - [x] 12.3 Implement admission decision persistence
    - Update Application models with admission status
    - Store admitted preference number
    - Generate FilterResult summary
    - _Requirements: 8.6_
  
  - [x] 12.4 Create FilterController
    - Implement POST /sessions/:id/run-filter endpoint
    - Return FilterResult with execution summary
    - Add JwtAuthGuard and PermissionsGuard for run_filter permission
    - _Requirements: 8.6_
  
  - [ ]* 12.5 Write property test for score-based processing order
    - **Property 31: Score-based processing order**
    - **Validates: Requirements 8.1**
  
  - [ ]* 12.6 Write property test for preference cascade removal
    - **Property 32: Preference cascade removal**
    - **Validates: Requirements 8.2**
  
  - [ ]* 12.7 Write property test for quota enforcement
    - **Property 33: Quota enforcement**
    - **Validates: Requirements 8.4**
  
  - [ ]* 12.8 Write property test for result list generation
    - **Property 34: Result list generation**
    - **Validates: Requirements 8.6**
  
  - [ ]* 12.9 Write property test for virtual filter idempotence
    - **Property 35: Virtual filter idempotence**
    - **Validates: Requirements 8.7**

- [x] 13. Implement result export module
  - [x] 13.1 Implement ResultExportService
    - Install xlsx package if not already installed
    - Implement generateResultExcel method
    - Implement formatResultData to prepare rows
    - Query admitted students with Prisma joins for student and major data
    - Format Excel with headers and data rows
    - _Requirements: 9.1, 9.2_
  
  - [ ]* 13.2 Write property test for result completeness
    - **Property 34: Result completeness**
    - **Validates: Requirements 9.1**
  
  - [ ]* 13.3 Write property test for result field completeness
    - **Property 35: Result field completeness**
    - **Validates: Requirements 9.2**
  
  - [x] 13.4 Create ResultController
    - Implement GET /sessions/:id/results/export endpoint
    - Return Excel file as downloadable attachment
    - Add permission guard for export_results permission
    - _Requirements: 9.1_

- [x] 14. Implement email notification module
  - [x] 14.1 Configure BullMQ with Redis
    - Install @nestjs/bull and bull packages
    - Configure BullModule with Redis connection
    - Create email queue
    - _Requirements: 10.1, 10.2_
  
  - [x] 14.2 Create EmailNotification model in Prisma
    - Define EmailNotification model (studentId, email, templateName, templateData, status, attempts, sentAt, lastError)
    - _Requirements: 10.6_
  
  - [x] 14.3 Implement EmailQueueService with Prisma
    - Implement queueAdmissionEmails method to create jobs
    - Create EmailNotification records in database
    - Add jobs to BullMQ queue
    - Implement getEmailStatus method
    - _Requirements: 10.1, 10.6_
  
  - [x] 14.4 Implement email processor with retry logic
    - Create email processor class
    - Implement processEmailJob method
    - Configure retry attempts (max 3)
    - Configure exponential backoff
    - Update EmailNotification status after each attempt
    - Log failures after all retries exhausted
    - _Requirements: 10.3, 10.4, 10.5_
  
  - [x] 14.5 Integrate email service (use nodemailer or similar)
    - Install nodemailer
    - Configure SMTP settings
    - Create email templates for admission results
    - Implement sendEmail method
    - _Requirements: 10.3_
  
  - [ ]* 14.6 Write property test for email queue completeness
    - **Property 36: Email queue completeness**
    - **Validates: Requirements 10.1**
  
  - [ ]* 14.7 Write property test for email retry behavior
    - **Property 38: Email retry behavior**
    - **Validates: Requirements 10.4**
  
  - [ ]* 14.8 Write property test for failed email logging
    - **Property 39: Failed email logging**
    - **Validates: Requirements 10.5**
  
  - [ ]* 14.9 Write property test for email status tracking
    - **Property 40: Email status tracking**
    - **Validates: Requirements 10.6**
  
  - [x] 14.10 Create EmailController
    - Implement POST /sessions/:id/send-results endpoint
    - Queue emails for all admitted students
    - Return immediately without waiting for delivery
    - Implement GET /emails/:studentId/status endpoint
    - Add permission guards
    - _Requirements: 10.1, 10.6_

- [x] 15. Checkpoint - Verify complete admission workflow
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Implement data integrity
  - [x] 16.1 Configure Prisma schema constraints
    - Add foreign key constraints with appropriate cascade rules
    - Add check constraints for valid enum values
    - Verify referential integrity enforcement
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [ ]* 16.2 Write property test for referential integrity enforcement
    - **Property 41: Referential integrity enforcement**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**
  
  - [ ]* 16.3 Write property test for cascade deletion consistency
    - **Property 42: Cascade deletion consistency**
    - **Validates: Requirements 11.5**

- [x] 17. Implement configuration management
  - [x] 17.1 Create Settings model in Prisma
    - Define Settings model (key as primary key, value as JSON, description, updatedAt)
    - _Requirements: 12.1_
  
  - [x] 17.2 Implement ConfigService with Prisma
    - Implement getSetting method with default values
    - Implement updateSetting method with validation
    - Implement validateConfigValue method
    - Define default values for all settings
    - _Requirements: 12.1, 12.2, 12.3, 12.5_
  
  - [ ]* 17.3 Write property test for configuration storage round-trip
    - **Property 43: Configuration storage round-trip**
    - **Validates: Requirements 12.1, 12.2**
  
  - [ ]* 17.4 Write property test for configuration validation
    - **Property 44: Configuration validation**
    - **Validates: Requirements 12.3**
  
  - [ ]* 17.5 Write property test for configuration defaults
    - **Property 45: Configuration defaults**
    - **Validates: Requirements 12.5**
  
  - [x] 17.6 Create ConfigController
    - Implement GET /settings/:key endpoint
    - Implement PUT /settings/:key endpoint
    - Add permission guard for manage_settings permission
    - _Requirements: 12.2_

- [x] 18. Setup error handling and validation
  - [x] 18.1 Create global exception filter
    - Implement exception filter for consistent error responses
    - Handle different error types (validation, auth, not found, conflict, server)
    - Format error responses according to ErrorResponse interface
    - Log errors with context
    - _Requirements: Error handling_
  
  - [x] 18.2 Configure validation pipes
    - Set up global ValidationPipe with class-validator
    - Configure whitelist and transform options
    - Add custom validation decorators as needed
    - _Requirements: Error handling_
  
  - [x] 18.3 Add request logging middleware
    - Create middleware to log all incoming requests
    - Log request method, path, user, and timestamp
    - _Requirements: Logging_

- [x] 19. Create seed data and initialization
  - [x] 19.1 Create database seeder
    - Create initial admin user
    - Create default permissions (create_major, import_student, run_filter, export_results, etc.)
    - Create default admin role with all permissions
    - Assign admin role to initial admin user
    - _Requirements: 2.1, 2.2_
  
  - [x] 19.2 Create sample data seeder for development
    - Create sample majors
    - Create sample admission session
    - Create sample quotas
    - _Requirements: Development setup_

- [x] 20. Final integration and documentation
  - [x] 20.1 Create API documentation with Swagger
    - Install @nestjs/swagger
    - Add Swagger decorators to all controllers
    - Configure Swagger module
    - Generate API documentation at /api/docs
    - _Requirements: Documentation_
  
  - [x] 20.2 Update README with setup instructions
    - Document Docker setup steps
    - Document environment variables
    - Document Prisma migration commands
    - Document seeding commands
    - Document API endpoints overview
    - _Requirements: Documentation_
  
  - [x] 20.3 Create example Excel template
    - Create sample Excel file with correct structure
    - Include example student data
    - Document required columns and formats
    - _Requirements: 5.1_

- [ ] 21. Final checkpoint - Complete system verification
  - Run all tests (unit and property tests)
  - Verify complete admission workflow end-to-end
  - Test with sample Excel import
  - Verify email notifications work
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- Property tests validate universal correctness properties with 100+ iterations each
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: infrastructure → auth → RBAC → content → programs → import → filtering → export → notifications
- All database operations use Prisma transactions where appropriate
- All endpoints are protected with permission guards
- Docker Compose simplifies infrastructure setup (PostgreSQL, MinIO, Redis)
- Prisma provides type-safe database access and automatic migrations
