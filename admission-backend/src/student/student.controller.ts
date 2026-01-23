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
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { AddPreferenceDto } from './dto/add-preference.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';

@ApiTags('Students')
@ApiBearerAuth('JWT-auth')
@Controller('students')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StudentController {
  constructor(private studentService: StudentService) {}

  @Post()
  @RequirePermissions('students:create')
  @ApiOperation({ 
    summary: 'Create student', 
    description: 'Create a new student record manually with validation' 
  })
  @ApiResponse({ status: 201, description: 'Student created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate ID card' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires students:create permission' })
  async createStudent(@Body() createStudentDto: CreateStudentDto) {
    return this.studentService.createStudent(createStudentDto);
  }

  @Get()
  @RequirePermissions('students:read')
  @ApiOperation({
    summary: 'Get all students',
    description: 'Retrieve all students with optional filtering and pagination',
  })
  @ApiResponse({ status: 200, description: 'Students retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires students:read permission' })
  async findAllStudents(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 10;
    const skip = (pageNum - 1) * pageSizeNum;

    return await this.studentService.findAllStudents({
      skip,
      take: pageSizeNum,
      search,
      sessionId,
    });
  }

  @Put(':id')
  @RequirePermissions('students:update')
  @ApiOperation({ 
    summary: 'Update student', 
    description: 'Update an existing student record' 
  })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires students:update permission' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async updateStudent(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentService.updateStudent(id, updateStudentDto);
  }

  @Get(':id')
  @RequirePermissions('students:read')
  @ApiOperation({ 
    summary: 'Get student by ID', 
    description: 'Retrieve a specific student with all preferences' 
  })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires students:read permission' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async getStudent(@Param('id') id: string) {
    return this.studentService.getStudent(id);
  }

  @Post(':id/preferences')
  @RequirePermissions('preferences:manage')
  @ApiOperation({ 
    summary: 'Add preference', 
    description: 'Add a new preference (major choice) for a student' 
  })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiResponse({ status: 201, description: 'Preference added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid major code or admission method' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires preferences:manage permission' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async addPreference(
    @Param('id') id: string,
    @Body() addPreferenceDto: AddPreferenceDto,
  ) {
    return this.studentService.addPreference(id, addPreferenceDto);
  }

  @Put(':id/preferences/:preferenceId')
  @RequirePermissions('preferences:manage')
  @ApiOperation({ 
    summary: 'Update preference', 
    description: 'Update an existing preference for a student' 
  })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiParam({ name: 'preferenceId', description: 'Preference (Application) ID' })
  @ApiResponse({ status: 200, description: 'Preference updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires preferences:manage permission' })
  @ApiResponse({ status: 404, description: 'Student or preference not found' })
  async updatePreference(
    @Param('id') id: string,
    @Param('preferenceId') preferenceId: string,
    @Body() updatePreferenceDto: UpdatePreferenceDto,
  ) {
    return this.studentService.updatePreference(
      id,
      preferenceId,
      updatePreferenceDto,
    );
  }

  @Delete(':id/preferences/:preferenceId')
  @RequirePermissions('preferences:manage')
  @ApiOperation({ 
    summary: 'Remove preference', 
    description: 'Delete a preference from a student' 
  })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiParam({ name: 'preferenceId', description: 'Preference (Application) ID' })
  @ApiResponse({ status: 200, description: 'Preference removed successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires preferences:manage permission' })
  @ApiResponse({ status: 404, description: 'Student or preference not found' })
  async removePreference(
    @Param('id') id: string,
    @Param('preferenceId') preferenceId: string,
  ) {
    return this.studentService.removePreference(id, preferenceId);
  }
}
