import { Test, TestingModule } from '@nestjs/testing';
import { ProgramService } from './program.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('ProgramService', () => {
  let service: ProgramService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    major: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    admissionSession: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    sessionQuota: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    application: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProgramService>(ProgramService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createMajor', () => {
    it('should create a major successfully', async () => {
      const createMajorDto = {
        code: 'CS101',
        name: 'Computer Science',
        subjectCombinations: { math: true, physics: true },
      };

      const expectedMajor = {
        id: '1',
        ...createMajorDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.major.create.mockResolvedValue(expectedMajor);

      const result = await service.createMajor(createMajorDto);

      expect(result).toEqual(expectedMajor);
      expect(mockPrismaService.major.create).toHaveBeenCalledWith({
        data: {
          code: createMajorDto.code,
          name: createMajorDto.name,
          subjectCombinations: createMajorDto.subjectCombinations,
          description: undefined,
          isActive: true,
        },
      });
    });

    it('should throw ConflictException when major code already exists', async () => {
      const createMajorDto = {
        code: 'CS101',
        name: 'Computer Science',
        subjectCombinations: { math: true },
      };

      mockPrismaService.major.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.createMajor(createMajorDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findMajorById', () => {
    it('should return a major when found', async () => {
      const majorId = '1';
      const expectedMajor = {
        id: majorId,
        code: 'CS101',
        name: 'Computer Science',
        subjectCombinations: {},
        quotas: [],
      };

      mockPrismaService.major.findUnique.mockResolvedValue(expectedMajor);

      const result = await service.findMajorById(majorId);

      expect(result).toEqual(expectedMajor);
    });

    it('should throw NotFoundException when major not found', async () => {
      mockPrismaService.major.findUnique.mockResolvedValue(null);

      await expect(service.findMajorById('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createSession', () => {
    it('should create an admission session successfully', async () => {
      const createSessionDto = {
        name: 'Round 1',
        year: 2024,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        status: 'active' as any,
      };

      const expectedSession = {
        id: '1',
        name: createSessionDto.name,
        year: createSessionDto.year,
        startDate: new Date(createSessionDto.startDate),
        endDate: new Date(createSessionDto.endDate),
        status: createSessionDto.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.admissionSession.create.mockResolvedValue(expectedSession);

      const result = await service.createSession(createSessionDto);

      expect(result).toEqual(expectedSession);
    });
  });

  describe('createQuota', () => {
    it('should create a quota successfully', async () => {
      const createQuotaDto = {
        sessionId: 'session-1',
        majorId: 'major-1',
        admissionMethod: 'entrance_exam',
        quota: 100,
      };

      const mockSession = { id: 'session-1', name: 'Round 1' };
      const mockMajor = { id: 'major-1', code: 'CS101' };

      mockPrismaService.admissionSession.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.major.findUnique.mockResolvedValue(mockMajor);

      const expectedQuota = {
        id: '1',
        ...createQuotaDto,
        session: mockSession,
        major: mockMajor,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.sessionQuota.create.mockResolvedValue(expectedQuota);

      const result = await service.createQuota(createQuotaDto);

      expect(result).toEqual(expectedQuota);
    });

    it('should throw BadRequestException for non-positive quota', async () => {
      const createQuotaDto = {
        sessionId: 'session-1',
        majorId: 'major-1',
        admissionMethod: 'entrance_exam',
        quota: 0,
      };

      await expect(service.createQuota(createQuotaDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for non-integer quota', async () => {
      const createQuotaDto = {
        sessionId: 'session-1',
        majorId: 'major-1',
        admissionMethod: 'entrance_exam',
        quota: 10.5,
      };

      await expect(service.createQuota(createQuotaDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteMajor', () => {
    it('should delete a major when no applications exist', async () => {
      const majorId = '1';

      mockPrismaService.application.count.mockResolvedValue(0);
      mockPrismaService.major.delete.mockResolvedValue({ id: majorId });

      const result = await service.deleteMajor(majorId);

      expect(result).toEqual({ id: majorId });
      expect(mockPrismaService.application.count).toHaveBeenCalledWith({
        where: { majorId },
      });
    });

    it('should throw ConflictException when applications exist', async () => {
      const majorId = '1';

      mockPrismaService.application.count.mockResolvedValue(5);

      await expect(service.deleteMajor(majorId)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
