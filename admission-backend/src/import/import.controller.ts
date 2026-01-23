import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ImportService } from './import.service';
import { ImportResult } from './dto/import-result.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';

@ApiTags('Import')
@ApiBearerAuth('JWT-auth')
@Controller('import')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ImportController {
  constructor(private importService: ImportService) { }

  @Post('students')
  @RequirePermissions('import:execute')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Import students from Excel',
    description: 'Upload an Excel file containing student personal data and scores. All records are validated before import.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        sessionId: { type: 'string' }
      },
      required: ['file', 'sessionId']
    },
  })
  async importStudents(
    @UploadedFile() file: Express.Multer.File,
    @Body('sessionId') sessionId: string,
  ): Promise<ImportResult> {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!sessionId) throw new BadRequestException('Session ID is required');

    return this.importService.importStudents(file.buffer, sessionId);
  }

  @Post('preferences')
  @RequirePermissions('import:execute')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Import candidate preferences from Excel',
    description: 'Upload an Excel file containing candidate preferences (student ID, major, priority).'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        sessionId: { type: 'string' }
      },
      required: ['file', 'sessionId']
    },
  })
  async importPreferences(
    @UploadedFile() file: Express.Multer.File,
    @Body('sessionId') sessionId: string,
  ): Promise<ImportResult> {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!sessionId) throw new BadRequestException('Session ID is required');

    return this.importService.importPreferences(file.buffer, sessionId);
  }
}
