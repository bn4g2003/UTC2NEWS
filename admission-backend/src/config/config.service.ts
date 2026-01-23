import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ConfigDefaults {
  [key: string]: {
    value: any;
    description: string;
    validator?: (value: any) => boolean;
  };
}

@Injectable()
export class ConfigService {
  private readonly defaults: ConfigDefaults = {
    max_import_file_size: {
      value: 10485760, // 10MB in bytes
      description: 'Maximum file size for Excel imports in bytes',
      validator: (value: number) => typeof value === 'number' && value > 0,
    },
    email_retry_attempts: {
      value: 3,
      description: 'Maximum number of retry attempts for failed emails',
      validator: (value: number) =>
        typeof value === 'number' && value >= 0 && Number.isInteger(value),
    },
    email_retry_delay: {
      value: 60000, // 1 minute in milliseconds
      description: 'Delay between email retry attempts in milliseconds',
      validator: (value: number) => typeof value === 'number' && value > 0,
    },
    filter_timeout: {
      value: 120000, // 2 minutes in milliseconds
      description: 'Maximum execution time for virtual filter in milliseconds',
      validator: (value: number) => typeof value === 'number' && value > 0,
    },
    session_token_expiry: {
      value: 86400, // 24 hours in seconds
      description: 'Access token expiration time in seconds',
      validator: (value: number) => typeof value === 'number' && value > 0,
    },
    max_preferences_per_student: {
      value: 5,
      description: 'Maximum number of preferences a student can have',
      validator: (value: number) =>
        typeof value === 'number' && value > 0 && Number.isInteger(value),
    },
    enable_email_notifications: {
      value: true,
      description: 'Enable or disable email notifications',
      validator: (value: boolean) => typeof value === 'boolean',
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async getSetting<T = any>(key: string): Promise<T> {
    const setting = await this.prisma.settings.findUnique({
      where: { key },
    });

    if (setting) {
      return setting.value as T;
    }

    // Return default value if setting doesn't exist
    const defaultConfig = this.defaults[key];
    if (defaultConfig) {
      return defaultConfig.value as T;
    }

    throw new BadRequestException(`Configuration key "${key}" not found`);
  }

  async updateSetting(
    key: string,
    value: any,
    description?: string,
  ): Promise<void> {
    // Validate the value
    this.validateConfigValue(key, value);

    await this.prisma.settings.upsert({
      where: { key },
      update: {
        value,
        description: description || this.defaults[key]?.description,
      },
      create: {
        key,
        value,
        description: description || this.defaults[key]?.description,
      },
    });
  }

  validateConfigValue(key: string, value: any): void {
    const defaultConfig = this.defaults[key];

    if (!defaultConfig) {
      throw new BadRequestException(`Unknown configuration key "${key}"`);
    }

    if (defaultConfig.validator && !defaultConfig.validator(value)) {
      throw new BadRequestException(
        `Invalid value for configuration key "${key}"`,
      );
    }
  }

  async getAllSettings(): Promise<Record<string, any>> {
    const settings = await this.prisma.settings.findMany();
    const result: Record<string, any> = {};

    // Start with defaults
    for (const key in this.defaults) {
      result[key] = this.defaults[key].value;
    }

    // Override with stored values
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }

    return result;
  }

  getDefaultValue(key: string): any {
    const defaultConfig = this.defaults[key];
    if (!defaultConfig) {
      throw new BadRequestException(`Unknown configuration key "${key}"`);
    }
    return defaultConfig.value;
  }

  getDescription(key: string): string | undefined {
    return this.defaults[key]?.description;
  }
}
