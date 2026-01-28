import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScoreCalculationService } from '../score/score-calculation.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { AddPreferenceDto } from './dto/add-preference.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';

@Injectable()
export class StudentService {
  constructor(
    private prisma: PrismaService,
    private scoreCalculationService: ScoreCalculationService,
  ) { }

  /**
   * Create a new student with validation
   */
  async createStudent(createStudentDto: CreateStudentDto) {
    // Check for duplicate ID card
    const existingStudent = await this.prisma.student.findUnique({
      where: { idCard: createStudentDto.idCard },
    });

    if (existingStudent) {
      throw new ConflictException(
        `Student with ID Card ${createStudentDto.idCard} already exists`,
      );
    }

    // Create student
    const student = await this.prisma.student.create({
      data: {
        idCard: createStudentDto.idCard,
        fullName: createStudentDto.fullName,
        dateOfBirth: new Date(createStudentDto.dateOfBirth),
        email: createStudentDto.email,
        phone: createStudentDto.phone,
        address: createStudentDto.address,
        priorityPoints: createStudentDto.priorityPoints ?? 0,
        sessionId: createStudentDto.sessionId,
        scores: createStudentDto.scores,
        photo3x4: createStudentDto.photo3x4,
        idCardPhoto: createStudentDto.idCardPhoto,
        documentPdf: createStudentDto.documentPdf,
      },
    });

    return student;
  }

