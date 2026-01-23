import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RBACService } from './rbac.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RBACService', () => {
  let service: RBACService;
  let prismaService: PrismaService;

  const mockPermission = {
    id: 'perm-123',
    name: 'create_major',
    description: 'Permission to create majors',
    createdAt: new Date(),
  };

  const mockRole = {
    id: 'role-123',
    name: 'admin',
    description: 'Administrator role',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: 'hash',
    fullName: 'Test User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RBACService,
        {
          provide: PrismaService,
          useValue: {
            permission: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
            role: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
            rolePermission: {
              deleteMany: jest.fn(),
              createMany: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            userRole: {
              deleteMany: jest.fn(),
              createMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<RBACService>(RBACService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPermission', () => {
    it('should create a permission successfully', async () => {
      jest.spyOn(prismaService.permission, 'create').mockResolvedValue(mockPermission);

      const result = await service.createPermission({
        name: 'create_major',
        description: 'Permission to create majors',
      });

      expect(result).toEqual(mockPermission);
      expect(prismaService.permission.create).toHaveBeenCalledWith({
        data: {
          name: 'create_major',
          description: 'Permission to create majors',
        },
      });
    });

    it('should throw ConflictException when permission name already exists', async () => {
      jest.spyOn(prismaService.permission, 'create').mockRejectedValue({
        code: 'P2002',
      });

      await expect(
        service.createPermission({
          name: 'create_major',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('createRole', () => {
    it('should create a role successfully', async () => {
      jest.spyOn(prismaService.role, 'create').mockResolvedValue(mockRole);

      const result = await service.createRole({
        name: 'admin',
        description: 'Administrator role',
      });

      expect(result).toEqual(mockRole);
      expect(prismaService.role.create).toHaveBeenCalledWith({
        data: {
          name: 'admin',
          description: 'Administrator role',
        },
      });
    });

    it('should throw ConflictException when role name already exists', async () => {
      jest.spyOn(prismaService.role, 'create').mockRejectedValue({
        code: 'P2002',
      });

      await expect(
        service.createRole({
          name: 'admin',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('assignPermissionsToRole', () => {
    it('should assign permissions to role successfully', async () => {
      const permissionIds = ['perm-1', 'perm-2'];
      const roleWithPermissions = {
        ...mockRole,
        permissions: [
          { permission: { ...mockPermission, id: 'perm-1' } },
          { permission: { ...mockPermission, id: 'perm-2' } },
        ],
      };

      jest.spyOn(prismaService.role, 'findUnique')
        .mockResolvedValueOnce(mockRole)
        .mockResolvedValueOnce(roleWithPermissions as any);
      jest.spyOn(prismaService.permission, 'findMany').mockResolvedValue([
        { ...mockPermission, id: 'perm-1' },
        { ...mockPermission, id: 'perm-2' },
      ]);
      jest.spyOn(prismaService.rolePermission, 'deleteMany').mockResolvedValue({ count: 0 });
      jest.spyOn(prismaService.rolePermission, 'createMany').mockResolvedValue({ count: 2 });

      const result = await service.assignPermissionsToRole('role-123', permissionIds);

      expect(result).toEqual(roleWithPermissions);
      expect(prismaService.rolePermission.deleteMany).toHaveBeenCalledWith({
        where: { roleId: 'role-123' },
      });
      expect(prismaService.rolePermission.createMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException when role does not exist', async () => {
      jest.spyOn(prismaService.role, 'findUnique').mockResolvedValue(null);

      await expect(
        service.assignPermissionsToRole('invalid-role', ['perm-1']),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when permission does not exist', async () => {
      jest.spyOn(prismaService.role, 'findUnique').mockResolvedValue(mockRole);
      jest.spyOn(prismaService.permission, 'findMany').mockResolvedValue([]);

      await expect(
        service.assignPermissionsToRole('role-123', ['invalid-perm']),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignRolesToUser', () => {
    it('should assign roles to user successfully', async () => {
      const roleIds = ['role-1', 'role-2'];
      const userWithRoles = {
        ...mockUser,
        roles: [
          { role: { ...mockRole, id: 'role-1' } },
          { role: { ...mockRole, id: 'role-2' } },
        ],
      };

      jest.spyOn(prismaService.user, 'findUnique')
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(userWithRoles as any);
      jest.spyOn(prismaService.role, 'findMany').mockResolvedValue([
        { ...mockRole, id: 'role-1' },
        { ...mockRole, id: 'role-2' },
      ]);
      jest.spyOn(prismaService.userRole, 'deleteMany').mockResolvedValue({ count: 0 });
      jest.spyOn(prismaService.userRole, 'createMany').mockResolvedValue({ count: 2 });

      const result = await service.assignRolesToUser('user-123', roleIds);

      expect(result).toEqual(userWithRoles);
      expect(prismaService.userRole.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
      expect(prismaService.userRole.createMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.assignRolesToUser('invalid-user', ['role-1']),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when role does not exist', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.role, 'findMany').mockResolvedValue([]);

      await expect(
        service.assignRolesToUser('user-123', ['invalid-role']),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserPermissions', () => {
    it('should return all permissions for a user', async () => {
      const userWithRolesAndPermissions = {
        ...mockUser,
        roles: [
          {
            role: {
              ...mockRole,
              permissions: [
                { permission: { ...mockPermission, id: 'perm-1', name: 'create_major' } },
                { permission: { ...mockPermission, id: 'perm-2', name: 'edit_major' } },
              ],
            },
          },
        ],
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithRolesAndPermissions as any);

      const result = await service.getUserPermissions('user-123');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('create_major');
      expect(result[1].name).toBe('edit_major');
    });

    it('should deduplicate permissions from multiple roles', async () => {
      const userWithMultipleRoles = {
        ...mockUser,
        roles: [
          {
            role: {
              ...mockRole,
              id: 'role-1',
              permissions: [
                { permission: { ...mockPermission, id: 'perm-1', name: 'create_major' } },
              ],
            },
          },
          {
            role: {
              ...mockRole,
              id: 'role-2',
              permissions: [
                { permission: { ...mockPermission, id: 'perm-1', name: 'create_major' } },
                { permission: { ...mockPermission, id: 'perm-2', name: 'edit_major' } },
              ],
            },
          },
        ],
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithMultipleRoles as any);

      const result = await service.getUserPermissions('user-123');

      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.getUserPermissions('invalid-user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has the permission', async () => {
      const userWithPermissions = {
        ...mockUser,
        roles: [
          {
            role: {
              ...mockRole,
              permissions: [
                { permission: { ...mockPermission, name: 'create_major' } },
              ],
            },
          },
        ],
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithPermissions as any);

      const result = await service.hasPermission('user-123', 'create_major');

      expect(result).toBe(true);
    });

    it('should return false when user does not have the permission', async () => {
      const userWithPermissions = {
        ...mockUser,
        roles: [
          {
            role: {
              ...mockRole,
              permissions: [
                { permission: { ...mockPermission, name: 'create_major' } },
              ],
            },
          },
        ],
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithPermissions as any);

      const result = await service.hasPermission('user-123', 'delete_major');

      expect(result).toBe(false);
    });
  });
});
