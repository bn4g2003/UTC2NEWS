import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import {
  ParsedStudentData,
  ParsedPreferenceData,
  PreferenceData,
  SubjectScores,
} from './dto/parsed-student-data.dto';
import {
  ValidationError,
  ValidationResult,
} from './dto/validation-result.dto';

@Injectable()
export class ExcelImportService {
  /**
   * Validates that the Excel file matches the expected template structure
   */
  validateTemplate(fileBuffer: Buffer): ValidationResult {
    const errors: ValidationError[] = [];

    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

      // Check if workbook has at least one sheet
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        errors.push({
          row: 0,
          field: 'workbook',
          message: 'Excel file must contain at least one sheet',
        });
        return { isValid: false, errors };
      }

      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      // Check if sheet has data
      if (!data || data.length === 0) {
        errors.push({
          row: 0,
          field: 'sheet',
          message: 'Excel sheet is empty',
        });
        return { isValid: false, errors };
      }

      // Validate header row (first row)
      const headers = data[0] as string[];

      // Create a flexible header mapping
      const headerMap = new Map<string, string>();
      headers.forEach(header => {
        const normalized = header.toLowerCase().trim();
        headerMap.set(normalized, header);
      });

      // Required headers with flexible matching
      const requiredHeaderPatterns = [
        { pattern: /^id\s*card$/i, name: 'ID Card' },
        { pattern: /^full\s*name$/i, name: 'Full Name' },
        { pattern: /^date\s*of\s*birth$/i, name: 'Date of Birth' },
      ];

      // Check only essential columns
      for (const { pattern, name } of requiredHeaderPatterns) {
        const found = headers.some(h => pattern.test(h));
        if (!found) {
          errors.push({
            row: 1,
            field: 'header',
            message: `Missing required column: ${name}`,
          });
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      errors.push({
        row: 0,
        field: 'file',
        message: `Failed to parse Excel file: ${error.message}`,
      });
      return { isValid: false, errors };
    }
  }

  /**
   * Parses student data from Excel file
   */
  parseStudentData(fileBuffer: Buffer): ParsedStudentData[] {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet);

    const students: ParsedStudentData[] = [];

    for (const row of data) {
      const student = this.parseStudentRow(row);
      if (student) {
        students.push(student);
      }
    }

