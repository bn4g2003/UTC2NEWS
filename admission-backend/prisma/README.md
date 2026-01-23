# Database Seeding

This directory contains database seeding scripts for the Admission Management System.

## Seed Scripts

### 1. Production Seed (`seed.ts`)

Creates essential data required for the system to function:

- **29 default permissions** covering all system operations
- **Admin role** with all permissions assigned
- **Initial admin user** with credentials
- **Admin role assignment** to the admin user

**Usage:**
```bash
npm run prisma:seed
```

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123456` (or set via `ADMIN_PASSWORD` environment variable)
- Email: `admin@admission.edu.vn`

**Important:** Change the admin password after first login in production!

### 2. Development Seed (`seed-dev.ts`)

Creates sample data for development and testing:

- **5 sample majors:**
  - CS01 - Computer Science
  - EE01 - Electrical Engineering
  - ME01 - Mechanical Engineering
  - BA01 - Business Administration
  - EN01 - English Language

- **1 admission session** for the current year (Round 1)

- **15 quotas** (3 admission methods × 5 majors):
  - Entrance Exam: 50 students per major
  - High School Transcript: 30 students per major
  - Direct Admission: 10 students per major

**Usage:**
```bash
npm run prisma:seed:dev
```

## Setup Instructions

### First Time Setup

1. Ensure Docker containers are running:
   ```bash
   docker-compose up -d
   ```

2. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```

3. Seed production data (admin user, permissions, roles):
   ```bash
   npm run prisma:seed
   ```

4. (Optional) Seed development data (sample majors, sessions, quotas):
   ```bash
   npm run prisma:seed:dev
   ```

### Reset Database

To reset the database and re-seed:

```bash
# Reset database (WARNING: This deletes all data!)
npx prisma migrate reset

# This will automatically run the production seed (seed.ts)
# Then optionally run the development seed:
npm run prisma:seed:dev
```

## Permissions List

The following permissions are created by the production seed:

**Major Management:**
- `create_major` - Create new academic majors
- `edit_major` - Edit existing majors
- `delete_major` - Delete majors
- `view_major` - View major information

**Session Management:**
- `create_session` - Create admission sessions
- `edit_session` - Edit admission sessions
- `delete_session` - Delete admission sessions
- `view_session` - View admission sessions
- `configure_quota` - Configure admission quotas

**Student Management:**
- `import_student` - Import student data from Excel
- `create_student` - Create individual student records
- `edit_student` - Edit student records
- `delete_student` - Delete student records
- `view_student` - View student information

**Admission Processing:**
- `run_filter` - Run virtual filtering algorithm
- `export_results` - Export admission results

**Email Notifications:**
- `send_emails` - Send email notifications
- `view_email_status` - View email delivery status

**Content Management:**
- `create_content` - Create CMS content (posts, FAQs)
- `edit_content` - Edit CMS content
- `delete_content` - Delete CMS content
- `publish_content` - Publish CMS content
- `upload_media` - Upload media files

**User & Role Management:**
- `manage_roles` - Create and manage roles
- `manage_permissions` - Assign permissions to roles
- `manage_users` - Create and manage user accounts
- `assign_roles` - Assign roles to users

**System Configuration:**
- `manage_settings` - Manage system configuration
- `view_reports` - View system reports and analytics

## Customization

### Changing Admin Password

Set the `ADMIN_PASSWORD` environment variable before running the seed:

```bash
# Windows CMD
set ADMIN_PASSWORD=your_secure_password
npm run prisma:seed

# Windows PowerShell
$env:ADMIN_PASSWORD="your_secure_password"
npm run prisma:seed

# Linux/Mac
ADMIN_PASSWORD=your_secure_password npm run prisma:seed
```

### Adding More Sample Data

Edit `seed-dev.ts` to add more sample majors, sessions, or quotas as needed for your development environment.

## Notes

- Both seed scripts use `upsert` operations, so they can be run multiple times safely
- The production seed creates an admin user with username `admin` - this is idempotent
- The development seed uses a fixed UUID for the admission session to ensure consistency
- All seed operations are wrapped in transactions for data integrity
