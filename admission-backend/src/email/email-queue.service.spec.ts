import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { EmailQueueService } from './email-queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailStatus } from '@prisma/client';

describe('EmailQueueService', () => {
  let service: EmailQueueService;
  let prismaService: PrismaService;
  let emailQueue: any;

  const mockStudent = {
    id: 'student-123',
    idCard: '123456789',
    fullName: 'Test Student',
    dateOfBirth: new Date('2000-01-01'),
    email: 'student@example.com',
    phone: '0123456789',
    address: 'Test Address',
    priorityPoints: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMajor = {
    id: 'major-123',
    code: 'CS',
    name: 'Computer Science',
    subjectCombinations: {},
    description: 'Test Major',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockApplication = {
    id: 'app-123',
    studentId: 'student-123',
    sessionId: 'session-123',
    majorId: 'major-123',
    admissionMethod: 'entrance_exam',
    preferencePriority: 1,
    subjectScores: {},
    calculatedScore: 25.5,
    rankInMajor: 1,
    admissionStatus: 'admitted' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    student: mockStudent,
    major: mockMajor,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailQueueService,
        {
          provide: PrismaService,
          useValue: {
            application: {
              findMany: jest.fn(),
            },
            emailNotification: {
              create: jest.fn(),
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: getQueueToken('email'),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EmailQueueService>(EmailQueueService);
    prismaService = module.get<PrismaService>(PrismaService);
    emailQueue = module.get(getQueueToken('email'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('queueAdmissionEmails', () => {
    it('should queue emails for admitted students', async () => {
      const mockEmailNotification = {
        id: 'email-123',
        studentId: 'student-123',
        email: 'student@example.com',
        templateName: 'admission-result',
        templateData: {},
        status: EmailStatus.pending,
        attempts: 0,
        sentAt: null,
        lastError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(prismaService.application, 'findMany')
        .mockResolvedValue([mockApplication]);
      jest
        .spyOn(prismaService.emailNotification, 'create')
        .mockResolvedValue(mockEmailNotification);
      jest.spyOn(emailQueue, 'add').mockResolvedValue({});

      await service.queueAdmissionEmails('session-123');

      expect(prismaService.application.findMany).toHaveBeenCalledWith({
        where: {
          sessionId: 'session-123',
          admissionStatus: 'admitted',
        },
        include: {
          student: true,
          major: true,
        },
      });

      expect(prismaService.emailNotification.create).toHaveBeenCalled();
      expect(emailQueue.add).toHaveBeenCalledWith(
        'send-admission-email',
        expect.objectContaining({
          id: 'email-123',
          studentId: 'student-123',
          email: 'student@example.com',
        }),
        expect.objectContaining({
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }),
      );
    });

    it('should skip students without email addresses', async () => {
      const studentWithoutEmail = {
        ...mockApplication,
        student: { ...mockStudent, email: null },
      };

      jest
        .spyOn(prismaService.application, 'findMany')
        .mockResolvedValue([studentWithoutEmail]);

      await service.queueAdmissionEmails('session-123');

      expect(prismaService.emailNotification.create).not.toHaveBeenCalled();
      expect(emailQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('getEmailStatus', () => {
    it('should return email status for a student', async () => {
      const mockEmailNotification = {
        id: 'email-123',
        studentId: 'student-123',
        email: 'student@example.com',
        templateName: 'admission-result',
        templateData: {},
        status: EmailStatus.sent,
        attempts: 1,
        sentAt: new Date(),
        lastError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(prismaService.emailNotification, 'findFirst')
        .mockResolvedValue(mockEmailNotification);

      const result = await service.getEmailStatus('student-123');

      expect(result).toEqual({
        sent: true,
        sentAt: mockEmailNotification.sentAt,
        attempts: 1,
        lastError: null,
        status: EmailStatus.sent,
      });
    });

    it('should return null when no email notification exists', async () => {
      jest
        .spyOn(prismaService.emailNotification, 'findFirst')
        .mockResolvedValue(null);

      const result = await service.getEmailStatus('student-123');

      expect(result).toBeNull();
    });
  });
});
