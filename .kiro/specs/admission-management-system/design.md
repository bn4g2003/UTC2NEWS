# Design Document: Admission Management System

## Overview

The Admission Management System is a NestJS-based backend application that processes large-scale student admissions with dynamic role-based access control, Excel data import, and automated result notifications. The system handles the complete admission workflow from data entry through virtual filtering to final result distribution.

Key design principles:
- **Separation of concerns**: Clear boundaries between authentication, authorization, business logic, and data access
- **Scalability**: Asynchronous processing for bulk operations (Excel import, email notifications)
- **Data integrity**: Transaction-based operations with referential integrity constraints
- **Extensibility**: Dynamic RBAC allows permission changes without code deployment
- **Auditability**: Comprehensive logging of all critical operations

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (NestJS)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth Module  │  │ RBAC Module  │  │ CMS Module   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Program Module│  │Import Module │  │Filter Module │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │Result Module │  │ Email Module │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Business Logic Services                             │  │
│  │  - AuthService, RBACService, ImportService           │  │
│  │  - VirtualFilterService, EmailService                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Access Layer                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Prisma ORM                                          │  │
│  │  - PrismaService, Generated Prisma Client           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Infrastructure (Docker Containers)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ PostgreSQL   │  │    MinIO     │  │    Redis     │     │
│  │  Database    │  │ Object Store │  │ (BullMQ)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Background Jobs (BullMQ)                  │
│  - Email Queue Worker                                       │
│  - Import Processing Queue                                  │
└─────────────────────────────────────────────────────────────┘
```

### Infrastructure Setup

**Docker Compose Configuration**:
The system uses Docker containers for all infrastructure components to simplify development and deployment:

- **PostgreSQL**: Database container for persistent data storage
- **MinIO**: S3-compatible object storage for media files (images, PDFs, Excel files)
- **Redis**: In-memory data store for BullMQ job queues

**Prisma ORM**:
The system uses Prisma as the database ORM, providing:
- Type-safe database queries
- Automatic migrations
- Intuitive data modeling with schema.prisma
- Built-in connection pooling
- Excellent TypeScript integration

This containerized approach ensures:
- Consistent development environment across team members
- Easy setup with `docker-compose up`
- Isolated infrastructure services
- Simple backup and restore procedures

### Module Responsibilities

**Auth Module**: Handles JWT token generation, validation, and refresh token management.

**RBAC Module**: Manages permissions, roles, and user-role assignments. Provides guards for route protection.

**CMS Module**: Manages content (posts, categories, FAQs) and media file uploads.

**Program Module**: Manages majors, admission sessions, quotas, and admission methods.

**Import Module**: Processes Excel file uploads, validates data, and creates student records.

**Filter Module**: Implements the virtual filtering algorithm for admission processing.

**Result Module**: Generates Excel reports of admission results.

**Email Module**: Queues and sends batch email notifications to admitted students.

## Components and Interfaces

### Authentication Components

**JwtAuthGuard**
- Purpose: Validates access tokens on protected routes
- Input: HTTP request with Authorization header
- Output: Authenticated user context or 401 error
- Dependencies: JwtService, PrismaService

**AuthService**
```typescript
interface AuthService {
  login(credentials: LoginDto): Promise<TokenResponse>
  logout(userId: string): Promise<void>
  validateUser(username: string, password: string): Promise<User | null>
}

interface TokenResponse {
  accessToken: string
  expiresIn: number // 24 hours in seconds
}

interface LoginDto {
  username: string
  password: string
}
```

### RBAC Components

**PermissionsGuard**
- Purpose: Checks if authenticated user has required permissions
- Input: HTTP request context, required permission metadata
- Output: Allow/deny access decision
- Dependencies: RBACService, Reflector

**RBACService**
```typescript
interface RBACService {
  createPermission(data: CreatePermissionDto): Promise<Permission>
  createRole(data: CreateRoleDto): Promise<Role>
  assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<void>
  assignRolesToUser(userId: string, roleIds: string[]): Promise<void>
  getUserPermissions(userId: string): Promise<Permission[]>
  hasPermission(userId: string, permissionName: string): Promise<boolean>
}

