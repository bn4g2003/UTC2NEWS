import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions('users:create')
  @ApiOperation({
    summary: 'Create user',
    description: 'Create a new user account with username, password, email, and full name',
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires users:create permission' })
  @ApiResponse({ status: 409, description: 'Username or email already exists' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  @RequirePermissions('users:read')
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve paginated list of all users',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires users:read permission' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.usersService.findAll(page, limit);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve profile information of the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Get(':id')
  @RequirePermissions('users:read')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve detailed information of a specific user including roles and permissions',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires users:read permission' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put('me')
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Update profile information of the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(req.user.userId, updateUserDto);
  }

  @Put(':id')
  @RequirePermissions('users:update')
  @ApiOperation({
    summary: 'Update user',
    description: 'Update user information (admin only)',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires users:update permission' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @RequirePermissions('users:delete')
  @ApiOperation({
    summary: 'Delete user',
    description: 'Delete a user account (admin only)',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires users:delete permission' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Patch(':id/status')
  @RequirePermissions('users:update_status')
  @ApiOperation({
    summary: 'Update user status',
    description: 'Activate or deactivate a user account',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires users:update_status permission' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto) {
    return this.usersService.updateStatus(id, updateStatusDto);
  }

  @Patch('me/password')
  @ApiOperation({
    summary: 'Change own password',
    description: 'Change password for the authenticated user (requires current password)',
  })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.userId, changePasswordDto);
  }

  @Patch(':id/password')
  @RequirePermissions('users:update_password')
  @ApiOperation({
    summary: 'Update user password',
    description: 'Reset password for any user (admin only, does not require current password)',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires users:update_password permission' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updatePassword(@Param('id') id: string, @Body() updatePasswordDto: UpdatePasswordDto) {
    return this.usersService.updatePassword(id, updatePasswordDto);
  }
}
