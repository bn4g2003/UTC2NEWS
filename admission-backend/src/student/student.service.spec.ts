import { Test, TestingModule } from '@nestjs/testing';
import { StudentService } from './student.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScoreCalculationService } from '../score/score-calculation.service';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

describe('StudentService', () => {
  let service: StudentService;
  let prisma: PrismaService;
  let scoreCalculationService: ScoreCalculationService;

  const mockPrismaService = {
    student: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    admissionSession: {
      findUnique: jest.fn(),
    },
    major: {
      findUnique: jest.fn(),
    },
    application: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockScoreCalculationService = {
    calculateScore: jest.fn(),
    isEligible: jest.fn(),
    getRequiredSubjects: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ScoreCalculationService,
          useValue: mockScoreCalculationService,
        },
      ],
    }).compile();

    service = module.get<StudentService>(StudentService);
    prisma = module.get<PrismaService>(PrismaService);
    scoreCalculationService = module.get<ScoreCalculationService>(
      ScoreCalculationService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createStudent', () => {
    it('should create a student successfully', async () => {
      const createDto = {
        idCard: '123456789',
        fullName: 'Test Student',
        dateOfBirth: '2000-01-01',
        email: 'test@example.com',
        phone: '0123456789',
      };

      mockPrismaService.student.findUnique.mockResolvedValue(null);
      mockPrismaService.student.create.mockResolvedValue({
        id: 'student-1',
        ...createDto,
        dateOfBirth: new Date(createDto.dateOfBirth),
        priorityPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createStudent(createDto);

      expect(result).toBeDefined();
      expect(result.idCard).toBe(createDto.idCard);
      expect(mockPrismaService.student.findUnique).toHaveBeenCalledWith({
        where: { idCard: createDto.idCard },
      });
      expect(mockPrismaService.student.create).toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate ID card', async () => {
      const createDto = {
        idCard: '123456789',
        fullName: 'Test Student',
        dateOfBirth: '2000-01-01',
      };

      mockPrismaService.student.findUnique.mockResolvedValue({
        id: 'existing-student',
        idCard: createDto.idCard,
      });

      await expect(service.createStudent(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateStudent', () => {
    it('should update a student successfully', async () => {
      const studentId = 'student-1';
      const updateDto = {
        fullName: 'Updated Name',
        email: 'updated@example.com',
      };

      mockPrismaService.student.findUnique.mockResolvedValue({
        id: studentId,
        idCard: '123456789',
        fullName: 'Original Name',
      });

      mockPrismaService.student.update.mockResolvedValue({
        id: studentId,
        ...updateDto,
      });

      const result = await service.updateStudent(studentId, updateDto);

      expect(result).toBeDefined();
      expect(mockPrismaService.student.update).toHaveBeenCalledWith({
        where: { id: studentId },
        data: expect.objectContaining(updateDto),
      });
    });

    it('should throw NotFoundException for non-existent student', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStudent('non-existent', { fullName: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStudent', () => {
    it('should return a student with applications', async () => {
      const studentId = 'student-1';
      const mockStudent = {
        id: studentId,
        idCard: '123456789',
        fullName: 'Test Student',
        applications: [],
      };

      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);

      const result = await service.getStudent(studentId);

      expect(result).toEqual(mockStudent);
      expect(mockPrismaService.student.findUnique).toHaveBeenCalledWith({
        where: { id: studentId },
        include: {
          applications: {
            include: {
              major: true,
              session: true,
            },
            orderBy: {
              preferencePriority: 'asc',
            },
          },
        },
      });
    });

    it('should throw NotFoundException for non-existent student', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(null);

      await expect(service.getStudent('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addPreference', () => {
    it('should add a preference successfully', async () => {
      const studentId = 'student-1';
      const addPreferenceDto = {
        sessionId: 'session-1',
        majorCode: 'CS101',
        admissionMethod: 'entrance_exam',
        preferencePriority: 1,
        subjectScores: { math: 9, physics: 8 },
      };

      mockPrismaService.student.findUnique.mockResolvedValue({
        id: studentId,
        priorityPoints: 1.5,
      });
      mockPrismaService.admissionSession.findUnique.mockResolvedValue({
        id: addPreferenceDto.sessionId,
      });
      mockPrismaService.major.findUnique.mockResolvedValue({
        id: 'major-1',
        code: addPreferenceDto.majorCode,
      });
      mockPrismaService.application.findUnique.mockResolvedValue(null);
      mockScoreCalculationService.isEligible.mockReturnValue(true);
      mockScoreCalculationService.calculateScore.mockReturnValue(25.5);
      mockPrismaService.application.create.mockResolvedValue({
        id: 'app-1',
        studentId,
        calculatedScore: 25.5,
        admissionStatus: 'pending',
        ...addPreferenceDto,
      });

      const result = await service.addPreference(studentId, addPreferenceDto);

      expect(result).toBeDefined();
      expect(mockPrismaService.application.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent student', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(null);

      await expect(
        service.addPreference('non-existent', {} as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid major code', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue({
        id: 'student-1',
      });
      mockPrismaService.admissionSession.findUnique.mockResolvedValue({
        id: 'session-1',
      });
      mockPrismaService.major.findUnique.mockResolvedValue(null);

      await expect(
        service.addPreference('student-1', {
          sessionId: 'session-1',
          majorCode: 'INVALID',
          admissionMethod: 'entrance_exam',
          preferencePriority: 1,
          subjectScores: {},
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removePreference', () => {
    it('should remove a preference successfully', async () => {
      const studentId = 'student-1';
      const preferenceId = 'app-1';

      mockPrismaService.application.findUnique.mockResolvedValue({
        id: preferenceId,
        studentId,
      });
      mockPrismaService.application.delete.mockResolvedValue({
        id: preferenceId,
      });

      const result = await service.removePreference(studentId, preferenceId);

      expect(result).toEqual({ message: 'Preference removed successfully' });
      expect(mockPrismaService.application.delete).toHaveBeenCalledWith({
        where: { id: preferenceId },
      });
    });

    it('should throw NotFoundException for non-existent preference', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(null);

      await expect(
        service.removePreference('student-1', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if preference does not belong to student', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue({
        id: 'app-1',
        studentId: 'other-student',
      });

      await expect(
        service.removePreference('student-1', 'app-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
