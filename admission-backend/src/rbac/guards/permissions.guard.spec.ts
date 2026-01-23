import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { RBACService } from '../rbac.service';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let rbacService: RBACService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: RBACService,
          useValue: {
            hasPermission: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
    reflector = module.get<Reflector>(Reflector);
    rbacService = module.get<RBACService>(RBACService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { userId: 'user-123', username: 'testuser' },
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    it('should allow access when no permissions are required', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow access when user has required permission', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['create_major']);
      jest.spyOn(rbacService, 'hasPermission').mockResolvedValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(rbacService.hasPermission).toHaveBeenCalledWith('user-123', 'create_major');
    });

    it('should deny access when user lacks required permission', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['create_major']);
      jest.spyOn(rbacService, 'hasPermission').mockResolvedValue(false);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should deny access when user is not authenticated', async () => {
      const contextWithoutUser = {
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['create_major']);

      await expect(guard.canActivate(contextWithoutUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should check all required permissions', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['create_major', 'edit_major']);
      jest.spyOn(rbacService, 'hasPermission')
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(rbacService.hasPermission).toHaveBeenCalledTimes(2);
    });

    it('should deny access if any required permission is missing', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['create_major', 'edit_major']);
      jest.spyOn(rbacService, 'hasPermission')
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
