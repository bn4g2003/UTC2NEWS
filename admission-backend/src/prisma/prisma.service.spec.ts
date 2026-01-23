import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { AdmissionStatus, SessionStatus } from '@prisma/client';

describe('PrismaService - Referential Integrity', () => {
  let service: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await service.$disconnect();
  });

  describe('Referential Integrity Constraints', () => {
    it('should enforce referential integrity between students and applications (cascade delete)', async () => {
      // Create a student
      const student = await service.student.create({
        data: {
          idCard: 'TEST-CASCADE-001',
          fullName: 'Test Student Cascade',
          dateOfBirth: new Date('2000-01-01'),
          email: 'cascade@test.com',
        },
      });

      // Create a major
      const major = await service.major.create({
        data: {
          code: 'TEST-CASCADE-MAJ',
          name: 'Test Major Cascade',
          subjectCombinations: { combinations: ['A00'] },
        },
      });

      // Create a session
      const session = await service.admissionSession.create({
        data: {
          name: 'Test Session Cascade',
          year: 2024,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          status: SessionStatus.active,
        },
      });

      // Create an application
      const application = await service.application.create({
        data: {
          studentId: student.id,
          sessionId: session.id,
          majorId: major.id,
          admissionMethod: 'entrance_exam',
          preferencePriority: 1,
          subjectScores: { math: 8, physics: 7, chemistry: 9 },
          admissionStatus: AdmissionStatus.pending,
        },
      });

      // Delete the student - should cascade delete the application
      await service.student.delete({ where: { id: student.id } });

      // Verify application was deleted
      const deletedApplication = await service.application.findUnique({
        where: { id: application.id },
      });
      expect(deletedApplication).toBeNull();

      // Cleanup
      await service.admissionSession.delete({ where: { id: session.id } });
      await service.major.delete({ where: { id: major.id } });
    });

    it('should prevent deletion of major if applications reference it (restrict)', async () => {
      // Create a student
      const student = await service.student.create({
        data: {
          idCard: 'TEST-RESTRICT-001',
          fullName: 'Test Student Restrict',
          dateOfBirth: new Date('2000-01-01'),
          email: 'restrict@test.com',
        },
      });

      // Create a major
      const major = await service.major.create({
        data: {
          code: 'TEST-RESTRICT-MAJ',
          name: 'Test Major Restrict',
          subjectCombinations: { combinations: ['A00'] },
        },
      });

      // Create a session
      const session = await service.admissionSession.create({
        data: {
          name: 'Test Session Restrict',
          year: 2024,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          status: SessionStatus.active,
        },
      });

      // Create an application
      await service.application.create({
        data: {
          studentId: student.id,
          sessionId: session.id,
          majorId: major.id,
          admissionMethod: 'entrance_exam',
          preferencePriority: 1,
          subjectScores: { math: 8, physics: 7, chemistry: 9 },
          admissionStatus: AdmissionStatus.pending,
        },
      });

      // Attempt to delete the major - should fail
      await expect(
        service.major.delete({ where: { id: major.id } }),
      ).rejects.toThrow();

      // Cleanup - delete in correct order
      await service.student.delete({ where: { id: student.id } });
      await service.admissionSession.delete({ where: { id: session.id } });
      await service.major.delete({ where: { id: major.id } });
    });

    it('should prevent deletion of session if applications reference it (restrict)', async () => {
      // Create a student
      const student = await service.student.create({
        data: {
          idCard: 'TEST-SESSION-001',
          fullName: 'Test Student Session',
          dateOfBirth: new Date('2000-01-01'),
          email: 'session@test.com',
        },
      });

      // Create a major
      const major = await service.major.create({
        data: {
          code: 'TEST-SESSION-MAJ',
          name: 'Test Major Session',
          subjectCombinations: { combinations: ['A00'] },
        },
      });

      // Create a session
      const session = await service.admissionSession.create({
        data: {
          name: 'Test Session Delete',
          year: 2024,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          status: SessionStatus.active,
        },
      });

      // Create an application
      await service.application.create({
        data: {
          studentId: student.id,
          sessionId: session.id,
          majorId: major.id,
          admissionMethod: 'entrance_exam',
          preferencePriority: 1,
          subjectScores: { math: 8, physics: 7, chemistry: 9 },
          admissionStatus: AdmissionStatus.pending,
        },
      });

      // Attempt to delete the session - should fail
      await expect(
        service.admissionSession.delete({ where: { id: session.id } }),
      ).rejects.toThrow();

      // Cleanup - delete in correct order
      await service.student.delete({ where: { id: student.id } });
      await service.admissionSession.delete({ where: { id: session.id } });
      await service.major.delete({ where: { id: major.id } });
    });

    it('should cascade delete user role assignments when user is deleted', async () => {
      // Create a user
      const user = await service.user.create({
        data: {
          username: 'test-cascade-user',
          passwordHash: 'hash',
          email: 'cascade-user@test.com',
          fullName: 'Test Cascade User',
        },
      });

      // Create a role
      const role = await service.role.create({
        data: {
          name: 'test-cascade-role',
          description: 'Test Role for Cascade',
        },
      });

      // Assign role to user
      const userRole = await service.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });

      // Delete the user - should cascade delete the user role assignment
      await service.user.delete({ where: { id: user.id } });

      // Verify user role was deleted
      const deletedUserRole = await service.userRole.findUnique({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: role.id,
          },
        },
      });
      expect(deletedUserRole).toBeNull();

      // Cleanup
      await service.role.delete({ where: { id: role.id } });
    });

    it('should enforce referential integrity between roles and permissions', async () => {
      // Create a permission
      const permission = await service.permission.create({
        data: {
          name: 'test-permission-integrity',
          description: 'Test Permission',
        },
      });

      // Create a role
      const role = await service.role.create({
        data: {
          name: 'test-role-integrity',
          description: 'Test Role',
        },
      });

      // Assign permission to role
      await service.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });

      // Delete the role - should cascade delete the role permission
      await service.role.delete({ where: { id: role.id } });

      // Verify role permission was deleted
      const deletedRolePermission = await service.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
      });
      expect(deletedRolePermission).toBeNull();

      // Cleanup
      await service.permission.delete({ where: { id: permission.id } });
    });
  });
});