    return students;
  }

  /**
   * Parses preference data from Excel file
   */
  parsePreferenceData(fileBuffer: Buffer): ParsedPreferenceData[] {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet);
    console.log(`ExcelImportService: Parsed ${data.length} rows from Excel`);
    if (data.length > 0) {
      console.log('ExcelImportService: Sample row keys:', Object.keys(data[0] as any));
    }

    const preferences: ParsedPreferenceData[] = [];

    let rowIndex = 0;
    for (const record of data) {
      const row = record as any;
      if (rowIndex === 0) {
        console.log('ExcelImportService: First raw row:', JSON.stringify(row));
      }

      // Normalize headers: lowercase and remove spaces/underscores/dashes
      const normalizedRow: any = {};
      Object.keys(row).forEach(key => {
        const normalizedKey = key.toLowerCase().replace(/[\s_-]/g, '');
        normalizedRow[normalizedKey] = row[key];
      });

      if (rowIndex === 0) {
        console.log('ExcelImportService: First normalized row:', normalizedRow);
      }
      rowIndex++;

      let idCard = String(normalizedRow['idcard'] || normalizedRow['cmnd'] || normalizedRow['cccd'] || '').trim();
      if (idCard && /^\d+$/.test(idCard) && idCard.length < 12) {
        idCard = idCard.padStart(12, '0');
      }

      const majorCode = String(normalizedRow['majorcode'] || normalizedRow['mãngành'] || '').trim();
      const priority = parseInt(normalizedRow['preferenceorder'] || normalizedRow['preferenceorder'] || normalizedRow['stt'] || normalizedRow['sốthứtự'] || normalizedRow['priority'] || normalizedRow['order'] || '1');
      const block = String(normalizedRow['block'] || normalizedRow['tổhợp'] || '').trim();
      const admissionMethod = String(normalizedRow['method'] || normalizedRow['phươngthức'] || 'entrance_exam').trim();

      if (idCard && majorCode) {
        preferences.push({
          idCard,
          majorCode,
          priority: isNaN(priority) ? 1 : priority,
          block,
          admissionMethod: String(admissionMethod).trim(),
        });
      }
    }

    return preferences;
  }

  /**
   * Parses a single student row from Excel
   */
  private parseStudentRow(record: any): ParsedStudentData | null {
    try {
      const row = record as any;
      // Normalize headers: lowercase and remove spaces/underscores/dashes
      const normalizedRow: any = {};
      Object.keys(row).forEach(key => {
        const normalizedKey = key.toLowerCase().replace(/[\s_-]/g, '');
        normalizedRow[normalizedKey] = row[key];
      });

      // Parse subject scores using normalized keys
      const scores: SubjectScores = {};
      const subjectMap = {
        'math': ['math', 'toán', 'toanhoc'],
        'physics': ['physics', 'lý', 'vậtlý', 'vatly'],
        'chemistry': ['chemistry', 'hóa', 'hóahọc', 'hoahoc'],
        'biology': ['biology', 'sinh', 'sinhhọc', 'sinhhoc'],
        'literature': ['literature', 'văn', 'ngữvăn', 'nguvan'],
        'history': ['history', 'sử', 'lịchsử', 'lichsu'],
        'geography': ['geography', 'địa', 'địalý', 'dialy'],
        'english': ['english', 'anh', 'tiếnganh', 'tienganh'],
        'civic_education': ['gdcd', 'giáodụccôngdân', 'giaoducongdan'],
        'technology': ['côngnghệ', 'congnghe', 'technology'],
        'informatics': ['tinhọc', 'tinhoc', 'informatics'],
      };

      for (const [key, patterns] of Object.entries(subjectMap)) {
        for (const pattern of patterns) {
          if (normalizedRow[pattern] !== undefined && normalizedRow[pattern] !== null && normalizedRow[pattern] !== '') {
            const score = parseFloat(normalizedRow[pattern]);
            if (!isNaN(score)) {
              scores[key] = score;
              break;
            }
          }
        }
      }

      // Parse date of birth
      let dateOfBirth: Date;
      const dobVal = normalizedRow['dateofbirth'] || normalizedRow['ngàysinh'] || normalizedRow['ngaysinh'];
      if (dobVal) {
        if (typeof dobVal === 'number') {
          const parsedDate = XLSX.SSF.parse_date_code(dobVal);
          dateOfBirth = new Date(parsedDate.y, parsedDate.m - 1, parsedDate.d);
        } else {
          dateOfBirth = new Date(dobVal);
        }
      } else {
        dateOfBirth = new Date();
      }

      // Parse ID Card - Pad to 12 digits
      let idCard = String(normalizedRow['idcard'] || normalizedRow['cmnd'] || normalizedRow['cccd'] || '').trim();
      if (idCard && /^\d+$/.test(idCard) && idCard.length < 12) {
        idCard = idCard.padStart(12, '0');
      }

      // Parse Phone - Pad to 10 digits
      let phone = String(normalizedRow['phone'] || normalizedRow['sđt'] || normalizedRow['sdt'] || normalizedRow['sốđiệnthoại'] || normalizedRow['sodienthoai'] || '').trim();
      if (phone && /^\d+$/.test(phone) && phone.length < 10) {
        phone = phone.padStart(10, '0');
      }

      return {
        idCard,
        fullName: String(normalizedRow['fullname'] || normalizedRow['họtên'] || normalizedRow['hoten'] || '').trim(),
        dateOfBirth,
        email: normalizedRow['email'] ? String(normalizedRow['email']).trim() : undefined,
        phone: phone || undefined,
        address: normalizedRow['address'] || normalizedRow['địachỉ'] || normalizedRow['diachi'] ? String(normalizedRow['address'] || normalizedRow['địachỉ'] || normalizedRow['diachi']).trim() : undefined,
        priorityPoints: parseFloat(normalizedRow['prioritypoints'] || normalizedRow['điểmcộng'] || normalizedRow['diemcong'] || '0'),
        scores,
      };
    } catch (error) {
      console.error('Error parsing student row:', error);
      return null;
    }
  }
}
