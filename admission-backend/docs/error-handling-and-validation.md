# Error Handling and Validation Documentation

## Overview

This document describes the error handling and validation infrastructure implemented for the Admission Management System.

## Components

### 1. Global Exception Filter

**Location**: `src/common/filters/http-exception.filter.ts`

The global exception filter provides consistent error responses across the entire application.

**Features**:
- Handles all types of exceptions (HTTP, Prisma, validation, unknown)
- Provides consistent error response format
- Logs errors with appropriate severity levels
- Includes request context in error logs

**Error Response Format**:
```typescript
interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  details?: ValidationError[] | Record<string, any>;
}
```

**Supported Error Types**:
- **HTTP Exceptions** (400, 401, 403, 404, 409, 500, etc.)
- **Prisma Errors**:
  - P2002: Unique constraint violation → 409 Conflict
  - P2003: Foreign key constraint violation → 400 Bad Request
  - P2025: Record not found → 404 Not Found
  - P2014: Referential integrity violation → 400 Bad Request
- **Validation Errors**: Collected from class-validator
- **Unknown Errors**: Handled as 500 Internal Server Error

**Usage**:
The filter is automatically applied globally in `main.ts`:
```typescript
app.useGlobalFilters(new HttpExceptionFilter());
```

### 2. Validation Pipes

**Location**: `src/main.ts`

Global validation pipe configuration using class-validator.

**Configuration**:
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // Strip properties not in DTO
    forbidNonWhitelisted: true,   // Throw error for unknown properties
    transform: true,              // Auto-transform payloads to DTO instances
    transformOptions: {
      enableImplicitConversion: true, // Convert string numbers to numbers
    },
    stopAtFirstError: false,      // Collect all validation errors
  }),
);
```

**Features**:
- Automatic DTO validation on all endpoints
- Type transformation (string to number, etc.)
- Whitelist filtering (removes extra properties)
- Comprehensive error collection

### 3. Custom Validators

**Location**: `src/common/validators/`

Custom validation decorators for domain-specific validation.

#### IsIdCard
Validates Vietnamese ID card numbers (9-12 alphanumeric characters).

**Usage**:
```typescript
@IsIdCard()
idCard: string;
```

#### IsPhoneNumber
Validates Vietnamese phone numbers (10-11 digits starting with 0).

**Usage**:
```typescript
@IsPhoneNumber()
phone: string;
```

#### IsScore
Validates academic scores (0-10 range for Vietnamese grading system).

**Usage**:
```typescript
@IsScore()
score: number;
```

#### IsMajorCode
Validates major codes (2-10 uppercase alphanumeric characters).

**Usage**:
```typescript
@IsMajorCode()
majorCode: string;
```

### 4. Request Logging Middleware

**Location**: `src/common/middleware/logger.middleware.ts`

Logs all incoming HTTP requests and their responses.

**Features**:
- Logs request method, URL, user, IP, and user agent
- Logs response status, time, and content length
- Different log levels based on status code:
  - 2xx: INFO
  - 4xx: WARN
  - 5xx: ERROR
- Includes authenticated user information when available

**Log Format**:
```
Incoming: GET /api/students - User: admin (user-123) - IP: 127.0.0.1 - UA: Mozilla/5.0...
Completed: GET /api/students - Status: 200 - 45ms - 2048 bytes - User: admin
```

**Usage**:
The middleware is automatically applied to all routes in `app.module.ts`:
```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
```

## Error Handling Best Practices

### 1. Controller Level
Controllers should throw appropriate HTTP exceptions:
```typescript
if (!user) {
  throw new NotFoundException('User not found');
}

if (user.id !== requestUserId) {
  throw new ForbiddenException('Cannot access another user\'s data');
}
```

### 2. Service Level
Services should throw business logic exceptions:
```typescript
if (duplicateIdCard) {
  throw new ConflictException('ID card already exists');
}

if (!validMajorCode) {
  throw new BadRequestException('Invalid major code');
}
```

### 3. Database Operations
Prisma errors are automatically handled by the exception filter:
```typescript
try {
  await this.prisma.student.create({ data });
} catch (error) {
  // Exception filter will handle Prisma errors
  throw error;
}
```

### 4. Validation
Use DTOs with class-validator decorators:
```typescript
export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  @IsIdCard()
  idCard: string;

  @IsString()
  @MinLength(1)
  fullName: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber()
  phone: string;
}
```

## Testing

All components have comprehensive unit tests:
- `http-exception.filter.spec.ts`: 13 tests
- `custom-validators.spec.ts`: 25 tests
- `validation-pipe.spec.ts`: 8 tests
- `logger.middleware.spec.ts`: 10 tests

**Total**: 56 tests, all passing

## Integration

The error handling and validation infrastructure is fully integrated:
1. Exception filter catches all errors
2. Validation pipe validates all incoming requests
3. Logger middleware logs all requests and responses
4. Custom validators provide domain-specific validation

This ensures consistent error handling, comprehensive validation, and complete request logging across the entire application.
