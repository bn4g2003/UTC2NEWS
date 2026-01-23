import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const createUserDto = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        fullName: 'Test User',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: '1',
        username: createUserDto.username,
        email: createUserDto.email,
        fullName: createUserDto.fullName,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createUser(createUserDto);

      expect(result).toBeDefined();
      expect(result.username).toBe(createUserDto.username);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if username exists', async () => {
      const createUserDto = {
        username: 'existinguser',
        password: 'password123',
        email: 'test@example.com',
        fullName: 'Test User',
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: '1',
        username: createUserDto.username,
      });

      await expect(service.createUser(createUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const userId = '1';
      const mockUser = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne(userId);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
      const userId = '1';
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.user.delete.mockResolvedValue({ id: userId });

      const result = await service.deleteUser(userId);

      expect(result).toEqual({ message: 'User deleted successfully' });
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({ where: { id: userId } });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteUser('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
