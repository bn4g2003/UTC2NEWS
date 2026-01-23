import { Test, TestingModule } from '@nestjs/testing';
import { RBACController } from './rbac.controller';
import { RBACService } from './rbac.service';

describe('RBACController', () => {
  let controller: RBACController;
  let service: RBACService;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RBACController],
      providers: [
        {
          provide: RBACService,
          useValue: {
            createPermission: jest.fn(),
            createRole: jest.fn(),
            assignPermissionsToRole: jest.fn(),
            assignRolesToUser: jest.fn(),
            getUserPermissions: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RBACController>(RBACController);
    service = module.get<RBACService>(RBACService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPermission', () => {
    it('should create a permission', async () => {
      jest.spyOn(service, 'createPermission').mockResolvedValue(mockPermission);

      const result = await controller.createPermission({
        name: 'create_major',
        description: 'Permission to create majors',
      });

      expect(result).toEqual(mockPermission);
      expect(service.createPermission).toHaveBeenCalledWith({
        name: 'create_major',
        description: 'Permission to create majors',
      });
    });
  });

  describe('createRole', () => {
    it('should create a role', async () => {
      jest.spyOn(service, 'createRole').mockResolvedValue(mockRole);

      const result = await controller.createRole({
        name: 'admin',
        description: 'Administrator role',
      });

      expect(result).toEqual(mockRole);
      expect(service.createRole).toHaveBeenCalledWith({
        name: 'admin',
        description: 'Administrator role',
      });
    });
  });

  describe('assignPermissionsToRole', () => {
    it('should assign permissions to a role', async () => {
      const roleWithPermissions = {
        ...mockRole,
        permissions: [{ permission: mockPermission }],
      };

      jest.spyOn(service, 'assignPermissionsToRole').mockResolvedValue(roleWithPermissions as any);

      const result = await controller.assignPermissionsToRole('role-123', {
        permissionIds: ['perm-123'],
      });

      expect(result).toEqual(roleWithPermissions);
      expect(service.assignPermissionsToRole).toHaveBeenCalledWith('role-123', ['perm-123']);
    });
  });

  describe('assignRolesToUser', () => {
    it('should assign roles to a user', async () => {
      const userWithRoles = {
        id: 'user-123',
        username: 'testuser',
        roles: [{ role: mockRole }],
      };

      jest.spyOn(service, 'assignRolesToUser').mockResolvedValue(userWithRoles as any);

      const result = await controller.assignRolesToUser('user-123', {
        roleIds: ['role-123'],
      });

      expect(result).toEqual(userWithRoles);
      expect(service.assignRolesToUser).toHaveBeenCalledWith('user-123', ['role-123']);
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions', async () => {
      const permissions = [mockPermission];

      jest.spyOn(service, 'getUserPermissions').mockResolvedValue(permissions);

      const result = await controller.getUserPermissions('user-123');

      expect(result).toEqual(permissions);
      expect(service.getUserPermissions).toHaveBeenCalledWith('user-123');
    });
  });
});
