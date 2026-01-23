import { HttpExceptionFilter } from './http-exception.filter';
import {
  HttpException,
  HttpStatus,
  ArgumentsHost,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockResponse: any;
  let mockRequest: any;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/test-path',
      method: 'GET',
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any;
  });

  describe('HttpException handling', () => {
    it('should handle BadRequestException', () => {
      const exception = new BadRequestException('Invalid input');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid input',
          error: 'Bad Request',
          path: '/test-path',
        }),
      );
    });

    it('should handle NotFoundException', () => {
      const exception = new NotFoundException('Resource not found');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Resource not found',
          error: 'Not Found',
        }),
      );
    });

    it('should handle UnauthorizedException', () => {
      const exception = new UnauthorizedException('Invalid token');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.UNAUTHORIZED,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
          error: 'Unauthorized',
        }),
      );
    });

    it('should handle ForbiddenException', () => {
      const exception = new ForbiddenException('Insufficient permissions');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Insufficient permissions',
          error: 'Forbidden',
        }),
      );
    });

    it('should handle ConflictException', () => {
      const exception = new ConflictException('Duplicate entry');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.CONFLICT,
          message: 'Duplicate entry',
          error: 'Conflict',
        }),
      );
    });
  });

  describe('Prisma error handling', () => {
    it('should handle P2002 unique constraint violation', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['email'] },
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.CONFLICT,
          message: 'A record with this email already exists',
          error: 'Conflict',
          details: {
            field: 'email',
            constraint: 'unique',
          },
        }),
      );
    });

    it('should handle P2003 foreign key constraint violation', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '5.0.0',
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.BAD_REQUEST,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Referenced record does not exist',
          error: 'Bad Request',
          details: {
            constraint: 'foreign_key',
          },
        }),
      );
    });

    it('should handle P2025 record not found', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '5.0.0',
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          error: 'Not Found',
        }),
      );
    });

    it('should handle P2014 referential integrity violation', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Required relation violation',
        {
          code: 'P2014',
          clientVersion: '5.0.0',
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.BAD_REQUEST,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Cannot delete record due to existing relationships',
          error: 'Bad Request',
          details: {
            constraint: 'referential_integrity',
          },
        }),
      );
    });

    it('should handle PrismaClientValidationError', () => {
      const exception = new Prisma.PrismaClientValidationError(
        'Invalid data',
        { clientVersion: '5.0.0' },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.BAD_REQUEST,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid data provided',
          error: 'Bad Request',
        }),
      );
    });
  });

  describe('Unknown error handling', () => {
    it('should handle unknown errors as internal server error', () => {
      const exception = new Error('Something went wrong');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          error: 'Internal Server Error',
        }),
      );
    });
  });

  describe('Error response format', () => {
    it('should include timestamp in error response', () => {
      const exception = new BadRequestException('Test error');

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.timestamp).toBeDefined();
      expect(new Date(response.timestamp).getTime()).not.toBeNaN();
    });

    it('should include request path in error response', () => {
      const exception = new BadRequestException('Test error');

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.path).toBe('/test-path');
    });
  });
});