interface Permission {
  id: string
  name: string
  description: string
}

interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
}
```

### Import Components

**ExcelImportService**
```typescript
interface ExcelImportService {
  validateTemplate(file: Buffer): Promise<ValidationResult>
  parseStudentData(file: Buffer): Promise<ParsedStudentData[]>
  importStudents(data: ParsedStudentData[], sessionId: string): Promise<ImportResult>
}

interface ParsedStudentData {
  idCard: string
  fullName: string
  dateOfBirth: Date
  email: string
  phone: string
  scores: SubjectScores
  preferences: PreferenceData[]
}

interface SubjectScores {
  [subject: string]: number
}

interface PreferenceData {
  majorCode: string
  admissionMethod: string
  priority: number
}

interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

interface ValidationError {
  row: number
  field: string
  message: string
}

interface ImportResult {
  totalRecords: number
  successCount: number
  failureCount: number
  errors: ValidationError[]
}
```

**ImportValidationService**
```typescript
interface ImportValidationService {
  validateStudentRecord(record: ParsedStudentData): ValidationError[]
  checkDuplicateIdCard(idCard: string): Promise<boolean>
  validateMajorCodes(majorCodes: string[]): Promise<string[]>
  validateRequiredFields(record: ParsedStudentData): ValidationError[]
}
```

### Virtual Filter Components

**VirtualFilterService**
```typescript
interface VirtualFilterService {
  runFilter(sessionId: string): Promise<FilterResult>
  calculateScores(sessionId: string): Promise<void>
  rankApplications(sessionId: string): Promise<RankedApplication[]>
  processPreferences(rankedApps: RankedApplication[]): Promise<AdmissionDecision[]>
}

interface RankedApplication {
  applicationId: string
  studentId: string
  majorId: string
  admissionMethod: string
  priority: number
  calculatedScore: number
  rank: number
}

interface AdmissionDecision {
  applicationId: string
  studentId: string
  majorId: string
  status: 'admitted' | 'not_admitted'
  admittedPreference: number | null
}

interface FilterResult {
  sessionId: string
  totalStudents: number
  admittedCount: number
  executionTime: number
  decisions: AdmissionDecision[]
}
```

**ScoreCalculationService**
```typescript
interface ScoreCalculationService {
  calculateScore(
    scores: SubjectScores,
    priorityPoints: number,
    method: AdmissionMethod
  ): number
  getRequiredSubjects(method: AdmissionMethod): string[]
  isEligible(scores: SubjectScores, method: AdmissionMethod): boolean
}

interface AdmissionMethod {
  id: string
  name: string
  formula: string
  requiredSubjects: string[]
}
```

### Storage Components

**MinioStorageService**
```typescript
interface MinioStorageService {
  uploadFile(file: Buffer, filename: string, mimeType: string): Promise<StorageResult>
  downloadFile(fileKey: string): Promise<Buffer>
  deleteFile(fileKey: string): Promise<void>
  generatePresignedUrl(fileKey: string, expirySeconds: number): Promise<string>
}

interface StorageResult {
  fileKey: string
  bucket: string
  url: string
  size: number
}
```

### Email Components

**EmailQueueService**
```typescript
interface EmailQueueService {
  queueAdmissionEmails(decisions: AdmissionDecision[]): Promise<void>
  processEmailJob(job: EmailJob): Promise<void>
  retryFailedEmail(jobId: string): Promise<void>
  getEmailStatus(studentId: string): Promise<EmailStatus>
}

