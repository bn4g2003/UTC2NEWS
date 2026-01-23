# Admission Management System

A comprehensive NestJS-based backend application for managing large-scale student admissions with dynamic role-based access control, Excel data import, virtual filtering algorithms, and automated result notifications.

## Features

- **JWT Authentication**: Secure authentication with 24-hour access tokens
- **Dynamic RBAC**: Role-based access control with flexible permission management
- **Content Management**: Posts, categories, FAQs, and media file management
- **Program Management**: Academic majors, admission sessions, and quota configuration
- **Excel Import**: Bulk student data import with comprehensive validation
- **Manual Entry**: Individual student record management
- **Score Calculation**: Automated score calculation with multiple admission methods
- **Virtual Filtering**: Intelligent admission processing algorithm with preference handling
- **Result Export**: Excel export of admission results
- **Email Notifications**: Automated email notifications with retry logic
- **File Storage**: MinIO integration for media files and documents

## Prerequisites

- **Node.js** v18 or higher
- **Docker** and **Docker Compose**
- **npm** or **yarn**

## Quick Start

### 1. Clone and Install

```bash
# Install dependencies
npm install
```

### 2. Start Infrastructure Services

Start PostgreSQL, Redis, and MinIO using Docker Compose:

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** (port 5432): Main database
- **Redis** (port 6379): Job queue for BullMQ
- **MinIO** (port 9000): S3-compatible object storage
- **MinIO Console** (port 9001): Web UI for MinIO

### 3. Configure Environment Variables

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

**Key Environment Variables:**

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/admission_db"

# JWT
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="24h"

# MinIO
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="admission-files"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM="noreply@admission.edu.vn"

# Application
PORT=3000
NODE_ENV="development"
```

### 4. Run Database Migrations

Create the database schema:

```bash
npm run prisma:migrate
```

This creates all tables, relationships, and constraints defined in `prisma/schema.prisma`.

### 5. Seed the Database

**Production Seed** (required - creates admin user and permissions):

```bash
npm run prisma:seed
```

This creates:
- 29 default permissions (create_major, import_student, run_filter, etc.)
- Admin role with all permissions
- Initial admin user
- Role assignments

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123456`
- Email: `admin@admission.edu.vn`

⚠️ **Security Warning:** Change the admin password immediately after first login in production!

**Development Seed** (optional - creates sample data):

```bash
npm run prisma:seed:dev
```

This creates:
- 5 sample majors (Computer Science, Electrical Engineering, etc.)
- 1 admission session for the current year
- 15 quota configurations (3 admission methods × 5 majors)

### 6. Start the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run start:prod
```

The API will be available at `http://localhost:3000`

### 7. Access API Documentation

Open your browser and navigate to:

**Swagger UI:** `http://localhost:3000/api/docs`

The interactive API documentation provides:
- Complete endpoint reference
- Request/response schemas
- Authentication testing
- Try-it-out functionality

## Project Structure

```
admission-backend/
├── prisma/
│   ├── schema.prisma           # Database schema definition
│   ├── seed.ts                 # Production seed (admin, roles, permissions)
│   ├── seed-dev.ts             # Development seed (sample data)
│   ├── verify-seed.ts          # Seed verification script
│   └── migrations/             # Database migration history
├── src/
│   ├── auth/                   # JWT authentication
│   │   ├── guards/             # JWT auth guard
│   │   ├── strategies/         # Passport JWT strategy
│   │   └── dto/                # Login DTOs
│   ├── rbac/                   # Role-based access control
│   │   ├── guards/             # Permission guard
│   │   ├── decorators/         # @RequirePermissions decorator
│   │   └── dto/                # RBAC DTOs
│   ├── cms/                    # Content management
│   │   └── dto/                # Category, Post, FAQ DTOs
│   ├── program/                # Major and session management
│   │   └── dto/                # Major, Session, Quota DTOs
│   ├── import/                 # Excel import
│   │   ├── excel-import.service.ts
│   │   ├── import-validation.service.ts
│   │   └── dto/                # Import result DTOs
│   ├── student/                # Manual student entry
│   │   └── dto/                # Student, Preference DTOs
│   ├── score/                  # Score calculation
│   │   └── score-calculation.service.ts
│   ├── filter/                 # Virtual filtering algorithm
│   │   ├── virtual-filter.service.ts
│   │   └── dto/                # Filter result DTOs
│   ├── result/                 # Result export
│   │   └── result-export.service.ts
│   ├── email/                  # Email notifications
│   │   ├── email-queue.service.ts
│   │   ├── email.processor.ts
│   │   └── email.service.ts
│   ├── config/                 # System configuration
│   │   └── dto/                # Settings DTOs
│   ├── storage/                # MinIO file storage
│   │   └── minio-storage.service.ts
│   ├── prisma/                 # Prisma ORM service
│   │   └── prisma.service.ts
│   ├── common/                 # Shared utilities
│   │   ├── filters/            # Exception filters
│   │   ├── middleware/         # Logger middleware
│   │   ├── pipes/              # Validation pipes
│   │   └── validators/         # Custom validators
│   └── main.ts                 # Application entry point
├── test/                       # E2E tests
│   ├── auth.e2e-spec.ts
│   └── rbac.e2e-spec.ts
├── docker-compose.yml          # Infrastructure services
├── .env.example                # Environment variables template
└── README.md                   # This file
```

