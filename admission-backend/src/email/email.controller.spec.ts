import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailQueueService } from './email-queue.service';
import { EmailStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';

describe('EmailController', () => {
  let controller: EmailController;
  let emailQueueService: EmailQueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [
        {
          provide: EmailQueueService,
          useValue: {
            queueAdmissionEmails: jest.fn(),
            getEmailStatus: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<EmailController>(EmailController);
    emailQueueService = module.get<EmailQueueService>(EmailQueueService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendAdmissionResults', () => {
    it('should queue admission result emails', async () => {
      const sessionId = 'session-123';
      jest
        .spyOn(emailQueueService, 'queueAdmissionEmails')
        .mockResolvedValue(undefined);

      const result = await controller.sendAdmissionResults(sessionId);

      expect(emailQueueService.queueAdmissionEmails).toHaveBeenCalledWith(
        sessionId,
      );
      expect(result).toEqual({
        message: 'Admission result emails have been queued for processing',
        sessionId,
      });
    });
  });

  describe('getEmailStatus', () => {
    it('should return email status for a student', async () => {
      const studentId = 'student-123';
      const mockStatus = {
        sent: true,
        sentAt: new Date(),
        attempts: 1,
        lastError: null,
        status: EmailStatus.sent,
      };

      jest
        .spyOn(emailQueueService, 'getEmailStatus')
        .mockResolvedValue(mockStatus);

      const result = await controller.getEmailStatus(studentId);

      expect(emailQueueService.getEmailStatus).toHaveBeenCalledWith(studentId);
      expect(result).toEqual(mockStatus);
    });

    it('should throw NotFoundException when no email notification exists', async () => {
      const studentId = 'student-123';

      jest.spyOn(emailQueueService, 'getEmailStatus').mockResolvedValue(null);

      await expect(controller.getEmailStatus(studentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
