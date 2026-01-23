import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  details?: ValidationError[] | Record<string, any>;
}

interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);

    // Log error with context
    this.logError(exception, request, errorResponse);

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(
    exception: unknown,
    request: Request,
  ): ErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.url;

    // Handle NestJS HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        return {
          statusCode: status,
          message: responseObj.message || exception.message,
          error: responseObj.error || HttpStatus[status],
          timestamp,
          path,
          details: responseObj.details || responseObj.message,
        };
      }

      return {
        statusCode: status,
        message: exception.message,
        error: HttpStatus[status],
        timestamp,
        path,
      };
    }

    // Handle Prisma errors
    if (this.isPrismaError(exception)) {
      return this.handlePrismaError(exception as any, timestamp, path);
    }

    // Handle validation errors from class-validator
    if (this.isValidationError(exception)) {
      return this.handleValidationError(exception as any, timestamp, path);
    }

    // Handle unknown errors
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
      timestamp,
      path,
    };
  }

  private isPrismaError(exception: unknown): boolean {
    return (
      exception instanceof Prisma.PrismaClientKnownRequestError ||
      exception instanceof Prisma.PrismaClientValidationError ||
      exception instanceof Prisma.PrismaClientUnknownRequestError
    );
  }

  private isValidationError(exception: unknown): boolean {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'name' in exception &&
      exception.name === 'ValidationError'
    );
  }

  private handlePrismaError(
    exception: any,
    timestamp: string,
    path: string,
  ): ErrorResponse {
    // Handle known Prisma errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          // Unique constraint violation
          const target = exception.meta?.target as string[] | undefined;
          const field = target ? target[0] : 'field';
          return {
            statusCode: HttpStatus.CONFLICT,
            message: `A record with this ${field} already exists`,
            error: 'Conflict',
            timestamp,
            path,
            details: {
              field,
              constraint: 'unique',
            },
          };

        case 'P2003':
          // Foreign key constraint violation
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Referenced record does not exist',
            error: 'Bad Request',
            timestamp,
            path,
            details: {
              constraint: 'foreign_key',
            },
          };

        case 'P2025':
          // Record not found
          return {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Record not found',
            error: 'Not Found',
            timestamp,
            path,
          };

        case 'P2014':
          // Required relation violation
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Cannot delete record due to existing relationships',
            error: 'Bad Request',
            timestamp,
            path,
            details: {
              constraint: 'referential_integrity',
            },
          };

        default:
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Database operation failed',
            error: 'Bad Request',
            timestamp,
            path,
          };
      }
    }

    // Handle validation errors
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid data provided',
        error: 'Bad Request',
        timestamp,
        path,
      };
    }

    // Handle unknown Prisma errors
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Database error occurred',
      error: 'Internal Server Error',
      timestamp,
      path,
    };
  }

  private handleValidationError(
    exception: any,
    timestamp: string,
    path: string,
  ): ErrorResponse {
    const validationErrors: ValidationError[] = [];

    if (exception.errors && Array.isArray(exception.errors)) {
      exception.errors.forEach((error: any) => {
        validationErrors.push({
          field: error.property || 'unknown',
          message: error.message || 'Validation failed',
          value: error.value,
        });
      });
    }

    return {
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Validation failed',
      error: 'Bad Request',
      timestamp,
      path,
      details: validationErrors,
    };
  }

  private logError(
    exception: unknown,
    request: Request,
    errorResponse: ErrorResponse,
  ) {
    const user = (request as any).user;
    const userId = user?.id || 'anonymous';

    const logContext = {
      statusCode: errorResponse.statusCode,
      path: request.url,
      method: request.method,
      userId,
      timestamp: errorResponse.timestamp,
    };

    if (errorResponse.statusCode >= 500 || this.isPrismaError(exception)) {
      // Log server errors or database errors with full stack trace
      this.logger.error(
        `${request.method} ${request.url} - ${errorResponse.message}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
        JSON.stringify(logContext),
      );
    } else if (errorResponse.statusCode >= 400) {
      // Log client errors without stack trace
      this.logger.warn(
        `${request.method} ${request.url} - ${errorResponse.message}`,
        JSON.stringify(logContext),
      );
    }
  }
}
