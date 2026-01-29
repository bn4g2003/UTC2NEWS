import { Injectable, NotFoundException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { CreateQuotaDto } from './dto/create-quota.dto';
import { UpdateQuotaDto } from './dto/update-quota.dto';

@Injectable()
export class ProgramService {
  private readonly logger = new Logger(ProgramService.name);

  constructor(private readonly prisma: PrismaService) { }

  // Major CRUD methods
  async createMajor(data: CreateMajorDto) {
    try {
      return await this.prisma.major.create({
        data: {
          code: data.code,
          name: data.name,
          subjectCombinations: data.subjectCombinations,
          description: data.description,
          isActive: data.isActive ?? true,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Major with this code already exists');
      }
      this.logger.error(`Error creating major: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAllMajors(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {};

    return await this.prisma.major.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMajorById(id: string) {
    const major = await this.prisma.major.findUnique({
      where: { id },
      include: {
        quotas: {
          include: {
            session: true,
          },
        },
      },
    });

    if (!major) {
      throw new NotFoundException(`Major with ID ${id} not found`);
    }

    return major;
  }

  async findMajorByCode(code: string) {
    const major = await this.prisma.major.findUnique({
      where: { code },
    });

    if (!major) {
      throw new NotFoundException(`Major with code ${code} not found`);
    }

    return major;
  }

  async updateMajor(id: string, data: UpdateMajorDto) {
    try {
      return await this.prisma.major.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Major with ID ${id} not found`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Major with this code already exists');
      }
      this.logger.error(`Error updating major: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteMajor(id: string) {
    try {
      // Check if major has applications
      const applicationsCount = await this.prisma.application.count({
        where: { majorId: id },
      });

      if (applicationsCount > 0) {
        throw new ConflictException(
          'Cannot delete major with existing applications',
        );
      }

      return await this.prisma.major.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Major with ID ${id} not found`);
      }
      this.logger.error(`Error deleting major: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Admission Session CRUD methods
  async createSession(data: CreateSessionDto) {
    try {
      return await this.prisma.admissionSession.create({
        data: {
          name: data.name,
          year: data.year,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          status: data.status,
        },
      });
    } catch (error) {
      this.logger.error(`Error creating session: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAllSessions() {
    return await this.prisma.admissionSession.findMany({
      orderBy: { year: 'desc' },
    });
  }

  async findSessionById(id: string) {
    const session = await this.prisma.admissionSession.findUnique({
      where: { id },
      include: {
        quotas: {
          include: {
            major: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Admission session with ID ${id} not found`);
    }

    return session;
  }

  async updateSession(id: string, data: UpdateSessionDto) {
    try {
      const updateData: any = { ...data };

      if (data.startDate) {
        updateData.startDate = new Date(data.startDate);
      }

      if (data.endDate) {
        updateData.endDate = new Date(data.endDate);
      }

      return await this.prisma.admissionSession.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Admission session with ID ${id} not found`);
      }
      this.logger.error(`Error updating session: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteSession(id: string) {
    try {
      // Check if session has applications
      const applicationsCount = await this.prisma.application.count({
        where: { sessionId: id },
      });

      if (applicationsCount > 0) {
        throw new ConflictException(
          `Cannot delete session with ${applicationsCount} existing application(s). Please delete or reassign applications first.`,
        );
      }

      // Check if session has quotas
      const quotasCount = await this.prisma.sessionQuota.count({
        where: { sessionId: id },
      });

      if (quotasCount > 0) {
        throw new ConflictException(
          `Cannot delete session with ${quotasCount} existing quota(s). Please delete quotas first.`,
        );
      }

      return await this.prisma.admissionSession.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Admission session with ID ${id} not found`);
      }
      this.logger.error(`Error deleting session: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Quota configuration methods
  async createQuota(data: CreateQuotaDto) {
    try {
      // Validate quota is positive integer
      if (data.quota <= 0 || !Number.isInteger(data.quota)) {
        throw new BadRequestException('Quota must be a positive integer');
      }

      // Verify session exists
      const session = await this.prisma.admissionSession.findUnique({
        where: { id: data.sessionId },
      });

      if (!session) {
        throw new NotFoundException(`Admission session with ID ${data.sessionId} not found`);
      }

      // Verify major exists
      const major = await this.prisma.major.findUnique({
        where: { id: data.majorId },
      });

      if (!major) {
        throw new NotFoundException(`Major with ID ${data.majorId} not found`);
      }

      return await this.prisma.sessionQuota.create({
        data: {
          sessionId: data.sessionId,
          majorId: data.majorId,
          formulaId: data.formulaId,
          quota: data.quota,
          conditions: data.conditions as any,
        },
        include: {
          session: true,
          major: true,
          formula: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Quota for this session and major already exists',
        );
      }
      if (error.code === 'P2003') {
        throw new NotFoundException('Session or major not found');
      }
      this.logger.error(`Error creating quota: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAllQuotas(sessionId?: string) {
    const where = sessionId ? { sessionId } : {};

    return await this.prisma.sessionQuota.findMany({
      where,
      include: {
        session: true,
        major: true,
        formula: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findQuotaById(id: string) {
    const quota = await this.prisma.sessionQuota.findUnique({
      where: { id },
      include: {
        session: true,
        major: true,
        formula: true,
      },
    });

    if (!quota) {
      throw new NotFoundException(`Quota with ID ${id} not found`);
    }

    return quota;
  }

  async updateQuota(id: string, data: UpdateQuotaDto) {
    try {
      // Validate quota is positive integer if provided
      if (data.quota !== undefined) {
        if (data.quota <= 0 || !Number.isInteger(data.quota)) {
          throw new BadRequestException('Quota must be a positive integer');
        }
      }

      return await this.prisma.sessionQuota.update({
        where: { id },
        data: {
          ...data,
          conditions: data.conditions as any, // Cast to any to satisfy Prisma's InputJsonValue type
        },
        include: {
          session: true,
          major: true,
          formula: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Quota with ID ${id} not found`);
      }
      this.logger.error(`Error updating quota: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteQuota(id: string) {
    try {
      return await this.prisma.sessionQuota.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Quota with ID ${id} not found`);
      }
      this.logger.error(`Error deleting quota: ${error.message}`, error.stack);
      throw error;
    }
  }
}
