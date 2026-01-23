import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RBACService } from '../rbac.service';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RBACService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new ForbiddenException('User not authenticated');
    }

    for (const permission of requiredPermissions) {
      const hasPermission = await this.rbacService.hasPermission(
        user.userId,
        permission,
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `Missing required permission: ${permission}`,
        );
      }
    }

    return true;
  }
}
