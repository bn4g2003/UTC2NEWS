import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProgramService } from './program.service';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { CreateQuotaDto } from './dto/create-quota.dto';
import { UpdateQuotaDto } from './dto/update-quota.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';

@ApiTags('Programs')
@Controller('program')
export class ProgramController {
  constructor(private readonly programService: ProgramService) {}

  // Major endpoints
  @Post('majors')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('majors:create')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create major', description: 'Create a new academic major with unique code' })
  @ApiResponse({ status: 201, description: 'Major created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires majors:create permission' })
  @ApiResponse({ status: 409, description: 'Major code already exists' })
  async createMajor(@Body() createMajorDto: CreateMajorDto) {
    return await this.programService.createMajor(createMajorDto);
  }

  @Get('majors')
  @ApiOperation({ summary: 'Get all majors', description: 'Retrieve all majors, optionally filter by active status (public)' })
  @ApiQuery({ name: 'active', required: false, description: 'Filter by active status (true/false)' })
  @ApiResponse({ status: 200, description: 'Majors retrieved successfully' })
  async findAllMajors(@Query('active') active?: string) {
    const activeOnly = active === 'true';
    return await this.programService.findAllMajors(activeOnly);
  }

  @Get('majors/:id')
  @ApiOperation({ summary: 'Get major by ID', description: 'Retrieve a specific major (public)' })
  @ApiParam({ name: 'id', description: 'Major ID' })
  @ApiResponse({ status: 200, description: 'Major retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Major not found' })
  async findMajorById(@Param('id') id: string) {
    return await this.programService.findMajorById(id);
  }

  @Put('majors/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('majors:update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update major', description: 'Update an existing major' })
  @ApiParam({ name: 'id', description: 'Major ID' })
  @ApiResponse({ status: 200, description: 'Major updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires majors:update permission' })
  @ApiResponse({ status: 404, description: 'Major not found' })
  async updateMajor(
    @Param('id') id: string,
    @Body() updateMajorDto: UpdateMajorDto,
  ) {
    return await this.programService.updateMajor(id, updateMajorDto);
  }

  @Delete('majors/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('majors:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete major', description: 'Delete a major (prevented if applications exist)' })
  @ApiParam({ name: 'id', description: 'Major ID' })
  @ApiResponse({ status: 200, description: 'Major deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires majors:delete permission' })
  @ApiResponse({ status: 404, description: 'Major not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete major with existing applications' })
  async deleteMajor(@Param('id') id: string) {
    return await this.programService.deleteMajor(id);
  }

  // Admission Session endpoints
  @Post('sessions')
  @RequirePermissions('admission_sessions:create')
  @ApiOperation({ summary: 'Create admission session', description: 'Create a new admission session' })
  @ApiResponse({ status: 201, description: 'Session created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admission_sessions:create permission' })
  async createSession(@Body() createSessionDto: CreateSessionDto) {
    return await this.programService.createSession(createSessionDto);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get all sessions', description: 'Retrieve all admission sessions' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  async findAllSessions() {
    return await this.programService.findAllSessions();
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get session by ID', description: 'Retrieve a specific admission session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async findSessionById(@Param('id') id: string) {
    return await this.programService.findSessionById(id);
  }

  @Put('sessions/:id')
  @RequirePermissions('admission_sessions:update')
  @ApiOperation({ summary: 'Update session', description: 'Update an existing admission session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admission_sessions:update permission' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async updateSession(
    @Param('id') id: string,
    @Body() updateSessionDto: UpdateSessionDto,
  ) {
    return await this.programService.updateSession(id, updateSessionDto);
  }

  @Delete('sessions/:id')
  @RequirePermissions('admission_sessions:delete')
  @ApiOperation({ summary: 'Delete session', description: 'Delete an admission session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admission_sessions:delete permission' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async deleteSession(@Param('id') id: string) {
    return await this.programService.deleteSession(id);
  }

  // Quota configuration endpoints
  @Post('quotas')
  @RequirePermissions('quotas:create')
  @ApiOperation({ summary: 'Create quota', description: 'Configure admission quota for a major in a session' })
  @ApiResponse({ status: 201, description: 'Quota created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires quotas:create permission' })
  async createQuota(@Body() createQuotaDto: CreateQuotaDto) {
    return await this.programService.createQuota(createQuotaDto);
  }

  @Get('quotas')
  @ApiOperation({ summary: 'Get all quotas', description: 'Retrieve all quotas, optionally filter by session' })
  @ApiQuery({ name: 'sessionId', required: false, description: 'Filter by session ID' })
  @ApiResponse({ status: 200, description: 'Quotas retrieved successfully' })
  async findAllQuotas(@Query('sessionId') sessionId?: string) {
    return await this.programService.findAllQuotas(sessionId);
  }

  @Get('quotas/:id')
  @ApiOperation({ summary: 'Get quota by ID', description: 'Retrieve a specific quota configuration' })
  @ApiParam({ name: 'id', description: 'Quota ID' })
  @ApiResponse({ status: 200, description: 'Quota retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Quota not found' })
  async findQuotaById(@Param('id') id: string) {
    return await this.programService.findQuotaById(id);
  }

  @Put('quotas/:id')
  @RequirePermissions('quotas:update')
  @ApiOperation({ summary: 'Update quota', description: 'Update an existing quota configuration' })
  @ApiParam({ name: 'id', description: 'Quota ID' })
  @ApiResponse({ status: 200, description: 'Quota updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires quotas:update permission' })
  @ApiResponse({ status: 404, description: 'Quota not found' })
  async updateQuota(
    @Param('id') id: string,
    @Body() updateQuotaDto: UpdateQuotaDto,
  ) {
    return await this.programService.updateQuota(id, updateQuotaDto);
  }

  @Delete('quotas/:id')
  @RequirePermissions('quotas:delete')
  @ApiOperation({ summary: 'Delete quota', description: 'Delete a quota configuration' })
  @ApiParam({ name: 'id', description: 'Quota ID' })
  @ApiResponse({ status: 200, description: 'Quota deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires quotas:delete permission' })
  @ApiResponse({ status: 404, description: 'Quota not found' })
  async deleteQuota(@Param('id') id: string) {
    return await this.programService.deleteQuota(id);
  }
}
