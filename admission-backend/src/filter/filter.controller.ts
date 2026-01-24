import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { VirtualFilterService } from './virtual-filter.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { FilterResult } from './dto/filter-result.dto';

@ApiTags('Filter')
@ApiBearerAuth('JWT-auth')
@Controller('sessions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FilterController {
  constructor(private readonly virtualFilterService: VirtualFilterService) {}

  /**
   * Run the virtual filter algorithm for an admission session
   * POST /sessions/:id/run-filter
   */
  @Post(':id/run-filter')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('filter:execute')
  @ApiOperation({ 
    summary: 'Run virtual filter algorithm', 
    description: 'Execute the virtual filtering algorithm for an admission session. Processes applications by preference priority and score ranking, enforces quotas, and generates final admission decisions. The operation is idempotent and atomic.' 
  })
  @ApiParam({ name: 'id', description: 'Admission session ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Filter executed successfully',
    schema: {
      properties: {
        sessionId: { type: 'string' },
        totalStudents: { type: 'number', example: 1000 },
        admittedCount: { type: 'number', example: 750 },
        executionTime: { type: 'number', example: 2500, description: 'Execution time in milliseconds' }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Forbidden - requires filter:execute permission' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async runFilter(@Param('id') sessionId: string): Promise<FilterResult> {
    return this.virtualFilterService.runFilter(sessionId);
  }

  /**
   * Get detailed filter results for a session
   * GET /sessions/:id/filter-results
   */
  @Get(':id/filter-results')
  @RequirePermissions('filter:execute')
  @ApiOperation({ 
    summary: 'Get detailed filter results', 
    description: 'Retrieve detailed admission decisions for all applications in a session, including rejection reasons for each preference.' 
  })
  @ApiParam({ name: 'id', description: 'Admission session ID' })
  @ApiQuery({ name: 'studentId', required: false, description: 'Filter by specific student ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Filter results retrieved successfully'
  })
  @ApiResponse({ status: 403, description: 'Forbidden - requires filter:execute permission' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getFilterResults(
    @Param('id') sessionId: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.virtualFilterService.getFilterResults(sessionId, studentId);
  }
}
