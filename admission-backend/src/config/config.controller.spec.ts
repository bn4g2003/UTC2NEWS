import { Test, TestingModule } from '@nestjs/testing';
import { ConfigController } from './config.controller';
import { ConfigService } from './config.service';
import { BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';

describe('ConfigController', () => {
  let controller: ConfigController;
  let service: ConfigService;

  const mockConfigService = {
    getSetting: jest.fn(),
    updateSetting: jest.fn(),
    getAllSettings: jest.fn(),
    getDescription: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigController],
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ConfigController>(ConfigController);
    service = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSetting', () => {
    it('should return setting with value and description', async () => {
      mockConfigService.getSetting.mockResolvedValue(3);
      mockConfigService.getDescription.mockReturnValue(
        'Maximum number of retry attempts',
      );

      const result = await controller.getSetting('email_retry_attempts');

      expect(result).toEqual({
        key: 'email_retry_attempts',
        value: 3,
        description: 'Maximum number of retry attempts',
      });
      expect(service.getSetting).toHaveBeenCalledWith('email_retry_attempts');
    });

    it('should throw error for unknown key', async () => {
      mockConfigService.getSetting.mockRejectedValue(
        new BadRequestException('Configuration key not found'),
      );

      await expect(controller.getSetting('unknown_key')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateSetting', () => {
    it('should update setting successfully', async () => {
      mockConfigService.updateSetting.mockResolvedValue(undefined);

      const result = await controller.updateSetting('email_retry_attempts', {
        value: 5,
      });

      expect(result).toEqual({
        message: 'Setting updated successfully',
        key: 'email_retry_attempts',
        value: 5,
      });
      expect(service.updateSetting).toHaveBeenCalledWith(
        'email_retry_attempts',
        5,
        undefined,
      );
    });

    it('should update setting with custom description', async () => {
      mockConfigService.updateSetting.mockResolvedValue(undefined);

      await controller.updateSetting('email_retry_attempts', {
        value: 5,
        description: 'Custom description',
      });

      expect(service.updateSetting).toHaveBeenCalledWith(
        'email_retry_attempts',
        5,
        'Custom description',
      );
    });

    it('should throw error for invalid value', async () => {
      mockConfigService.updateSetting.mockRejectedValue(
        new BadRequestException('Invalid value'),
      );

      await expect(
        controller.updateSetting('email_retry_attempts', { value: -1 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAllSettings', () => {
    it('should return all settings', async () => {
      const mockSettings = {
        email_retry_attempts: 3,
        max_import_file_size: 10485760,
        enable_email_notifications: true,
      };

      mockConfigService.getAllSettings.mockResolvedValue(mockSettings);

      const result = await controller.getAllSettings();

      expect(result).toEqual(mockSettings);
      expect(service.getAllSettings).toHaveBeenCalled();
    });
  });
});
