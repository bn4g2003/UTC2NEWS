import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { ConfigService } from './config.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';

@ApiTags('Configuration')
@ApiBearerAuth('JWT-auth')
@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get(':key')
  @RequirePermissions('config:read')
  @ApiOperation({ 
    summary: 'Get setting by key', 
    description: 'Retrieve a specific configuration setting value' 
  })
  @ApiParam({ name: 'key', description: 'Setting key', example: 'email_sender_name' })
  @ApiResponse({ 
    status: 200, 
    description: 'Setting retrieved successfully',
    schema: {
      properties: {
        key: { type: 'string' },
        value: { type: 'object' },
        description: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Forbidden - requires config:read permission' })
  async getSetting(@Param('key') key: string) {
    const value = await this.configService.getSetting(key);
    const description = this.configService.getDescription(key);
    return {
      key,
      value,
      description,
    };
  }

  @Put(':key')
  @RequirePermissions('config:update')
  @ApiOperation({ 
    summary: 'Update setting', 
    description: 'Update a configuration setting value. Values are validated against expected types and ranges.' 
  })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiBody({ type: UpdateSettingDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Setting updated successfully',
    schema: {
      properties: {
        message: { type: 'string' },
        key: { type: 'string' },
        value: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid setting value' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires config:update permission' })
  async updateSetting(
    @Param('key') key: string,
    @Body() updateSettingDto: UpdateSettingDto,
  ) {
    await this.configService.updateSetting(
      key,
      updateSettingDto.value,
      updateSettingDto.description,
    );
    return {
      message: 'Setting updated successfully',
      key,
      value: updateSettingDto.value,
    };
  }

  @Get()
  @RequirePermissions('config:read')
  @ApiOperation({ 
    summary: 'Get all settings', 
    description: 'Retrieve all configuration settings' 
  })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires config:read permission' })
  async getAllSettings() {
    return this.configService.getAllSettings();
  }
}