## Database Management

### Prisma Commands

```bash
# Generate Prisma Client (auto-runs after npm install)
npm run prisma:generate

# Create a new migration
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Seed production data
npm run prisma:seed

# Seed development data
npm run prisma:seed:dev

# Reset database (WARNING: Deletes all data!)
npx prisma migrate reset
```

### Database Schema

The system uses the following main entities:

- **User**: System users with authentication
- **Permission**: Atomic actions (create_major, import_student, etc.)
- **Role**: Named collections of permissions
- **UserRole**: User-role assignments
- **RolePermission**: Role-permission assignments
- **Category**: Content categories
- **Post**: Content posts (draft/published)
- **FAQ**: Frequently asked questions
- **MediaFile**: Uploaded files (images, PDFs)
- **Major**: Academic programs
- **AdmissionSession**: Time-bound admission periods
- **SessionQuota**: Admission quotas per major/method
- **Student**: Student records
- **Application**: Student preferences and applications
- **EmailNotification**: Email delivery tracking
- **Settings**: System configuration

For detailed schema information, see `prisma/schema.prisma`.

## API Endpoints Overview

### Authentication
- `POST /auth/login` - User login (returns JWT token)

### RBAC
- `POST /permissions` - Create permission
- `POST /roles` - Create role
- `POST /roles/:id/permissions` - Assign permissions to role
- `POST /users/:id/roles` - Assign roles to user
- `GET /users/:id/permissions` - Get user permissions

### CMS
- `GET/POST/PUT/DELETE /cms/categories` - Category management
- `GET/POST/PUT/DELETE /cms/posts` - Post management
- `GET/POST/PUT/DELETE /cms/faqs` - FAQ management
- `POST /cms/media` - Upload media files

### Programs
- `GET/POST/PUT/DELETE /program/majors` - Major management
- `GET/POST/PUT/DELETE /program/sessions` - Session management
- `GET/POST/PUT/DELETE /program/quotas` - Quota management

### Import
- `POST /import/students` - Import students from Excel

### Students
- `GET/POST/PUT /students` - Student management
- `POST/PUT/DELETE /students/:id/preferences` - Preference management

### Filter
- `POST /sessions/:id/run-filter` - Run virtual filter algorithm

### Results
- `GET /sessions/:id/results/export` - Export results to Excel

### Email
- `POST /sessions/:id/send-results` - Queue admission result emails
- `GET /emails/:studentId/status` - Check email delivery status

### Configuration
- `GET /settings` - Get all settings
- `GET /settings/:key` - Get specific setting
- `PUT /settings/:key` - Update setting

For complete API documentation with request/response schemas, visit the Swagger UI at `/api/docs`.

## Testing

```bash
# Run unit tests
npm run test

# Run unit tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Generate test coverage report
npm run test:cov
```

## Development Workflow

### 1. Create a New Feature

```bash
# Generate a new module
nest g module feature-name

# Generate a controller
nest g controller feature-name

# Generate a service
nest g service feature-name
```

### 2. Update Database Schema

```bash
# Edit prisma/schema.prisma
# Then create a migration
npm run prisma:migrate
```

### 3. Test Your Changes

```bash
# Run tests
npm run test

# Start dev server
npm run start:dev
```

## Common Tasks

### Import Student Data

1. Prepare Excel file using the template (see `docs/excel-template.xlsx`)
2. Login and get JWT token
3. POST to `/import/students` with file and sessionId
4. Review import results and validation errors

### Run Admission Filter

1. Ensure students are imported and scores calculated
2. Configure quotas for the session
3. POST to `/sessions/:id/run-filter`
4. Review admission decisions

### Export Results

1. After running filter
2. GET `/sessions/:id/results/export`
3. Download Excel file with admitted students

### Send Email Notifications

1. Configure SMTP settings in `.env`
2. POST to `/sessions/:id/send-results`
3. Check email status with GET `/emails/:studentId/status`

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps

# Restart database
docker-compose restart postgres

# Check database logs
docker-compose logs postgres
```

### Migration Issues

```bash
# Reset database (WARNING: Deletes all data!)
npx prisma migrate reset

# Regenerate Prisma Client
npm run prisma:generate
```

### MinIO Connection Issues

```bash
# Check MinIO status
docker-compose logs minio

# Access MinIO Console
# Open http://localhost:9001
# Login: minioadmin / minioadmin
```

### Redis Connection Issues

```bash
# Check Redis status
docker-compose logs redis

# Test Redis connection
docker exec -it admission-backend-redis-1 redis-cli ping
```

## Production Deployment

### Environment Configuration

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure production database URL
4. Set up production SMTP credentials
5. Change default admin password

### Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT secret
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable helmet middleware
- [ ] Configure CSP headers
- [ ] Set up monitoring and logging
- [ ] Regular database backups
- [ ] Keep dependencies updated

### Docker Deployment

```bash
# Build production image
docker build -t admission-backend .

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation at `/api/docs`
