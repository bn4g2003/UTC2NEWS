import {
  Controller,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiProduces } from '@nestjs/swagger';
import type { Response } from 'express';
import { ResultExportService } from './result-export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';

@ApiTags('Results')
@ApiBearerAuth('JWT-auth')
@Controller('sessions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ResultController {
  constructor(private readonly resultExportService: ResultExportService) { }

  /**
   * Export admission results to Excel
   * GET /sessions/:id/results/export
   */
  @Get(':id/results/export')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('results:export')
  @ApiOperation({
    summary: 'Export admission results',
    description: 'Generate and download Excel file containing all admitted students for a session with their details (student info, major, method, score)'
  })
  @ApiParam({ name: 'id', description: 'Admission session ID' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({
    status: 200,
    description: 'Excel file generated and downloaded successfully',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Forbidden - requires results:export permission' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async exportResults(
    @Param('id') sessionId: string,
    @Res() res: Response,
  ): Promise<void> {
    // Generate Excel file
    const excelBuffer = await this.resultExportService.generateResultExcel(
      sessionId,
    );

    // Set response headers for file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=admission-results-${sessionId}.xlsx`,
    );
    res.setHeader('Content-Length', excelBuffer.length);

    // Send the Excel file
    res.send(excelBuffer);
  }

  /**
   * Get admission results as JSON
   * GET /sessions/:id/results
   */
  @Get(':id/results')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('results:read')
  @ApiOperation({
    summary: 'Get admission results as JSON',
    description: 'Retrieve list of all students with their admission status (one row per student)'
  })
  @ApiParam({ name: 'id', description: 'Admission session ID' })
  @ApiResponse({
    status: 200,
    description: 'Results retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - requires results:read permission' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getResults(
    @Param('id') sessionId: string,
  ) {
    return this.resultExportService.getStudentResults(sessionId);
  }
}
