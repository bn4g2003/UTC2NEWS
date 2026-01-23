import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ParsedStudentData, ParsedPreferenceData } from './dto/parsed-student-data.dto';
import { ValidationError } from './dto/validation-result.dto';

@Injectable()
export class ImportValidationService {
  constructor(private prisma: PrismaService) { }

  /**
   * Validates a student record for all required fields and business rules
   */
  validateStudentRecord(
    record: ParsedStudentData,
    rowNumber: number,
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate required fields
    errors.push(...this.validateRequiredFields(record, rowNumber));

    // Validate data formats and constraints
    if (record.idCard && record.idCard.length !== 12) {
      errors.push({
        row: rowNumber,
        field: 'idCard',
        message: 'Số CCCD phải có đúng 12 chữ số',
      });
    }

    if (record.priorityPoints < 0 || record.priorityPoints > 10) { // Increased limit as some places use 10 scale
      errors.push({
        row: rowNumber,
        field: 'priorityPoints',
        message: 'Priority points must be between 0 and 10',
      });
    }

    if (record.email && !this.isValidEmail(record.email)) {
      errors.push({
        row: rowNumber,
        field: 'email',
        message: 'Invalid email format',
      });
    }

    // Validate subject scores
    const hasScores = Object.keys(record.scores).length > 0;
    if (!hasScores) {
      errors.push({
        row: rowNumber,
        field: 'scores',
        message: 'At least one subject score is required',
      });
    }

    // Validate score values
    for (const [subject, score] of Object.entries(record.scores)) {
      if (score < 0 || score > 10) {
        errors.push({
          row: rowNumber,
          field: `scores.${subject}`,
          message: `Score for ${subject} must be between 0 and 10`,
        });
      }
    }

    return errors;
  }

  /**
   * Validates a preference record
   */
  validatePreferenceRecord(
    record: ParsedPreferenceData,
    rowNumber: number,
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!record.idCard || record.idCard.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'idCard',
        message: 'Số CCCD là bắt buộc',
      });
    } else if (record.idCard.length !== 12) {
      errors.push({
        row: rowNumber,
        field: 'idCard',
        message: 'Số CCCD phải có đúng 12 chữ số',
      });
    }

    if (!record.majorCode || record.majorCode.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'majorCode',
        message: 'Mã ngành là bắt buộc',
      });
    }

    if (record.priority <= 0) {
      errors.push({
        row: rowNumber,
        field: 'priority',
        message: 'Thứ tự nguyện vọng phải là số nguyên dương',
      });
    }

    return errors;
  }

  /**
   * Validates required fields are present
   */
  validateRequiredFields(
    record: ParsedStudentData,
    rowNumber: number,
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!record.idCard || record.idCard.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'idCard',
        message: 'ID Card is required',
      });
    }

    if (!record.fullName || record.fullName.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'fullName',
        message: 'Full Name is required',
      });
    }

    if (!record.dateOfBirth) {
      errors.push({
        row: rowNumber,
        field: 'dateOfBirth',
        message: 'Date of Birth is required',
      });
    } else if (isNaN(record.dateOfBirth.getTime())) {
      errors.push({
        row: rowNumber,
        field: 'dateOfBirth',
        message: 'Invalid Date of Birth format',
      });
    }

    return errors;
  }

  /**
   * Checks if an ID card already exists in the database
   */
  async checkDuplicateIdCard(idCard: string): Promise<boolean> {
    const existing = await this.prisma.student.findUnique({
      where: { idCard },
    });
    return existing !== null;
  }

  /**
   * Validates that all major codes exist in the database
   * Returns array of invalid major codes
   */
  async validateMajorCodes(majorCodes: string[]): Promise<string[]> {
    const uniqueCodes = [...new Set(majorCodes)];
    const majors = await this.prisma.major.findMany({
      where: {
        code: { in: uniqueCodes },
        isActive: true,
      },
      select: { code: true },
    });

    const validCodes = new Set(majors.map((m) => m.code));
    return uniqueCodes.filter((code) => !validCodes.has(code));
  }

  /**
   * Validates email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
