import { Controller, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Public - Result Lookup')
@Controller('public/results')
export class ResultLookupController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public endpoint to lookup admission result by ID card number
   * GET /public/results/lookup/:idCardNumber
   * No authentication required
   */
  @Get('lookup/:idCardNumber')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lookup admission result by ID card',
    description:
      'Public endpoint for students to check their admission results using ID card number. No authentication required.',
  })
  @ApiParam({
    name: 'idCardNumber',
    description: 'Student ID card number (CMND/CCCD)',
    example: '001234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Result found successfully',
    schema: {
      type: 'object',
      properties: {
        student: {
          type: 'object',
          properties: {
            fullName: { type: 'string', example: 'Nguyễn Văn A' },
            idCardNumber: { type: 'string', example: '001234567890' },
            dateOfBirth: { type: 'string', example: '2005-05-15' },
          },
        },
        program: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Công nghệ thông tin' },
            code: { type: 'string', example: 'CNTT01' },
          },
        },
        session: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Tuyển sinh 2024' },
          },
        },
        status: {
          type: 'string',
          enum: ['accepted', 'rejected', 'pending'],
          example: 'accepted',
        },
        score: { type: 'number', example: 27.5 },
        ranking: { type: 'number', example: 15, nullable: true },
        admissionMethod: {
          type: 'string',
          example: 'Xét tuyển theo điểm thi THPT',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'No result found for this ID card' })
  async lookupResult(@Param('idCardNumber') idCardNumber: string) {
    // Find student by ID card
    const student = await this.prisma.student.findUnique({
      where: { idCard: idCardNumber },
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

    if (!student || !student.applications || student.applications.length === 0) {
      return null; // Will return 404 via NestJS
    }

    // Get the first application (highest priority)
    const application = student.applications[0];

    // Map admission status to public status
    let status: 'accepted' | 'rejected' | 'pending';
    if (application.admissionStatus === 'admitted') {
      status = 'accepted';
    } else if (application.admissionStatus === 'not_admitted') {
      status = 'rejected';
    } else {
      status = 'pending';
    }

    // Return formatted result
    return {
      student: {
        fullName: student.fullName,
        idCardNumber: student.idCard,
        dateOfBirth: student.dateOfBirth.toISOString().split('T')[0],
      },
      program: {
        name: application.major.name,
        code: application.major.code,
      },
      session: {
        name: application.session.name,
      },
      status,
      score: application.calculatedScore
        ? Number(application.calculatedScore)
        : 0,
      ranking: application.rankInMajor || null,
      admissionMethod: application.admissionMethod,
    };
  }
}

