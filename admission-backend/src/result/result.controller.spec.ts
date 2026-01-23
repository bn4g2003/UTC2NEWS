import { Test, TestingModule } from '@nestjs/testing';
import { ResultController } from './result.controller';
import { ResultExportService } from './result-export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { Response } from 'express';

describe('ResultController', () => {
  let controller: ResultController;
  let resultExportService: ResultExportService;

  const mockResultExportService = {
    generateResultExcel: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResultController],
      providers: [
        {
          provide: ResultExportService,
          useValue: mockResultExportService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ResultController>(ResultController);
    resultExportService = module.get<ResultExportService>(
      ResultExportService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('exportResults', () => {
    it('should export results as Excel file with correct headers', async () => {
      const sessionId = 'session-123';
      const mockExcelBuffer = Buffer.from('mock-excel-data');

      mockResultExportService.generateResultExcel.mockResolvedValue(
        mockExcelBuffer,
      );

      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await controller.exportResults(sessionId, mockResponse);

      expect(mockResultExportService.generateResultExcel).toHaveBeenCalledWith(
        sessionId,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        `attachment; filename=admission-results-${sessionId}.xlsx`,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Length',
        mockExcelBuffer.length,
      );
      expect(mockResponse.send).toHaveBeenCalledWith(mockExcelBuffer);
    });

    it('should propagate errors from service', async () => {
      const sessionId = 'non-existent-id';
      const error = new Error('Session not found');

      mockResultExportService.generateResultExcel.mockRejectedValue(error);

      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await expect(
        controller.exportResults(sessionId, mockResponse),
      ).rejects.toThrow(error);
    });
  });
});
