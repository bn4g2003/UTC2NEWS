import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';
import { AdmissionStatus } from '@prisma/client';

/**
 * Interface for result row data
 */
export interface ResultRow {
  studentId: string;
  idCard: string;
  fullName: string;
  majorCode: string;
  majorName: string;
  admissionMethod: string;
  finalScore: number;
  ranking: number;
  preference: number;
  status?: string; // Add status field
}

/**
 * Service for exporting admission results to Excel
 */
@Injectable()
export class ResultExportService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Generate Excel file containing admission results for a session
   * @param sessionId - The admission session ID
   * @returns Buffer containing the Excel file
   */
  async generateResultExcel(sessionId: string): Promise<Buffer> {
    // Verify session exists
    const session = await this.prisma.admissionSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Admission session ${sessionId} not found`);
    }

    // Get only admitted students for official export
    const admittedApplications = await this.prisma.application.findMany({
      where: {
        sessionId,
        admissionStatus: AdmissionStatus.admitted,
      },
      include: {
        student: true,
        major: true,
      },
      orderBy: [
        { major: { code: 'asc' } },
        { calculatedScore: 'desc' },
      ],
    });

    // Format data into result rows
    const resultData: ResultRow[] = admittedApplications.map((application) => ({
      studentId: application.student.id,
      idCard: application.student.idCard,
      fullName: application.student.fullName,
      majorCode: application.major.code,
      majorName: application.major.name,
      admissionMethod: application.admissionMethod,
      finalScore: Number(application.calculatedScore || 0),
      ranking: application.rankInMajor || 0,
      preference: application.preferencePriority,
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();

    // Define headers
    const headers = [
      'Student ID',
      'ID Card',
      'Full Name',
      'Major Code',
      'Major Name',
      'Khối/Tổ hợp',
      'Final Score',
      'Ranking',
      'Preference',
    ];

    // Convert result data to array format for Excel
    const worksheetData = [
      headers,
      ...resultData.map((row) => [
        row.studentId,
        row.idCard,
        row.fullName,
        row.majorCode,
        row.majorName,
        row.admissionMethod,
        row.finalScore,
        row.ranking,
        row.preference,
      ]),
    ];

    // Create worksheet from data
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths for better readability
    worksheet['!cols'] = [
      { wch: 38 }, // Student ID (UUID)
      { wch: 15 }, // ID Card
      { wch: 30 }, // Full Name
      { wch: 12 }, // Major Code
      { wch: 40 }, // Major Name
      { wch: 20 }, // Admission Method
      { wch: 12 }, // Final Score
      { wch: 12 }, // Ranking
      { wch: 12 }, // Preference
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Admission Results');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    return excelBuffer;
  }

  /**
   * Format result data - return only students with their admitted application
   * Each student appears once with their accepted preference
   * @param sessionId - The admission session ID
   * @returns Array of formatted result rows (one per student)
   */
  async formatResultData(sessionId: string): Promise<ResultRow[]> {
    // Query only ADMITTED applications with all necessary joins
    const admittedApplications = await this.prisma.application.findMany({
      where: {
        sessionId,
        admissionStatus: AdmissionStatus.admitted,
      },
      include: {
        student: true,
        major: true,
      },
      orderBy: [
        { major: { code: 'asc' } },
        { calculatedScore: 'desc' },
      ],
    });

    // Format data into result rows - one row per student
    const resultRows: ResultRow[] = admittedApplications.map((application) => ({
      studentId: application.student.id,
      idCard: application.student.idCard,
      fullName: application.student.fullName,
      majorCode: application.major.code,
      majorName: application.major.name,
      admissionMethod: application.admissionMethod,
      finalScore: Number(application.calculatedScore || 0),
      ranking: application.rankInMajor || 0,
      preference: application.preferencePriority,
      status: 'admitted', // All results are admitted students
    }));

    return resultRows;
  }

  /**
   * Get all students with their admission status (for detailed view)
   * Returns students grouped by their final status
   * @param sessionId - The admission session ID
   * @returns Object with admitted and not admitted students
   */
  async getStudentResults(sessionId: string): Promise<{
    admitted: ResultRow[];
    notAdmitted: ResultRow[];
    all: ResultRow[];
  }> {
    // Get all students who applied to this session
    const students = await this.prisma.student.findMany({
      where: {
        applications: {
          some: {
            sessionId,
          },
        },
      },
      include: {
        applications: {
          where: {
            sessionId,
          },
          include: {
            major: true,
          },
          orderBy: {
            preferencePriority: 'asc',
          },
        },
      },
    });

    // Separate students into admitted and not admitted
    const admittedStudents: ResultRow[] = [];
    const notAdmittedStudents: ResultRow[] = [];

    for (const student of students) {
      // Find if student has any admitted application
      const admittedApp = student.applications.find(
        app => app.admissionStatus === AdmissionStatus.admitted
      );

      if (admittedApp) {
        // Student is admitted
        admittedStudents.push({
          studentId: student.id,
          idCard: student.idCard,
          fullName: student.fullName,
          majorCode: admittedApp.major.code,
          majorName: admittedApp.major.name,
          admissionMethod: admittedApp.admissionMethod,
          finalScore: Number(admittedApp.calculatedScore || 0),
          ranking: admittedApp.rankInMajor || 0,
          preference: admittedApp.preferencePriority,
          status: 'admitted',
        });
      } else {
        // Student is not admitted - show their best preference
        const bestApp = student.applications[0]; // Already sorted by priority
        if (bestApp) {
          notAdmittedStudents.push({
            studentId: student.id,
            idCard: student.idCard,
            fullName: student.fullName,
            majorCode: bestApp.major.code,
            majorName: bestApp.major.name,
            admissionMethod: bestApp.admissionMethod,
            finalScore: Number(bestApp.calculatedScore || 0),
            ranking: bestApp.rankInMajor || 0,
            preference: bestApp.preferencePriority,
            status: 'not_admitted',
          });
        }
      }
    }

    return {
      admitted: admittedStudents,
      notAdmitted: notAdmittedStudents,
      all: [...admittedStudents, ...notAdmittedStudents],
    };
  }
}
