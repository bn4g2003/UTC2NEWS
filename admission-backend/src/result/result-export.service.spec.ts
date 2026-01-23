import { Test, TestingModule } from '@nestjs/testing';
import { ResultExportService } from './result-export.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { AdmissionStatus } from '@prisma/client';

describe('ResultExportService', () => {
  let service: ResultExportService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    admissionSession: {
      findUnique: jest.fn(),
    },
    application: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultExportService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ResultExportService>(ResultExportService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateResultExcel', () => {
    it('should throw NotFoundException when session does not exist', async () => {
      mockPrismaService.admissionSession.findUnique.mockResolvedValue(null);

      await expect(
        service.generateResultExcel('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should generate Excel buffer for valid session with admitted students', async () => {
      const sessionId = 'session-123';
      const mockSession = {
        id: sessionId,
        name: 'Round 1',
        year: 2024,
      };

      const mockApplications = [
        {
          id: 'app-1',
          studentId: 'student-1',
          sessionId,
          majorId: 'major-1',
          admissionMethod: 'entrance_exam',
          preferencePriority: 1,
          calculatedScore: 25.5,
          admissionStatus: AdmissionStatus.admitted,
          student: {
            id: 'student-1',
            idCard: '123456789',
            fullName: 'John Doe',
          },
          major: {
            id: 'major-1',
            code: 'CS101',
            name: 'Computer Science',
          },
        },
      ];

      mockPrismaService.admissionSession.findUnique.mockResolvedValue(
        mockSession,
      );
      mockPrismaService.application.findMany.mockResolvedValue(
        mockApplications,
      );

      const result = await service.generateResultExcel(sessionId);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
      expect(mockPrismaService.admissionSession.findUnique).toHaveBeenCalledWith(
        {
          where: { id: sessionId },
        },
      );
      expect(mockPrismaService.application.findMany).toHaveBeenCalledWith({
        where: {
          sessionId,
          admissionStatus: AdmissionStatus.admitted,
        },
        include: {
          student: true,
          major: true,
        },
        orderBy: [{ major: { code: 'asc' } }, { calculatedScore: 'desc' }],
      });
    });

    it('should generate Excel with empty data when no admitted students', async () => {
      const sessionId = 'session-123';
      const mockSession = {
        id: sessionId,
        name: 'Round 1',
        year: 2024,
      };

      mockPrismaService.admissionSession.findUnique.mockResolvedValue(
        mockSession,
      );
      mockPrismaService.application.findMany.mockResolvedValue([]);

      const result = await service.generateResultExcel(sessionId);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('formatResultData', () => {
    it('should format admitted applications into result rows', async () => {
      const sessionId = 'session-123';
      const mockApplications = [
        {
          id: 'app-1',
          studentId: 'student-1',
          sessionId,
          majorId: 'major-1',
          admissionMethod: 'entrance_exam',
          preferencePriority: 1,
          calculatedScore: 25.5,
          admissionStatus: AdmissionStatus.admitted,
          student: {
            id: 'student-1',
            idCard: '123456789',
            fullName: 'John Doe',
          },
          major: {
            id: 'major-1',
            code: 'CS101',
            name: 'Computer Science',
          },
        },
        {
          id: 'app-2',
          studentId: 'student-2',
          sessionId,
          majorId: 'major-2',
          admissionMethod: 'high_school_transcript',
          preferencePriority: 2,
          calculatedScore: 24.0,
          admissionStatus: AdmissionStatus.admitted,
          student: {
            id: 'student-2',
            idCard: '987654321',
            fullName: 'Jane Smith',
          },
          major: {
            id: 'major-2',
            code: 'EE101',
            name: 'Electrical Engineering',
          },
        },
      ];

      mockPrismaService.application.findMany.mockResolvedValue(
        mockApplications,
      );

      const result = await service.formatResultData(sessionId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        studentId: 'student-1',
        idCard: '123456789',
        fullName: 'John Doe',
        majorCode: 'CS101',
        majorName: 'Computer Science',
        admissionMethod: 'entrance_exam',
        finalScore: 25.5,
        preference: 1,
      });
      expect(result[1]).toEqual({
        studentId: 'student-2',
        idCard: '987654321',
        fullName: 'Jane Smith',
        majorCode: 'EE101',
        majorName: 'Electrical Engineering',
        admissionMethod: 'high_school_transcript',
        finalScore: 24.0,
        preference: 2,
      });
    });

    it('should return empty array when no admitted students', async () => {
      const sessionId = 'session-123';
      mockPrismaService.application.findMany.mockResolvedValue([]);

      const result = await service.formatResultData(sessionId);

      expect(result).toEqual([]);
    });

    it('should handle null calculatedScore gracefully', async () => {
      const sessionId = 'session-123';
      const mockApplications = [
        {
          id: 'app-1',
          studentId: 'student-1',
          sessionId,
          majorId: 'major-1',
          admissionMethod: 'entrance_exam',
          preferencePriority: 1,
          calculatedScore: null,
          admissionStatus: AdmissionStatus.admitted,
          student: {
            id: 'student-1',
            idCard: '123456789',
            fullName: 'John Doe',
          },
          major: {
            id: 'major-1',
            code: 'CS101',
            name: 'Computer Science',
          },
        },
      ];

      mockPrismaService.application.findMany.mockResolvedValue(
        mockApplications,
      );

      const result = await service.formatResultData(sessionId);

      expect(result).toHaveLength(1);
      expect(result[0].finalScore).toBe(0);
    });
  });
});
