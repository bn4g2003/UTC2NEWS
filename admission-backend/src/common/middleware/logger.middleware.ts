import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    // Get user info if available (after authentication)
    const user = (req as any).user;
    const userId = user?.id || 'anonymous';
    const username = user?.username || 'anonymous';

    // Log incoming request
    this.logger.log(
      `Incoming: ${method} ${originalUrl} - User: ${username} (${userId}) - IP: ${ip} - UA: ${userAgent}`,
    );

    // Capture response
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length') || 0;
      const responseTime = Date.now() - startTime;

      const logMessage = `Completed: ${method} ${originalUrl} - Status: ${statusCode} - ${responseTime}ms - ${contentLength} bytes - User: ${username}`;

      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  }
}
