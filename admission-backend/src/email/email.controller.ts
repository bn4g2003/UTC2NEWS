import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { EmailQueueService } from './email-queue.service';

@ApiTags('Email')
@ApiBearerAuth('JWT-auth')
@Controller('email')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmailController {
  constructor(private emailQueueService: EmailQueueService) {}

  @Post('sessions/:id/send-results')
  @RequirePermissions('emails:send')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ 
    summary: 'Send admission result emails', 
    description: 'Queue email notifications for all admitted students in a session. Emails are processed asynchronously in the background with automatic retry on failure.' 
  })
  @ApiParam({ name: 'id', description: 'Admission session ID' })
  @ApiResponse({ 
    status: 202, 
    description: 'Emails queued successfully for background processing',
    schema: {
      properties: {
        message: { type: 'string', example: 'Admission result emails have been queued for processing' },
        sessionId: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Forbidden - requires emails:send permission' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async sendAdmissionResults(@Param('id') sessionId: string): Promise<{
    message: string;
    sessionId: string;
  }> {
    // Queue emails for all admitted students
    await this.emailQueueService.queueAdmissionEmails(sessionId);

    return {
      message: 'Admission result emails have been queued for processing',
      sessionId,
    };
  }

  @Get('students/:studentId/status')
  @RequirePermissions('emails:read')
  @ApiOperation({ 
    summary: 'Get email delivery status', 
    description: 'Check the delivery status of admission result email for a specific student' 
  })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Email status retrieved successfully',
    schema: {
      properties: {
        sent: { type: 'boolean', example: true },
        sentAt: { type: 'string', format: 'date-time', nullable: true },
        attempts: { type: 'number', example: 1 },
        lastError: { type: 'string', nullable: true },
        status: { type: 'string', enum: ['pending', 'processing', 'sent', 'failed'] }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Forbidden - requires emails:read permission' })
  @ApiResponse({ status: 404, description: 'No email notification found for student' })
  async getEmailStatus(@Param('studentId') studentId: string): Promise<{
    sent: boolean;
    sentAt: Date | null;
    attempts: number;
    lastError: string | null;
    status: string;
  }> {
    const status = await this.emailQueueService.getEmailStatus(studentId);

    if (!status) {
      throw new NotFoundException(
        `No email notification found for student ${studentId}`,
      );
    }

    return status;
  }

  @Get('sessions/:id/recipient-count')
  @RequirePermissions('emails:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get recipient count for email', 
    description: 'Get the count of students who will receive emails based on filters' 
  })
  @ApiParam({ name: 'id', description: 'Admission session ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Recipient count retrieved successfully',
    schema: {
      properties: {
        count: { type: 'number', example: 11 },
        admitted: { type: 'number', example: 8 },
        notAdmitted: { type: 'number', example: 3 },
        sessionId: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Forbidden - requires emails:read permission' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getRecipientCount(@Param('id') sessionId: string): Promise<{
    count: number;
    admitted: number;
    notAdmitted: number;
    sessionId: string;
  }> {
    const counts = await this.emailQueueService.getRecipientCount(sessionId);

    return {
      ...counts,
      sessionId,
    };
  }
}
