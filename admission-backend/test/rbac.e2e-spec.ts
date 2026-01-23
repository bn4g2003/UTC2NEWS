import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';

describe('RBAC (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let adminToken: string;
  let adminUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    authService = app.get<AuthService>(AuthService);

    await prisma.userRole.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.user.deleteMany();

    const hashedPassword = await authService.hashPassword('admin123');
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@test.com',
        passwordHash: hashedPassword,
        fullName: 'Admin User',
      },
    });
    adminUserId = adminUser.id;

    const managePermission = await prisma.permission.create({
      data: {
        name: 'manage_permissions',
        description: 'Can manage permissions',
      },
    });

    const manageRolesPermission = await prisma.permission.create({
      data: {
        name: 'manage_roles',
        description: 'Can manage roles',
      },
    });

    const manageUsersPermission = await prisma.permission.create({
      data: {
        name: 'manage_users',
        description: 'Can manage users',
      },
    });

    const viewPermission = await prisma.permission.create({
      data: {
        name: 'view_permissions',
        description: 'Can view permissions',
      },
    });

    const adminRole = await prisma.role.create({
      data: {
        name: 'admin',
        description: 'Administrator',
      },
    });

    await prisma.rolePermission.createMany({
      data: [
        { roleId: adminRole.id, permissionId: managePermission.id },
        { roleId: adminRole.id, permissionId: manageRolesPermission.id },
        { roleId: adminRole.id, permissionId: manageUsersPermission.id },
        { roleId: adminRole.id, permissionId: viewPermission.id },
      ],
    });

    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });

    const loginResponse = await authService.login({
      username: 'admin',
      password: 'admin123',
    });
    adminToken = loginResponse.accessToken;
  });

  afterAll(async () => {
    await prisma.userRole.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('POST /permissions', () => {
    it('should create a new permission', () => {
      return request(app.getHttpServer())
        .post('/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'create_major',
          description: 'Permission to create majors',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe('create_major');
          expect(res.body.description).toBe('Permission to create majors');
        });
    });

    it('should reject duplicate permission names', async () => {
      await prisma.permission.create({
        data: {
          name: 'duplicate_perm',
          description: 'Test',
        },
      });

      return request(app.getHttpServer())
        .post('/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'duplicate_perm',
        })
        .expect(409);
    });

    it('should reject request without authentication', () => {
      return request(app.getHttpServer())
        .post('/permissions')
        .send({
          name: 'test_permission',
        })
        .expect(401);
    });
  });

  describe('POST /roles', () => {
    it('should create a new role', () => {
      return request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'editor',
          description: 'Editor role',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe('editor');
          expect(res.body.description).toBe('Editor role');
        });
    });

    it('should reject duplicate role names', async () => {
      await prisma.role.create({
        data: {
          name: 'duplicate_role',
          description: 'Test',
        },
      });

      return request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'duplicate_role',
        })
        .expect(409);
    });
  });

  describe('POST /roles/:id/permissions', () => {
    it('should assign permissions to a role', async () => {
      const role = await prisma.role.create({
        data: {
          name: 'test_role',
          description: 'Test role',
        },
      });

      const permission = await prisma.permission.create({
        data: {
          name: 'test_permission',
          description: 'Test permission',
        },
      });

      return request(app.getHttpServer())
        .post(`/roles/${role.id}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          permissionIds: [permission.id],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.permissions).toBeDefined();
          expect(res.body.permissions.length).toBeGreaterThan(0);
        });
    });

    it('should reject invalid role id', () => {
      return request(app.getHttpServer())
        .post('/roles/invalid-id/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          permissionIds: ['perm-id'],
        })
        .expect(404);
    });
  });

  describe('POST /users/:id/roles', () => {
    it('should assign roles to a user', async () => {
      const user = await prisma.user.create({
        data: {
          username: 'testuser',
          email: 'test@test.com',
          passwordHash: 'hash',
          fullName: 'Test User',
        },
      });

      const role = await prisma.role.create({
        data: {
          name: 'user_role',
          description: 'User role',
        },
      });

      return request(app.getHttpServer())
        .post(`/users/${user.id}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roleIds: [role.id],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.roles).toBeDefined();
          expect(res.body.roles.length).toBeGreaterThan(0);
        });
    });

    it('should reject invalid user id', () => {
      return request(app.getHttpServer())
        .post('/users/invalid-id/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roleIds: ['role-id'],
        })
        .expect(404);
    });
  });

  describe('GET /users/:id/permissions', () => {
    it('should return user permissions', () => {
      return request(app.getHttpServer())
        .get(`/users/${adminUserId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should reject invalid user id', () => {
      return request(app.getHttpServer())
        .get('/users/invalid-id/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
