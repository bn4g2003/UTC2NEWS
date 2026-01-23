import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('ConfigService', () => {
  let service: ConfigService;
  let prisma: PrismaService;

  const mockPrismaService = {
    settings: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSetting', () => {
    it('should return stored setting value', async () => {
      const mockSetting = {
        key: 'max_import_file_size',
        value: 20971520,
        description: 'Custom size',
        updatedAt: new Date(),
      };

      mockPrismaService.settings.findUnique.mockResolvedValue(mockSetting);

      const result = await service.getSetting('max_import_file_size');

      expect(result).toBe(20971520);
      expect(prisma.settings.findUnique).toHaveBeenCalledWith({
        where: { key: 'max_import_file_size' },
      });
    });

    it('should return default value when setting not found', async () => {
      mockPrismaService.settings.findUnique.mockResolvedValue(null);

      const result = await service.getSetting('max_import_file_size');

      expect(result).toBe(10485760); // Default value
    });

    it('should throw error for unknown configuration key', async () => {
      mockPrismaService.settings.findUnique.mockResolvedValue(null);

      await expect(service.getSetting('unknown_key')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateSetting', () => {
    it('should update existing setting with valid value', async () => {
      mockPrismaService.settings.upsert.mockResolvedValue({
        key: 'email_retry_attempts',
        value: 5,
        description: 'Maximum number of retry attempts for failed emails',
        updatedAt: new Date(),
      });

      await service.updateSetting('email_retry_attempts', 5);

      expect(prisma.settings.upsert).toHaveBeenCalledWith({
        where: { key: 'email_retry_attempts' },
        update: {
          value: 5,
          description: 'Maximum number of retry attempts for failed emails',
        },
        create: {
          key: 'email_retry_attempts',
          value: 5,
          description: 'Maximum number of retry attempts for failed emails',
        },
      });
    });

    it('should reject invalid value for configuration key', async () => {
      await expect(
        service.updateSetting('email_retry_attempts', -1),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.settings.upsert).not.toHaveBeenCalled();
    });

    it('should reject non-integer value for integer configuration', async () => {
      await expect(
        service.updateSetting('email_retry_attempts', 3.5),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid type for boolean configuration', async () => {
      await expect(
        service.updateSetting('enable_email_notifications', 'true'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject unknown configuration key', async () => {
      await expect(
        service.updateSetting('unknown_key', 'value'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateConfigValue', () => {
    it('should validate positive integer values', () => {
      expect(() =>
        service.validateConfigValue('email_retry_attempts', 3),
      ).not.toThrow();
    });

    it('should reject negative values for positive integer configs', () => {
      expect(() =>
        service.validateConfigValue('email_retry_attempts', -1),
      ).toThrow(BadRequestException);
    });

    it('should reject zero for positive value configs', () => {
      expect(() =>
        service.validateConfigValue('max_import_file_size', 0),
      ).toThrow(BadRequestException);
    });

    it('should validate boolean values', () => {
      expect(() =>
        service.validateConfigValue('enable_email_notifications', true),
      ).not.toThrow();
      expect(() =>
        service.validateConfigValue('enable_email_notifications', false),
      ).not.toThrow();
    });

    it('should reject non-boolean for boolean configs', () => {
      expect(() =>
        service.validateConfigValue('enable_email_notifications', 1),
      ).toThrow(BadRequestException);
    });

    it('should throw error for unknown key', () => {
      expect(() =>
        service.validateConfigValue('unknown_key', 'value'),
      ).toThrow(BadRequestException);
    });
  });

  describe('getAllSettings', () => {
    it('should return all settings with defaults and overrides', async () => {
      const mockSettings = [
        {
          key: 'email_retry_attempts',
          value: 5,
          description: 'Custom retry attempts',
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.settings.findMany.mockResolvedValue(mockSettings);

      const result = await service.getAllSettings();

      expect(result).toHaveProperty('max_import_file_size', 10485760);
      expect(result).toHaveProperty('email_retry_attempts', 5);
      expect(result).toHaveProperty('enable_email_notifications', true);
    });

    it('should return only defaults when no settings stored', async () => {
      mockPrismaService.settings.findMany.mockResolvedValue([]);

      const result = await service.getAllSettings();

      expect(result).toHaveProperty('max_import_file_size', 10485760);
      expect(result).toHaveProperty('email_retry_attempts', 3);
      expect(result).toHaveProperty('enable_email_notifications', true);
    });
  });

  describe('getDefaultValue', () => {
    it('should return default value for known key', () => {
      const result = service.getDefaultValue('email_retry_attempts');
      expect(result).toBe(3);
    });

    it('should throw error for unknown key', () => {
      expect(() => service.getDefaultValue('unknown_key')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('getDescription', () => {
    it('should return description for known key', () => {
      const result = service.getDescription('email_retry_attempts');
      expect(result).toBe('Maximum number of retry attempts for failed emails');
    });

    it('should return undefined for unknown key', () => {
      const result = service.getDescription('unknown_key');
      expect(result).toBeUndefined();
    });
  });
});