  /**
   * Get all students with optional filtering and pagination
   */
  async findAllStudents(params?: {
    skip?: number;
    take?: number;
    search?: string;
    sessionId?: string;
  }) {
    const { skip, take, search, sessionId } = params || {};

    const where: any = {};

    // Search by ID card, name, email, or phone
    if (search) {
      where.OR = [
        { idCard: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by session
    if (sessionId) {
      where.sessionId = sessionId;
    }

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take,
        include: {
          applications: {
            include: {
              major: true,
              session: true,
            },
            orderBy: {
              preferencePriority: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      data: students.map(s => ({
        ...s,
        priorityPoints: s.priorityPoints ? Number(s.priorityPoints) : 0,
        applications: (s.applications || []).map(app => ({
          ...app,
          calculatedScore: app.calculatedScore ? Number(app.calculatedScore) : null,
        }))
      })),
      total,
      page: skip && take ? Math.floor(skip / take) + 1 : 1,
      pageSize: take || total,
    };
  }

  /**
   * Update an existing student
   */
  async updateStudent(id: string, updateStudentDto: UpdateStudentDto) {
    // Check if student exists
    const existingStudent = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!existingStudent) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    // If updating ID card, check for duplicates
    if (
      updateStudentDto.idCard &&
      updateStudentDto.idCard !== existingStudent.idCard
    ) {
      const duplicateStudent = await this.prisma.student.findUnique({
        where: { idCard: updateStudentDto.idCard },
      });

      if (duplicateStudent) {
        throw new ConflictException(
          `Student with ID Card ${updateStudentDto.idCard} already exists`,
        );
      }
    }

    // Update student
    const updateData: any = {};
    if (updateStudentDto.idCard) updateData.idCard = updateStudentDto.idCard;
    if (updateStudentDto.fullName)
      updateData.fullName = updateStudentDto.fullName;
    if (updateStudentDto.dateOfBirth)
      updateData.dateOfBirth = new Date(updateStudentDto.dateOfBirth);
    if (updateStudentDto.email !== undefined)
      updateData.email = updateStudentDto.email;
    if (updateStudentDto.phone !== undefined)
      updateData.phone = updateStudentDto.phone;
    if (updateStudentDto.address !== undefined)
      updateData.address = updateStudentDto.address;
    if (updateStudentDto.priorityPoints !== undefined)
      updateData.priorityPoints = updateStudentDto.priorityPoints;
    if (updateStudentDto.sessionId) updateData.sessionId = updateStudentDto.sessionId;
    if (updateStudentDto.scores !== undefined) updateData.scores = updateStudentDto.scores;
    if (updateStudentDto.photo3x4 !== undefined) updateData.photo3x4 = updateStudentDto.photo3x4;
    if (updateStudentDto.idCardPhoto !== undefined) updateData.idCardPhoto = updateStudentDto.idCardPhoto;
    if (updateStudentDto.documentPdf !== undefined) updateData.documentPdf = updateStudentDto.documentPdf;

    const student = await this.prisma.student.update({
      where: { id },
      data: updateData,
    });

    return student;
  }

  /**
   * Get a student by ID with their applications
   */
  async getStudent(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            major: true,
            session: true,
          },
          orderBy: {
            preferencePriority: 'asc',
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    // Merge latest student scores into applications for display consistency
    const studentWithLatestScores = {
      ...student,
      applications: student.applications.map(app => {
        const studentScores = student.scores as Record<string, number> | null;
        // detailed logic: if student has scores, show them. Otherwise fall back to what's saved in app.
        const subjectScores = (studentScores && Object.keys(studentScores).length > 0)
          ? studentScores
          : app.subjectScores;

        return {
          ...app,
          subjectScores,
          // Recalculate displayed score might be misleading if we don't actually run the calculation logic here,
          // but mainly we want to show the correct input scores.
        };
      })
    };

    return studentWithLatestScores;
  }

  /**
   * Add a preference (application) for a student
   */
  async addPreference(studentId: string, addPreferenceDto: AddPreferenceDto) {
    // Check if student exists
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    // Validate session exists
    const session = await this.prisma.admissionSession.findUnique({
      where: { id: addPreferenceDto.sessionId },
    });

    if (!session) {
      throw new BadRequestException(
        `Admission session ${addPreferenceDto.sessionId} not found`,
      );
    }

    // Validate major code exists
    const major = await this.prisma.major.findUnique({
      where: { code: addPreferenceDto.majorCode },
    });

    if (!major) {
      throw new BadRequestException(
        `Major with code ${addPreferenceDto.majorCode} not found`,
      );
    }

    // Check if preference priority already exists for this student and session
    const existingPreference = await this.prisma.application.findUnique({
      where: {
        studentId_sessionId_preferencePriority: {
          studentId: studentId,
          sessionId: addPreferenceDto.sessionId,
          preferencePriority: addPreferenceDto.preferencePriority,
        },
      },
    });

    if (existingPreference) {
      throw new ConflictException(
        `Preference priority ${addPreferenceDto.preferencePriority} already exists for this student in this session`,
      );
    }

    // Create application
    // Find quota to get formula
    const quota = await this.prisma.sessionQuota.findUnique({
      where: {
        sessionId_majorId: {
          sessionId: addPreferenceDto.sessionId,
          majorId: major.id,
        },
      },
      include: { formula: true },
    });

    const formulaId = quota?.formulaId;
    const conditions = quota?.conditions as any;

    const isEligible = this.scoreCalculationService.isEligibleForQuota(
      addPreferenceDto.subjectScores,
      conditions,
      Number(student.priorityPoints || 0),
    );

    const calculatedScore = isEligible && formulaId
      ? await this.scoreCalculationService.calculateDynamicScore(
        addPreferenceDto.subjectScores,
        Number(student.priorityPoints),
        formulaId,
        addPreferenceDto.admissionMethod || 'dynamic',
        { code: major.code, name: major.name },
      )
      : null;

    const application = await this.prisma.application.create({
      data: {
        studentId: studentId,
        sessionId: addPreferenceDto.sessionId,
        majorId: major.id,
        admissionMethod: addPreferenceDto.admissionMethod || 'dynamic',
        preferencePriority: addPreferenceDto.preferencePriority,
        subjectScores: addPreferenceDto.subjectScores,
        calculatedScore: calculatedScore,
        admissionStatus: isEligible ? 'pending' : 'not_admitted',
      },
      include: {
        major: true,
        session: true,
      },
    });

    return application;
  }

  /**
   * Update a preference (application) for a student
   */
  async updatePreference(
    studentId: string,
    preferenceId: string,
    updatePreferenceDto: UpdatePreferenceDto,
  ) {
    // Check if application exists and belongs to student
    const application = await this.prisma.application.findUnique({
      where: { id: preferenceId },
      include: { major: true }
    });

    if (!application) {
      throw new NotFoundException(`Preference with ID ${preferenceId} not found`);
    }

    if (application.studentId !== studentId) {
      throw new BadRequestException(
        `Preference ${preferenceId} does not belong to student ${studentId}`,
      );
    }

    // Validate major code if provided
    let majorId = application.majorId;
    if (updatePreferenceDto.majorCode) {
      const major = await this.prisma.major.findUnique({
        where: { code: updatePreferenceDto.majorCode },
      });

      if (!major) {
        throw new BadRequestException(
          `Major with code ${updatePreferenceDto.majorCode} not found`,
        );
      }
      majorId = major.id;
    }

    // Check for preference priority conflict if updating priority
    if (updatePreferenceDto.preferencePriority) {
      const existingPreference = await this.prisma.application.findUnique({
        where: {
          studentId_sessionId_preferencePriority: {
            studentId: studentId,
            sessionId: application.sessionId,
            preferencePriority: updatePreferenceDto.preferencePriority,
          },
        },
      });

      if (existingPreference && existingPreference.id !== preferenceId) {
        throw new ConflictException(
          `Preference priority ${updatePreferenceDto.preferencePriority} already exists for this student in this session`,
        );
      }
    }

    // Update application
    const updateData: any = {};
    if (majorId !== application.majorId) updateData.majorId = majorId;
    if (updatePreferenceDto.admissionMethod)
      updateData.admissionMethod = updatePreferenceDto.admissionMethod;
    if (updatePreferenceDto.preferencePriority)
      updateData.preferencePriority = updatePreferenceDto.preferencePriority;
    if (updatePreferenceDto.subjectScores)
      updateData.subjectScores = updatePreferenceDto.subjectScores;

    // Recalculate score if subject scores or major changed
    if (
      updatePreferenceDto.subjectScores ||
      majorId !== application.majorId
    ) {
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        throw new NotFoundException(`Student with ID ${studentId} not found`);
      }

      const finalScores =
        updatePreferenceDto.subjectScores || (application.subjectScores as any);

      // Find quota for major
      const quota = await this.prisma.sessionQuota.findUnique({
        where: {
          sessionId_majorId: {
            sessionId: application.sessionId,
            majorId: majorId,
          },
        },
        include: { formula: true },
      });

      const formulaId = quota?.formulaId;
      const conditions = quota?.conditions as any;

      const isEligible = this.scoreCalculationService.isEligibleForQuota(
        finalScores,
        conditions,
        Number(student.priorityPoints),
      );

      updateData.calculatedScore = isEligible && formulaId
        ? await this.scoreCalculationService.calculateDynamicScore(
          finalScores,
          Number(student.priorityPoints),
          formulaId,
          updatePreferenceDto.admissionMethod || application.admissionMethod,
          { code: (application as any).major?.code || '', name: (application as any).major?.name || '' },
        )
        : null;

      updateData.admissionStatus = isEligible ? 'pending' : 'not_admitted';
    }

    const updatedApplication = await this.prisma.application.update({
      where: { id: preferenceId },
      data: updateData,
      include: {
        major: true,
        session: true,
      },
    });

    return updatedApplication;
  }

  /**
   * Remove a preference (application) for a student
   */
  async removePreference(studentId: string, preferenceId: string) {
    // Check if application exists and belongs to student
    const application = await this.prisma.application.findUnique({
      where: { id: preferenceId },
    });

    if (!application) {
      throw new NotFoundException(`Preference with ID ${preferenceId} not found`);
    }

    if (application.studentId !== studentId) {
      throw new BadRequestException(
        `Preference ${preferenceId} does not belong to student ${studentId}`,
      );
    }

    // Delete application
    await this.prisma.application.delete({
      where: { id: preferenceId },
    });

    return { message: 'Preference removed successfully' };
  }
}
