import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../prisma/prisma.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: 'hashed',
    fullName: 'Test User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user data for valid token payload', async () => {
      const payload = {
        sub: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: payload.sub,
        username: payload.username,
        email: payload.email,
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: payload.sub },
      });
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      const payload = {
        sub: 'nonexistent-user',
        username: 'testuser',
        email: 'test@example.com',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const payload = {
        sub: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      const inactiveUser = { ...mockUser, isActive: false };
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(inactiveUser);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
