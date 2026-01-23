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
  preference: number;
}

/**
 * Service for exporting admission results to Excel
 */
@Injectable()
export class ResultExportService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Format result data
    const resultData = await this.formatResultData(sessionId);

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    
    // Define headers
    const headers = [
      'Student ID',
      'ID Card',
      'Full Name',
      'Major Code',
      'Major Name',
      'Admission Method',
      'Final Score',
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
   * Format result data by querying admitted students with joins
   * @param sessionId - The admission session ID
   * @returns Array of formatted result rows
   */
  async formatResultData(sessionId: string): Promise<ResultRow[]> {
    // Query admitted students with all necessary joins
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
    const resultRows: ResultRow[] = admittedApplications.map((application) => ({
      studentId: application.student.id,
      idCard: application.student.idCard,
      fullName: application.student.fullName,
      majorCode: application.major.code,
      majorName: application.major.name,
      admissionMethod: application.admissionMethod,
      finalScore: Number(application.calculatedScore || 0),
      preference: application.preferencePriority,
    }));

    return resultRows;
  }
}
