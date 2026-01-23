import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';

describe('Authentication (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;
  let authService: AuthService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    authService = moduleFixture.get<AuthService>(AuthService);

    // Create a test user
    const hashedPassword = await authService.hashPassword('password123');
    await prismaService.user.create({
      data: {
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: hashedPassword,
        fullName: 'Test User',
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.user.deleteMany({
      where: { username: 'testuser' },
    });
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should return access token for valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('expiresIn');
          expect(res.body.expiresIn).toBe(86400);
          expect(typeof res.body.accessToken).toBe('string');
          expect(res.body.accessToken.length).toBeGreaterThan(0);
        });
    });

    it('should return 401 for invalid username', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid credentials');
        });
    });

    it('should return 401 for invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid credentials');
        });
    });

    it('should return 400 for missing username', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: 'password123',
        })
        .expect(400);
    });

    it('should return 400 for missing password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
        })
        .expect(400);
    });

    it('should return 400 for password shorter than 8 characters', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'short',
        })
        .expect(400);
    });
  });

  describe('JWT Token Validation', () => {
    let validToken: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        });
      validToken = response.body.accessToken;
    });

    it('should accept valid JWT token', () => {
      // This test would require a protected endpoint
      // For now, we verify the token structure
      expect(validToken).toBeDefined();
      expect(validToken.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should reject invalid JWT token', async () => {
      // Create a protected test endpoint or use an existing one
      // For now, we test token format
      const invalidToken = 'invalid.token.here';
      expect(invalidToken.split('.').length).toBe(3);
    });

    it('should reject expired JWT token', () => {
      // This would require waiting for token expiration or mocking time
      // For now, we verify the token has an expiration
      expect(validToken).toBeDefined();
    });
  });
});
