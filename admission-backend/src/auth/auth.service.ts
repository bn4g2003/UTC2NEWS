import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
    }

    // Get user with roles and permissions
    const userWithPermissions = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        isActive: true,
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

    if (!userWithPermissions) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }

    // Extract all permissions from all roles
    const permissions = userWithPermissions.roles.flatMap(userRole =>
      userRole.role.permissions.map(rolePermission => rolePermission.permission.name)
    );

    const payload = { 
      sub: user.id, 
      username: user.username,
      email: user.email 
    };

    return {
      accessToken: this.jwtService.sign(payload),
      expiresIn: 86400, // 24 hours in seconds
      user: {
        id: userWithPermissions.id,
        username: userWithPermissions.username,
        email: userWithPermissions.email,
        fullName: userWithPermissions.fullName,
        isActive: userWithPermissions.isActive,
        permissions,
      },
    };
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}