interface EmailJob {
  id: string
  studentId: string
  email: string
  templateData: AdmissionEmailData
  attempts: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

interface AdmissionEmailData {
  studentName: string
  majorName: string
  admissionMethod: string
  finalScore: number
}

interface EmailStatus {
  sent: boolean
  sentAt: Date | null
  attempts: number
  lastError: string | null
}
```

### Result Export Components

**ResultExportService**
```typescript
interface ResultExportService {
  generateResultExcel(sessionId: string): Promise<Buffer>
  formatResultData(decisions: AdmissionDecision[]): Promise<ResultRow[]>
}

interface ResultRow {
  studentId: string
  idCard: string
  fullName: string
  majorCode: string
  majorName: string
  admissionMethod: string
  finalScore: number
  preference: number
}
```

## Data Models

### Prisma Schema

The system uses Prisma ORM with the following schema structure:

**User Model**
```prisma
model User {
  id           String   @id @default(uuid())
  username     String   @unique
  passwordHash String
  email        String   @unique
  fullName     String
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  roles        UserRole[]
  posts        Post[]
  mediaFiles   MediaFile[]
  
  @@map("users")
}
```

**Permission Model**
```prisma
model Permission {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  createdAt   DateTime @default(now())
  
  roles       RolePermission[]
  
  @@map("permissions")
}
```

**Role Model**
```prisma
model Role {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  permissions RolePermission[]
  users       UserRole[]
  
  @@map("roles")
}
```

**RolePermission Model**
```prisma
model RolePermission {
  roleId       String
  permissionId String
  
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  
  @@id([roleId, permissionId])
  @@map("role_permissions")
}
```

**UserRole Model**
```prisma
model UserRole {
  userId     String
  roleId     String
  assignedAt DateTime @default(now())
  
  user       User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role       Role @relation(fields: [roleId], references: [id], onDelete: Cascade)
  
  @@id([userId, roleId])
  @@map("user_roles")
}
```

**Category Model**
```prisma
model Category {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  posts       Post[]
  
  @@map("categories")
}
```

**Post Model**
```prisma
model Post {
  id          String    @id @default(uuid())
  title       String
  slug        String    @unique
  content     String
  categoryId  String?
  status      PostStatus
  authorId    String?
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  category    Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  author      User?     @relation(fields: [authorId], references: [id], onDelete: SetNull)
  
  @@map("posts")
}

enum PostStatus {
  draft
  published
}
```

**MediaFile Model**
```prisma
model MediaFile {
  id           String   @id @default(uuid())
  filename     String
  originalName String
  mimeType     String
  sizeBytes    Int
  storagePath  String
  uploadedBy   String?
  createdAt    DateTime @default(now())
  
  uploader     User?    @relation(fields: [uploadedBy], references: [id], onDelete: SetNull)
  
  @@map("media_files")
}
```

**FAQ Model**
```prisma
model FAQ {
  id           String   @id @default(uuid())
  question     String
  answer       String
  displayOrder Int      @default(0)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@map("faqs")
}
```

**Major Model**
```prisma
model Major {
  id                  String   @id @default(uuid())
  code                String   @unique
  name                String
  subjectCombinations Json
  description         String?
  isActive            Boolean  @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  quotas              SessionQuota[]
  applications        Application[]
  
  @@map("majors")
}
```

**AdmissionSession Model**
```prisma
model AdmissionSession {
  id        String          @id @default(uuid())
  name      String
  year      Int
  startDate DateTime
  endDate   DateTime
  status    SessionStatus
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt
  
  quotas       SessionQuota[]
  applications Application[]
  
  @@map("admission_sessions")
}

enum SessionStatus {
  upcoming
  active
  closed
}
```

**SessionQuota Model**
```prisma
model SessionQuota {
  id              String   @id @default(uuid())
  sessionId       String
  majorId         String
  admissionMethod String
  quota           Int
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  session         AdmissionSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  major           Major            @relation(fields: [majorId], references: [id], onDelete: Cascade)
  
  @@unique([sessionId, majorId, admissionMethod])
  @@map("session_quotas")
}
```

**Student Model**
```prisma
model Student {
  id             String   @id @default(uuid())
  idCard         String   @unique
  fullName       String
  dateOfBirth    DateTime
  email          String?
  phone          String?
  address        String?
  priorityPoints Decimal  @default(0) @db.Decimal(5, 2)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  applications   Application[]
  notifications  EmailNotification[]
  
  @@map("students")
}
```

**Application Model**
```prisma
model Application {
  id                 String            @id @default(uuid())
  studentId          String
  sessionId          String
  majorId            String
  admissionMethod    String
  preferencePriority Int
  subjectScores      Json
  calculatedScore    Decimal?          @db.Decimal(6, 2)
  rankInMajor        Int?
  admissionStatus    AdmissionStatus
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt
  
  student            Student           @relation(fields: [studentId], references: [id], onDelete: Cascade)
  session            AdmissionSession  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  major              Major             @relation(fields: [majorId], references: [id], onDelete: Cascade)
  
  @@unique([studentId, sessionId, preferencePriority])
  @@map("applications")
}

enum AdmissionStatus {
  pending
  admitted
  not_admitted
}
```

**EmailNotification Model**
```prisma
model EmailNotification {
  id           String              @id @default(uuid())
  studentId    String
  email        String
  templateName String
  templateData Json
  status       EmailStatus
  attempts     Int                 @default(0)
  sentAt       DateTime?
  lastError    String?
  createdAt    DateTime            @default(now())
  updatedAt    DateTime            @updatedAt
  
  student      Student             @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  @@map("email_notifications")
}

enum EmailStatus {
  pending
  processing
  sent
  failed
}
```

**Settings Model**
```prisma
model Settings {
  key         String   @id
  value       Json
  description String?
  updatedAt   DateTime @updatedAt
  
  @@map("settings")
}
```

### Entity Relationships

```
users ──┬── user_roles ──── roles ──── role_permissions ──── permissions
        │
        ├── posts (author)
        └── media_files (uploader)

categories ──── posts

majors ──┬── session_quotas ──── admission_sessions
         │
         └── applications ──┬── students
                            │
                            └── admission_sessions

students ──┬── applications
           │
           └── email_notifications

admission_sessions ──┬── session_quotas
                     │
                     └── applications
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:
- Properties 2.4 and 2.5 both test permission checking and can be combined into one comprehensive property
- Properties 5.4 and 6.4 both test duplicate ID card detection and can be combined
- Properties 11.1, 11.2, and 11.3 all test referential integrity and can be combined into one comprehensive property
- Several properties about CRUD operations (3.1, 3.2, 3.7, 4.1, 4.3) follow the same pattern and can be generalized

### Authentication Properties

**Property 1: Token generation completeness**
*For any* valid user credentials, authenticating should produce an access token that is valid for 24 hours.
**Validates: Requirements 1.1**

**Property 2: Invalid token rejection**
*For any* invalid, expired, or malformed token, authentication attempts should fail with an appropriate error.
**Validates: Requirements 1.2**

### RBAC Properties

**Property 5: Role-permission assignment consistency**
*For any* set of permissions assigned to a role, querying that role should return exactly those permissions.
**Validates: Requirements 2.2**

**Property 6: User-role assignment consistency**
*For any* set of roles assigned to a user, querying that user's roles should return exactly those roles.
**Validates: Requirements 2.3**

**Property 7: Permission-based access control**
*For any* user with specific permissions, actions requiring those permissions should succeed, and actions requiring permissions the user lacks should fail with an authorization error.
**Validates: Requirements 2.4, 2.5**

### Content Management Properties

**Property 8: Entity creation round-trip**
*For any* valid entity data (category, post, FAQ), creating the entity and then retrieving it should return data equivalent to what was created.
**Validates: Requirements 3.1, 3.2, 3.7**

**Property 9: Post status constraint**
*For any* post creation or update, only status values "draft" and "published" should be accepted; any other status value should be rejected.
**Validates: Requirements 3.3**

**Property 10: Draft post exclusion**
*For any* post with status "draft", public post queries should not include that post in results.
**Validates: Requirements 3.4**

**Property 11: Media file upload round-trip**
*For any* valid image or PDF file, uploading it and then retrieving it should return a file with the same content and metadata.
**Validates: Requirements 3.5**

**Property 12: Media-post association consistency**
*For any* media file associated with a post, querying the post's media should include that file, and querying the file should reference that post.
**Validates: Requirements 3.6**

### Program Management Properties

**Property 13: Major creation round-trip**
*For any* valid major data, creating the major and then retrieving it should return data equivalent to what was created.
**Validates: Requirements 4.1**

**Property 14: Major code uniqueness**
*For any* major code, attempting to create two majors with the same code should succeed for the first and fail for the second.
**Validates: Requirements 4.2**

**Property 15: Session creation round-trip**
*For any* valid admission session data, creating the session and then retrieving it should return data equivalent to what was created.
**Validates: Requirements 4.3**

**Property 16: Quota configuration consistency**
*For any* major-session pair with a configured quota, querying that configuration should return the exact quota value that was set.
**Validates: Requirements 4.4, 4.5**

**Property 17: Quota value validation**
*For any* quota value, the system should accept positive integers and reject zero, negative numbers, and non-integers.
**Validates: Requirements 4.6**

### Excel Import Properties

**Property 18: Template structure validation**
*For any* Excel file that doesn't match the standard template structure, validation should fail with descriptive errors; for files that match, validation should pass.
**Validates: Requirements 5.2**

**Property 19: Required field validation**
*For any* student record in Excel data, records missing required fields should fail validation, and complete records should pass.
**Validates: Requirements 5.3**

**Property 20: Duplicate ID card detection**
*For any* set of student records (from Excel or manual entry) containing duplicate ID card numbers, the system should detect and reject the duplicates.
**Validates: Requirements 5.4, 6.4**

**Property 21: Major code reference validation**
*For any* major code referenced in import data, codes that don't exist in the system should fail validation, and existing codes should pass.
**Validates: Requirements 5.5**

**Property 22: Validation error reporting completeness**
*For any* invalid student record, the validation error response should include the row number, field name, and error message.
**Validates: Requirements 5.6**

**Property 23: Import data persistence**
*For any* valid Excel data that passes all validations, after import completion, querying the database should return all created student and application records with data matching the Excel input.
**Validates: Requirements 5.7**

**Property 24: Preference priority preservation**
*For any* set of preferences in Excel data, the created application records should maintain the same priority ordering (NV1 < NV2 < NV3...).
**Validates: Requirements 5.8**

### Manual Entry Properties

**Property 25: Student record validation**
*For any* student record (create or update), records missing required fields should fail validation with descriptive errors.
**Validates: Requirements 6.3**

**Property 26: Preference modification consistency**
*For any* student and preference data, after adding, editing, or removing preferences, querying the student's preferences should reflect exactly those changes.
**Validates: Requirements 6.5**

**Property 27: Preference reference validation**
*For any* preference with major code and admission method, invalid codes or methods should fail validation, and valid ones should pass.
**Validates: Requirements 6.6**

### Score Calculation Properties

**Property 28: Score calculation formula correctness**
*For any* set of subject scores, priority points, and admission method, the calculated score should equal the result of applying the method's formula to the inputs.
**Validates: Requirements 7.1, 7.2**

**Property 29: Eligibility determination**
*For any* application missing required subject scores for its admission method, the application should be marked as ineligible.
**Validates: Requirements 7.3**

**Property 30: Score persistence**
*For any* application, after score calculation, the calculated score should be stored in the database and retrievable with the application record.
**Validates: Requirements 7.4**

### Virtual Filter Properties

**Property 31: Score-based processing order**
*For any* major with multiple applications, the virtual filter should process applications in descending order of calculated score (highest score first).
**Validates: Requirements 8.1**

**Property 32: Preference cascade removal**
*For any* student admitted to preference priority N, that student should not appear in the admitted list for any preference with priority > N.
**Validates: Requirements 8.2**

**Property 33: Quota enforcement**
*For any* major with quota Q, after virtual filtering, at most Q students should be admitted to that major.
**Validates: Requirements 8.4**

**Property 34: Result list generation**
*For any* virtual filter execution, a result list should be generated containing admission decisions for all applications.
**Validates: Requirements 8.6**

**Property 35: Virtual filter idempotence**
*For any* set of applications and quotas, running the virtual filter twice on the same data should produce identical admission results.
**Validates: Requirements 8.7**

### Result Export Properties

**Property 36: Result completeness**
*For any* set of admitted students, the generated Excel file should contain exactly those students with no omissions or additions.
**Validates: Requirements 9.1**

**Property 37: Result field completeness**
*For any* admitted student in the exported Excel, their row should contain student information, admitted major, admission method, and final score.
**Validates: Requirements 9.2**

### Email Notification Properties

**Property 38: Email queue completeness**
*For any* set of admitted students, after queuing emails, there should be exactly one email job in the queue for each admitted student.
**Validates: Requirements 10.1**

**Property 39: Email job processing**
*For any* email job, processing it should result in an email being sent to the student's email address with correct admission data.
**Validates: Requirements 10.3**

**Property 40: Email retry behavior**
*For any* email that fails to send, the system should retry up to 3 times total (initial attempt + 2 retries).
**Validates: Requirements 10.4**

**Property 41: Failed email logging**
*For any* email that fails after all retry attempts, there should be a log entry or database record indicating the failure.
**Validates: Requirements 10.5**

**Property 42: Email status tracking**
*For any* email notification, querying its status should return current delivery state (pending, sent, failed) and attempt count.
**Validates: Requirements 10.6**

### Data Integrity Properties

**Property 43: Referential integrity enforcement**
*For any* entity with foreign key relationships (applications→students, applications→majors, role_permissions→roles), the referenced entities must exist, and deleting referenced entities should either cascade or be prevented based on the relationship type.
**Validates: Requirements 11.1, 11.2, 11.3, 11.4**

**Property 44: Cascade deletion consistency**
*For any* user with role assignments, deleting the user should remove all associated role assignments.
**Validates: Requirements 11.5**

### Configuration Properties

**Property 45: Configuration storage round-trip**
*For any* configuration setting, storing a value and then retrieving it should return the same value.
**Validates: Requirements 12.1, 12.2**

**Property 46: Configuration validation**
*For any* configuration setting with type and range constraints, values outside the valid range should be rejected, and values within the range should be accepted.
**Validates: Requirements 12.3**

**Property 47: Configuration defaults**
*For any* configuration key that has not been explicitly set, querying it should return the defined default value.
**Validates: Requirements 12.5**


## Error Handling

### Error Categories

**Authentication Errors (401)**
- Invalid credentials
- Expired access token
- Invalid token format

**Authorization Errors (403)**
- Missing required permission
- Insufficient role privileges
- Attempting to access another user's resources

**Validation Errors (400)**
- Missing required fields
- Invalid data format
- Constraint violations (unique, foreign key)
- Business rule violations (negative quota, duplicate ID card)

**Not Found Errors (404)**
- Entity does not exist
- Referenced entity not found

**Conflict Errors (409)**
- Duplicate unique field (major code, ID card)
- Concurrent modification conflict

**Server Errors (500)**
- Database connection failure
- External service failure (email service)
- Unexpected exceptions

### Error Response Format

All errors should follow a consistent format:

```typescript
interface ErrorResponse {
  statusCode: number
  message: string
  error: string
  timestamp: string
  path: string
  details?: ValidationError[] | Record<string, any>
}

interface ValidationError {
  field: string
  message: string
  value?: any
}
```

### Error Handling Strategies

**Database Errors**
- Wrap all database operations in try-catch blocks
- Use transactions for multi-step operations
- Rollback on any failure within a transaction
- Log database errors with full context
- Return user-friendly error messages (hide internal details)

**Excel Import Errors**
- Validate template structure before processing rows
- Collect all validation errors (don't fail on first error)
- Return detailed error report with row numbers
- Rollback entire import if any validation fails
- Log import failures with file metadata

**Virtual Filter Errors**
- Validate input data before starting filter
- Use database transactions for admission decisions
- Rollback if any step fails
- Log filter execution errors with session context
- Provide clear error messages for common issues (missing scores, invalid quotas)

**Email Sending Errors**
- Catch email service failures
- Implement retry logic with exponential backoff
- Log failed emails for manual review
- Update email status in database
- Don't block the main process on email failures

**External Service Errors**
- Implement circuit breaker pattern for external services
- Provide fallback behavior when possible
- Log external service failures
- Return appropriate error to user

## Testing Strategy

### Dual Testing Approach

The system requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
- Focus on concrete scenarios and boundary conditions
- Test integration points between components
- Verify error handling for specific failure modes
- Test edge cases like empty lists, null values, boundary values

**Property Tests**: Verify universal properties across all inputs
- Test properties that should hold for any valid input
- Use randomized input generation to explore input space
- Verify invariants and mathematical properties
- Test round-trip properties (serialize/deserialize, create/retrieve)

Both approaches are complementary and necessary. Unit tests catch specific bugs and document expected behavior, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Library Selection**: Use `fast-check` for TypeScript/NestJS property-based testing

**Test Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `// Feature: admission-management-system, Property {number}: {property_text}`

**Example Property Test Structure**:
```typescript
import * as fc from 'fast-check';

describe('Authentication Properties', () => {
  it('Property 1: Token generation completeness', async () => {
    // Feature: admission-management-system, Property 1: Token generation completeness
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string({ minLength: 3, maxLength: 50 }),
          password: fc.string({ minLength: 8, maxLength: 100 })
        }),
        async (credentials) => {
          // Create user with credentials
          const user = await createTestUser(credentials);
          
          // Authenticate
          const result = await authService.login(credentials);
          
          // Verify both tokens exist and are valid
          expect(result.accessToken).toBeDefined();
          expect(result.refreshToken).toBeDefined();
          expect(await verifyAccessToken(result.accessToken)).toBe(true);
          expect(await verifyRefreshToken(result.refreshToken)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Coverage Requirements

**Authentication Module**
- Unit tests: Login with valid/invalid credentials, token expiration
- Property tests: Properties 1-2 (token generation, rejection)

**RBAC Module**
- Unit tests: Permission checking for specific roles, role assignment edge cases
- Property tests: Properties 3-5 (role-permission consistency, user-role consistency, access control)

**CMS Module**
- Unit tests: Post creation with various statuses, media upload with different file types
- Property tests: Properties 6-10 (entity round-trip, status constraints, draft exclusion, media handling)

**Program Module**
- Unit tests: Major creation with specific subject combinations, session date validation
- Property tests: Properties 11-15 (major/session round-trip, uniqueness, quota validation)

**Import Module**
- Unit tests: Excel parsing with specific malformed data, validation error messages
- Property tests: Properties 16-22 (template validation, field validation, duplicate detection, persistence)

**Manual Entry Module**
- Unit tests: Form validation with specific invalid inputs
- Property tests: Properties 23-25 (validation, preference consistency, reference validation)

**Score Calculation Module**
- Unit tests: Score calculation with specific formulas and edge cases (missing subjects)
- Property tests: Properties 26-28 (formula correctness, eligibility, persistence)

**Virtual Filter Module**
- Unit tests: Filter with specific scenarios (tied scores, exact quota match)
- Property tests: Properties 29-33 (processing order, cascade removal, quota enforcement, idempotence)

**Result Export Module**
- Unit tests: Excel generation with specific data sets
- Property tests: Properties 34-35 (result completeness, field completeness)

**Email Module**
- Unit tests: Email sending with specific failure scenarios, retry logic
- Property tests: Properties 36-40 (queue completeness, processing, retry, logging, status tracking)

**Data Integrity**
- Unit tests: Specific referential integrity scenarios, cascade deletion cases
- Property tests: Properties 41-42 (referential integrity, cascade consistency)

**Configuration Module**
- Unit tests: Configuration updates with specific values, default value retrieval
- Property tests: Properties 43-45 (storage round-trip, validation, defaults)

### Integration Testing

**End-to-End Workflows**:
1. Complete admission cycle: Import students → Calculate scores → Run filter → Export results → Send emails
2. RBAC workflow: Create role → Assign permissions → Assign to user → Verify access
3. Content workflow: Create category → Create post → Upload media → Publish → Verify public access

**Database Integration**:
- Test with actual PostgreSQL database (use test containers)
- Verify transaction rollback behavior
- Test concurrent access scenarios
- Verify referential integrity constraints

**Queue Integration**:
- Test BullMQ job processing
- Verify retry behavior
- Test job failure handling
- Verify queue cleanup

### Performance Testing

**Load Testing Scenarios**:
- Excel import with 10,000 student records
- Virtual filter with 50,000 applications across 100 majors
- Email queue processing with 10,000 notifications
- Concurrent API requests (100 simultaneous users)

**Performance Targets**:
- Excel import: < 60 seconds for 10,000 records
- Virtual filter: < 120 seconds for 50,000 applications
- Result export: < 30 seconds for 10,000 students
- API response time: < 200ms for 95th percentile

### Test Data Generation

**Generators for Property Tests**:
```typescript
// User credentials generator
const credentialsArb = fc.record({
  username: fc.string({ minLength: 3, maxLength: 50 }),
  password: fc.string({ minLength: 8, maxLength: 100 })
});

// Student record generator
const studentArb = fc.record({
  idCard: fc.string({ minLength: 9, maxLength: 12 }),
  fullName: fc.fullUnicodeString({ minLength: 5, maxLength: 100 }),
  dateOfBirth: fc.date({ min: new Date('1990-01-01'), max: new Date('2010-12-31') }),
  email: fc.emailAddress(),
  phone: fc.string({ minLength: 10, maxLength: 15 }),
  priorityPoints: fc.float({ min: 0, max: 3, noNaN: true })
});

// Subject scores generator
const subjectScoresArb = fc.record({
  math: fc.float({ min: 0, max: 10, noNaN: true }),
  physics: fc.float({ min: 0, max: 10, noNaN: true }),
  chemistry: fc.float({ min: 0, max: 10, noNaN: true }),
  literature: fc.float({ min: 0, max: 10, noNaN: true }),
  english: fc.float({ min: 0, max: 10, noNaN: true })
});

// Application generator
const applicationArb = fc.record({
  studentId: fc.uuid(),
  majorId: fc.uuid(),
  admissionMethod: fc.constantFrom('entrance_exam', 'high_school_transcript', 'direct_admission'),
  priority: fc.integer({ min: 1, max: 5 }),
  subjectScores: subjectScoresArb
});
```

### Continuous Integration

**CI Pipeline Steps**:
1. Lint code (ESLint)
2. Type check (TypeScript)
3. Run unit tests
4. Run property tests (100 iterations each)
5. Run integration tests
6. Generate coverage report (target: 80% coverage)
7. Build Docker image
8. Run security scan

**Test Execution Strategy**:
- Run unit tests on every commit
- Run property tests on every pull request
- Run integration tests on merge to main
- Run performance tests weekly
- Run full test suite before release
