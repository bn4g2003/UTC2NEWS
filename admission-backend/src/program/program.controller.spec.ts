import { Test, TestingModule } from '@nestjs/testing';
import { ProgramController } from './program.controller';
import { ProgramService } from './program.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';

describe('ProgramController', () => {
  let controller: ProgramController;
  let service: ProgramService;

  const mockProgramService = {
    createMajor: jest.fn(),
    findAllMajors: jest.fn(),
    findMajorById: jest.fn(),
    updateMajor: jest.fn(),
    deleteMajor: jest.fn(),
    createSession: jest.fn(),
    findAllSessions: jest.fn(),
    findSessionById: jest.fn(),
    updateSession: jest.fn(),
    deleteSession: jest.fn(),
    createQuota: jest.fn(),
    findAllQuotas: jest.fn(),
    findQuotaById: jest.fn(),
    updateQuota: jest.fn(),
    deleteQuota: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgramController],
      providers: [
        {
          provide: ProgramService,
          useValue: mockProgramService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ProgramController>(ProgramController);
    service = module.get<ProgramService>(ProgramService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Major endpoints', () => {
    it('should create a major', async () => {
      const createMajorDto = {
        code: 'CS101',
        name: 'Computer Science',
        subjectCombinations: { math: true },
      };

      const expectedMajor = { id: '1', ...createMajorDto };
      mockProgramService.createMajor.mockResolvedValue(expectedMajor);

      const result = await controller.createMajor(createMajorDto);

      expect(result).toEqual(expectedMajor);
      expect(service.createMajor).toHaveBeenCalledWith(createMajorDto);
    });

    it('should find all majors', async () => {
      const expectedMajors = [
        { id: '1', code: 'CS101', name: 'Computer Science' },
      ];
      mockProgramService.findAllMajors.mockResolvedValue(expectedMajors);

      const result = await controller.findAllMajors();

      expect(result).toEqual(expectedMajors);
      expect(service.findAllMajors).toHaveBeenCalledWith(false);
    });

    it('should find all active majors when query param is true', async () => {
      const expectedMajors = [
        { id: '1', code: 'CS101', name: 'Computer Science', isActive: true },
      ];
      mockProgramService.findAllMajors.mockResolvedValue(expectedMajors);

      const result = await controller.findAllMajors('true');

      expect(result).toEqual(expectedMajors);
      expect(service.findAllMajors).toHaveBeenCalledWith(true);
    });

    it('should find a major by id', async () => {
      const majorId = '1';
      const expectedMajor = { id: majorId, code: 'CS101' };
      mockProgramService.findMajorById.mockResolvedValue(expectedMajor);

      const result = await controller.findMajorById(majorId);

      expect(result).toEqual(expectedMajor);
      expect(service.findMajorById).toHaveBeenCalledWith(majorId);
    });

    it('should update a major', async () => {
      const majorId = '1';
      const updateMajorDto = { name: 'Updated Name' };
      const expectedMajor = { id: majorId, ...updateMajorDto };
      mockProgramService.updateMajor.mockResolvedValue(expectedMajor);

      const result = await controller.updateMajor(majorId, updateMajorDto);

      expect(result).toEqual(expectedMajor);
      expect(service.updateMajor).toHaveBeenCalledWith(majorId, updateMajorDto);
    });

    it('should delete a major', async () => {
      const majorId = '1';
      const expectedResult = { id: majorId };
      mockProgramService.deleteMajor.mockResolvedValue(expectedResult);

      const result = await controller.deleteMajor(majorId);

      expect(result).toEqual(expectedResult);
      expect(service.deleteMajor).toHaveBeenCalledWith(majorId);
    });
  });

  describe('Session endpoints', () => {
    it('should create a session', async () => {
      const createSessionDto = {
        name: 'Round 1',
        year: 2024,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        status: 'active' as any,
      };

      const expectedSession = { id: '1', ...createSessionDto };
      mockProgramService.createSession.mockResolvedValue(expectedSession);

      const result = await controller.createSession(createSessionDto);

      expect(result).toEqual(expectedSession);
      expect(service.createSession).toHaveBeenCalledWith(createSessionDto);
    });

    it('should find all sessions', async () => {
      const expectedSessions = [{ id: '1', name: 'Round 1' }];
      mockProgramService.findAllSessions.mockResolvedValue(expectedSessions);

      const result = await controller.findAllSessions();

      expect(result).toEqual(expectedSessions);
      expect(service.findAllSessions).toHaveBeenCalled();
    });

    it('should find a session by id', async () => {
      const sessionId = '1';
      const expectedSession = { id: sessionId, name: 'Round 1' };
      mockProgramService.findSessionById.mockResolvedValue(expectedSession);

      const result = await controller.findSessionById(sessionId);

      expect(result).toEqual(expectedSession);
      expect(service.findSessionById).toHaveBeenCalledWith(sessionId);
    });

    it('should update a session', async () => {
      const sessionId = '1';
      const updateSessionDto = { name: 'Updated Round' };
      const expectedSession = { id: sessionId, ...updateSessionDto };
      mockProgramService.updateSession.mockResolvedValue(expectedSession);

      const result = await controller.updateSession(sessionId, updateSessionDto);

      expect(result).toEqual(expectedSession);
      expect(service.updateSession).toHaveBeenCalledWith(
        sessionId,
        updateSessionDto,
      );
    });

    it('should delete a session', async () => {
      const sessionId = '1';
      const expectedResult = { id: sessionId };
      mockProgramService.deleteSession.mockResolvedValue(expectedResult);

      const result = await controller.deleteSession(sessionId);

      expect(result).toEqual(expectedResult);
      expect(service.deleteSession).toHaveBeenCalledWith(sessionId);
    });
  });

  describe('Quota endpoints', () => {
    it('should create a quota', async () => {
      const createQuotaDto = {
        sessionId: 'session-1',
        majorId: 'major-1',
        admissionMethod: 'entrance_exam',
        quota: 100,
      };

      const expectedQuota = { id: '1', ...createQuotaDto };
      mockProgramService.createQuota.mockResolvedValue(expectedQuota);

      const result = await controller.createQuota(createQuotaDto);

      expect(result).toEqual(expectedQuota);
      expect(service.createQuota).toHaveBeenCalledWith(createQuotaDto);
    });

    it('should find all quotas', async () => {
      const expectedQuotas = [{ id: '1', quota: 100 }];
      mockProgramService.findAllQuotas.mockResolvedValue(expectedQuotas);

      const result = await controller.findAllQuotas();

      expect(result).toEqual(expectedQuotas);
      expect(service.findAllQuotas).toHaveBeenCalledWith(undefined);
    });

    it('should find quotas by session id', async () => {
      const sessionId = 'session-1';
      const expectedQuotas = [{ id: '1', sessionId, quota: 100 }];
      mockProgramService.findAllQuotas.mockResolvedValue(expectedQuotas);

      const result = await controller.findAllQuotas(sessionId);

      expect(result).toEqual(expectedQuotas);
      expect(service.findAllQuotas).toHaveBeenCalledWith(sessionId);
    });

    it('should find a quota by id', async () => {
      const quotaId = '1';
      const expectedQuota = { id: quotaId, quota: 100 };
      mockProgramService.findQuotaById.mockResolvedValue(expectedQuota);

      const result = await controller.findQuotaById(quotaId);

      expect(result).toEqual(expectedQuota);
      expect(service.findQuotaById).toHaveBeenCalledWith(quotaId);
    });

    it('should update a quota', async () => {
      const quotaId = '1';
      const updateQuotaDto = { quota: 150 };
      const expectedQuota = { id: quotaId, ...updateQuotaDto };
      mockProgramService.updateQuota.mockResolvedValue(expectedQuota);

      const result = await controller.updateQuota(quotaId, updateQuotaDto);

      expect(result).toEqual(expectedQuota);
      expect(service.updateQuota).toHaveBeenCalledWith(quotaId, updateQuotaDto);
    });

    it('should delete a quota', async () => {
      const quotaId = '1';
      const expectedResult = { id: quotaId };
      mockProgramService.deleteQuota.mockResolvedValue(expectedResult);

      const result = await controller.deleteQuota(quotaId);

      expect(result).toEqual(expectedResult);
      expect(service.deleteQuota).toHaveBeenCalledWith(quotaId);
    });
  });
});
