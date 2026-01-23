import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { RBACService } from './rbac.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermissions } from './decorators/require-permissions.decorator';

@ApiTags('RBAC')
@ApiBearerAuth('JWT-auth')
@Controller('rbac')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RBACController {
  constructor(private readonly rbacService: RBACService) {}

  @Post('permissions')
  @RequirePermissions('permissions:assign')
  @ApiOperation({ 
    summary: 'Create permission', 
    description: 'Create a new permission representing an atomic action in the system' 
  })
  @ApiBody({ type: CreatePermissionDto })
  @ApiResponse({ status: 201, description: 'Permission created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires permissions:assign permission' })
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.rbacService.createPermission(createPermissionDto);
  }

  @Get('permissions')
  @RequirePermissions('permissions:read')
  @ApiOperation({ 
    summary: 'Get all permissions', 
    description: 'Retrieve all permissions in the system' 
  })
  @ApiResponse({ status: 200, description: 'Permissions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires permissions:read permission' })
  async getAllPermissions() {
    return this.rbacService.getAllPermissions();
  }

  @Post('roles')
  @RequirePermissions('roles:create')
  @ApiOperation({ 
    summary: 'Create role', 
    description: 'Create a new role that can be assigned permissions' 
  })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires roles:create permission' })
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rbacService.createRole(createRoleDto);
  }

  @Get('roles')
  @RequirePermissions('roles:read')
  @ApiOperation({ 
    summary: 'Get all roles', 
    description: 'Retrieve all roles with their permissions' 
  })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires roles:read permission' })
  async getAllRoles() {
    return this.rbacService.getAllRoles();
  }

  @Get('roles/:id')
  @RequirePermissions('roles:read')
  @ApiOperation({ 
    summary: 'Get role by ID', 
    description: 'Retrieve a specific role with its permissions' 
  })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires roles:read permission' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getRoleById(@Param('id') roleId: string) {
    return this.rbacService.getRoleById(roleId);
  }

  @Post('roles/:id/permissions')
  @RequirePermissions('permissions:assign')
  @ApiOperation({ 
    summary: 'Assign permissions to role', 
    description: 'Assign multiple permissions to a specific role' 
  })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiBody({ type: AssignPermissionsDto })
  @ApiResponse({ status: 200, description: 'Permissions assigned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires permissions:assign permission' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async assignPermissionsToRole(
    @Param('id') roleId: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.rbacService.assignPermissionsToRole(
      roleId,
      assignPermissionsDto.permissionIds,
    );
  }

  @Post('users/:id/roles')
  @RequirePermissions('roles:assign')
  @ApiOperation({ 
    summary: 'Assign roles to user', 
    description: 'Assign multiple roles to a specific user' 
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: AssignRolesDto })
  @ApiResponse({ status: 200, description: 'Roles assigned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires roles:assign permission' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async assignRolesToUser(
    @Param('id') userId: string,
    @Body() assignRolesDto: AssignRolesDto,
  ) {
    return this.rbacService.assignRolesToUser(userId, assignRolesDto.roleIds);
  }

  @Get('users/:id/permissions')
  @RequirePermissions('permissions:read')
  @ApiOperation({ 
    summary: 'Get user permissions', 
    description: 'Retrieve all permissions for a specific user based on their assigned roles' 
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User permissions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires permissions:read permission' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserPermissions(@Param('id') userId: string) {
    return this.rbacService.getUserPermissions(userId);
  }
}
