import { LoggerMiddleware } from './logger.middleware';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';

describe('LoggerMiddleware', () => {
  let middleware: LoggerMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let loggerLogSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    middleware = new LoggerMiddleware();

    mockRequest = {
      method: 'GET',
      originalUrl: '/test',
      ip: '127.0.0.1',
      get: jest.fn((header: string) => {
        if (header === 'user-agent') {
          return 'test-agent';
        }
        return undefined;
      }),
    };

    const listeners: { [key: string]: Function[] } = {};

    mockResponse = {
      statusCode: 200,
      get: jest.fn((header: string) => {
        if (header === 'content-length') {
          return '1024';
        }
        return undefined;
      }),
      on: jest.fn((event: string, callback: Function) => {
        if (!listeners[event]) {
          listeners[event] = [];
        }
        listeners[event].push(callback);
        return mockResponse as Response;
      }),
    };

    // Add trigger method to simulate events
    (mockResponse as any).trigger = (event: string) => {
      if (listeners[event]) {
        listeners[event].forEach(callback => callback());
      }
    };

    mockNext = jest.fn();

    loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should log incoming request', () => {
    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Incoming: GET /test'),
    );
    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('User: anonymous'),
    );
    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('IP: 127.0.0.1'),
    );
  });

  it('should call next middleware', () => {
    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalled();
  });

  it('should log successful response (2xx)', () => {
    mockResponse.statusCode = 200;

    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    // Trigger finish event
    (mockResponse as any).trigger('finish');

    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Completed: GET /test'),
    );
    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Status: 200'),
    );
  });

  it('should log client error response (4xx) as warning', () => {
    mockResponse.statusCode = 404;

    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    // Trigger finish event
    (mockResponse as any).trigger('finish');

    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Completed: GET /test'),
    );
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Status: 404'),
    );
  });

  it('should log server error response (5xx) as error', () => {
    mockResponse.statusCode = 500;

    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    // Trigger finish event
    (mockResponse as any).trigger('finish');

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Completed: GET /test'),
    );
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Status: 500'),
    );
  });

  it('should log authenticated user information', () => {
    (mockRequest as any).user = {
      id: 'user-123',
      username: 'testuser',
    };

    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('User: testuser (user-123)'),
    );
  });

  it('should log response time', () => {
    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    // Trigger finish event after a delay
    setTimeout(() => {
      (mockResponse as any).trigger('finish');
    }, 10);

    // Wait for the timeout
    return new Promise(resolve => {
      setTimeout(() => {
        expect(loggerLogSpy).toHaveBeenCalledWith(
          expect.stringMatching(/\d+ms/),
        );
        resolve(undefined);
      }, 20);
    });
  });

  it('should log content length', () => {
    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    (mockResponse as any).trigger('finish');

    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('1024 bytes'),
    );
  });

  it('should handle missing user-agent', () => {
    mockRequest.get = jest.fn(() => undefined);

    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Incoming: GET /test'),
    );
  });

  it('should handle missing content-length', () => {
    mockResponse.get = jest.fn(() => undefined);

    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    (mockResponse as any).trigger('finish');

    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('0 bytes'),
    );
  });
});
