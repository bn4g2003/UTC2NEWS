import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RBACService {
  constructor(private prisma: PrismaService) {}

  async createPermission(data: CreatePermissionDto) {
    try {
      return await this.prisma.permission.create({
        data: {
          name: data.name,
          description: data.description,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Permission with this name already exists');
      }
      throw error;
    }
  }

  async getAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async createRole(data: CreateRoleDto) {
    try {
      return await this.prisma.role.create({
        data: {
          name: data.name,
          description: data.description,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Role with this name already exists');
      }
      throw error;
    }
  }

  async getAllRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getRoleById(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async assignPermissionsToRole(roleId: string, permissionIds: string[]) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: permissionIds } },
    });

    if (permissions.length !== permissionIds.length) {
      throw new NotFoundException('One or more permissions not found');
    }

    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    await this.prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),
      skipDuplicates: true,
    });

    return this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async assignRolesToUser(userId: string, roleIds: string[]) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const roles = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
    });

    if (roles.length !== roleIds.length) {
      throw new NotFoundException('One or more roles not found');
    }

    await this.prisma.userRole.deleteMany({
      where: { userId },
    });

    await this.prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({
        userId,
        roleId,
      })),
      skipDuplicates: true,
    });

    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async getUserPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const permissionsMap = new Map();
    
    for (const userRole of user.roles) {
      for (const rolePermission of userRole.role.permissions) {
        permissionsMap.set(rolePermission.permission.id, rolePermission.permission);
      }
    }

    return Array.from(permissionsMap.values());
  }

  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.some((permission) => permission.name === permissionName);
  }
}
