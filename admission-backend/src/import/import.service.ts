import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExcelImportService } from './excel-import.service';
import { ImportValidationService } from './import-validation.service';
import { ScoreCalculationService } from '../score/score-calculation.service';
import { ParsedStudentData, ParsedPreferenceData } from './dto/parsed-student-data.dto';
import { ImportResult } from './dto/import-result.dto';
import { ValidationError } from './dto/validation-result.dto';

@Injectable()
export class ImportService {
  constructor(
    private prisma: PrismaService,
    private excelImportService: ExcelImportService,
    private validationService: ImportValidationService,
    private scoreCalculationService: ScoreCalculationService,
  ) { }

  /**
   * Imports students from Excel file
   */
  async importStudents(
    fileBuffer: Buffer,
    sessionId: string,
  ): Promise<ImportResult> {
    const templateValidation = this.excelImportService.validateTemplate(fileBuffer);
    if (!templateValidation.isValid) {
      return { totalRecords: 0, successCount: 0, failureCount: 0, errors: templateValidation.errors };
    }

    const parsedData = this.excelImportService.parseStudentData(fileBuffer);
    const totalRecords = parsedData.length;

    if (totalRecords === 0) {
      return { totalRecords: 0, successCount: 0, failureCount: 0, errors: [{ row: 0, field: 'data', message: 'No student records found' }] };
    }

    const allErrors: ValidationError[] = [];
    const idCardMap = new Map<string, number[]>();

    for (let i = 0; i < parsedData.length; i++) {
      const record = parsedData[i];
      const rowNumber = i + 2;

      const recordErrors = this.validationService.validateStudentRecord(record, rowNumber);
      allErrors.push(...recordErrors);

      // Check for duplicate ID cards within file
      if (!idCardMap.has(record.idCard)) idCardMap.set(record.idCard, []);
      idCardMap.get(record.idCard)!.push(rowNumber);
    }

    for (const [idCard, rows] of idCardMap.entries()) {
      if (rows.length > 1) {
        rows.forEach(row => allErrors.push({ row, field: 'idCard', message: `Duplicate ID Card ${idCard} in file` }));
      }
    }

    if (allErrors.length > 0) {
      return { totalRecords, successCount: 0, failureCount: totalRecords, errors: allErrors };
    }

    const session = await this.prisma.admissionSession.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new BadRequestException(`Session ${sessionId} not found`);
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        for (const record of parsedData) {
          // Upsert student (update if exists, create if not)
          await tx.student.upsert({
            where: { idCard: record.idCard },
            update: {
              fullName: record.fullName,
              dateOfBirth: record.dateOfBirth,
              email: record.email,
              phone: record.phone,
              address: record.address,
              priorityPoints: record.priorityPoints,
              scores: record.scores as any,
              sessionId: sessionId,
            },
            create: {
              idCard: record.idCard,
              fullName: record.fullName,
              dateOfBirth: record.dateOfBirth,
              email: record.email,
              phone: record.phone,
              address: record.address,
              priorityPoints: record.priorityPoints,
              scores: record.scores as any,
              sessionId: sessionId,
            },
          });
        }
      });

      return { totalRecords, successCount: totalRecords, failureCount: 0, errors: [] };
    } catch (error) {
      console.error('ImportService: Error in preferences transaction:', error);
      return {
        totalRecords,
        successCount: 0,
        failureCount: totalRecords,
        errors: [{
          row: 0,
          field: 'transaction',
          message: error.message || 'Lỗi hệ thống trong quá trình lưu dữ liệu'
        }]
      };
    }
  }

  /**
   * Imports preferences from Excel file
   */
  async importPreferences(
    fileBuffer: Buffer,
    sessionId: string,
  ): Promise<ImportResult> {
    const parsedData = this.excelImportService.parsePreferenceData(fileBuffer);
    const totalRecords = parsedData.length;

    if (totalRecords === 0) {
      return { totalRecords: 0, successCount: 0, failureCount: 0, errors: [{ row: 0, field: 'data', message: 'No preference records found' }] };
    }

    const allErrors: ValidationError[] = [];
    const validPreferences: ParsedPreferenceData[] = [];

    // Step 1: Basic validation
    for (let i = 0; i < parsedData.length; i++) {
      const record = parsedData[i];
      const rowNumber = i + 2;
      const errors = this.validationService.validatePreferenceRecord(record, rowNumber);
      if (errors.length > 0) allErrors.push(...errors);
      else validPreferences.push(record);
    }

    // Step 2: Major code validation
    const majorCodes = [...new Set(validPreferences.map(p => p.majorCode))];
    const invalidMajors = await this.validationService.validateMajorCodes(majorCodes);
    if (invalidMajors.length > 0) {
      validPreferences.forEach((p, i) => {
        if (invalidMajors.includes(p.majorCode)) {
          allErrors.push({ row: i + 2, field: 'majorCode', message: `Invalid major code: ${p.majorCode}` });
        }
      });
    }

    if (allErrors.length > 0) {
      console.log(`ImportService: Found ${allErrors.length} validation errors`);
      return { totalRecords, successCount: 0, failureCount: totalRecords, errors: allErrors };
    }

    console.log(`ImportService: Starting import of ${validPreferences.length} valid preferences for session ${sessionId}`);

    // Step 3: Database import
    try {
      await this.prisma.$transaction(async (tx) => {
        for (const pref of validPreferences) {
          console.log(`ImportService: Processing preference for student ${pref.idCard}, major ${pref.majorCode}`);
          const student = await tx.student.findUnique({
            where: { idCard: pref.idCard },
          });

          if (!student) {
            throw new Error(`Không tìm thấy thí sinh có CCCD: ${pref.idCard}. Vui lòng import hồ sơ thí sinh trước.`);
          }

          const major = await tx.major.findUnique({
            where: { code: pref.majorCode },
          });

          if (!major) {
            throw new Error(`Không tìm thấy mã ngành: ${pref.majorCode}`);
          }

          // Calculate score if method is provided or student has scores
          const isEligible = this.scoreCalculationService.isEligible(
            student.scores as any,
            pref.admissionMethod || 'entrance_exam',
            pref.block
          );

          const calculatedScore = isEligible
            ? this.scoreCalculationService.calculateScore(
              student.scores as any,
              Number(student.priorityPoints),
              pref.admissionMethod || 'entrance_exam',
              pref.block
            )
            : null;

          await tx.application.upsert({
            where: {
              studentId_sessionId_preferencePriority: {
                studentId: student.id,
                sessionId: sessionId,
                preferencePriority: pref.priority,
              },
            },
            update: {
              majorId: major!.id,
              admissionMethod: pref.block || pref.admissionMethod || 'entrance_exam',
              subjectScores: student.scores as any,
              calculatedScore: calculatedScore,
              admissionStatus: isEligible ? 'pending' : 'not_admitted',
            },
            create: {
              studentId: student.id,
              sessionId: sessionId,
              majorId: major!.id,
              admissionMethod: pref.block || pref.admissionMethod || 'entrance_exam',
              preferencePriority: pref.priority,
              subjectScores: student.scores as any,
              calculatedScore: calculatedScore,
              admissionStatus: isEligible ? 'pending' : 'not_admitted',
            },
          });
        }
      });

      return { totalRecords, successCount: totalRecords, failureCount: 0, errors: [] };
    } catch (error) {
      console.error('ImportService: Error in preferences transaction:', error);
      return {
        totalRecords,
        successCount: 0,
        failureCount: totalRecords,
        errors: [{
          row: 0,
          field: 'transaction',
          message: error.message || 'Lỗi hệ thống trong quá trình lưu dữ liệu'
        }]
      };
    }
  }
}
