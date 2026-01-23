import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz', // mock hash
    fullName: 'Test User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const userWithHash = { ...mockUser, passwordHash: hashedPassword };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithHash);

      const result = await service.validateUser('testuser', password);

      expect(result).toBeDefined();
      expect(result.username).toBe('testuser');
      expect(result.passwordHash).toBeUndefined();
    });

    it('should return null when user does not exist', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password123');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const userWithHash = { ...mockUser, passwordHash: hashedPassword };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithHash);

      const result = await service.validateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and expiration for valid credentials', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const userWithHash = { ...mockUser, passwordHash: hashedPassword };
      const mockToken = 'mock.jwt.token';

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithHash);
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);

      const result = await service.login({
        username: 'testuser',
        password: password,
      });

      expect(result).toEqual({
        accessToken: mockToken,
        expiresIn: 86400, // 24 hours
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.login({
          username: 'testuser',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const password = 'password123';
      const hash = await service.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);

      // Verify the hash can be compared
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });
  });
});
