import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script to generate example Excel template for student data import
 */

// Define headers
const headers = [
  'ID Card',
  'Full Name',
  'Date of Birth',
  'Email',
  'Phone',
  'Address',
  'Priority Points',
  'Math',
  'Physics',
  'Chemistry',
  'Literature',
  'English',
  'Biology',
  'History',
  'Geography',
  'Preference 1 - Major Code',
  'Preference 1 - Method',
  'Preference 2 - Major Code',
  'Preference 2 - Method',
  'Preference 3 - Major Code',
  'Preference 3 - Method',
];

// Sample data rows
const sampleData = [
  [
    '001234567890',
    'Nguyen Van A',
    '2005-03-15',
    'nguyenvana@email.com',
    '0901234567',
    '123 Le Loi Street, District 1, Ho Chi Minh City',
    0.5,
    8.5,
    9.0,
    8.0,
    7.5,
    8.5,
    '',
    '',
    '',
    'CS',
    'entrance_exam',
    'EE',
    'entrance_exam',
    'ME',
    'high_school_transcript',
  ],
  [
    '001234567891',
    'Tran Thi B',
    '2005-07-22',
    'tranthib@email.com',
    '0912345678',
    '456 Nguyen Hue Street, District 1, Ho Chi Minh City',
    1.0,
    9.0,
    8.5,
    9.0,
    8.0,
    9.0,
    '',
    '',
    '',
    'EE',
    'entrance_exam',
    'CS',
    'entrance_exam',
    '',
    '',
  ],
  [
    '001234567892',
    'Le Van C',
    '2005-11-08',
    'levanc@email.com',
    '0923456789',
    '789 Tran Hung Dao Street, District 5, Ho Chi Minh City',
    0.0,
    7.5,
    8.0,
    7.0,
    9.0,
    8.5,
    7.5,
    8.0,
    7.5,
    'BA',
    'high_school_transcript',
    'EN',
    'high_school_transcript',
    '',
    '',
  ],
  [
    '001234567893',
    'Pham Thi D',
    '2005-01-30',
    'phamthid@email.com',
    '0934567890',
    '321 Vo Van Tan Street, District 3, Ho Chi Minh City',
    0.5,
    8.0,
    7.5,
    8.5,
    8.5,
    9.0,
    '',
    '',
    '',
    'EN',
    'entrance_exam',
    'BA',
    'entrance_exam',
    'CS',
    'high_school_transcript',
  ],
  [
    '001234567894',
    'Hoang Van E',
    '2005-05-18',
    'hoangvane@email.com',
    '0945678901',
    '654 Hai Ba Trung Street, District 1, Ho Chi Minh City',
    0.0,
    9.5,
    9.0,
    9.5,
    8.0,
    8.5,
    '',
    '',
    '',
    'CS',
    'entrance_exam',
    'EE',
    'entrance_exam',
    'ME',
    'entrance_exam',
  ],
];

// Create workbook
const workbook = XLSX.utils.book_new();

// Create worksheet with headers and data
const worksheetData = [headers, ...sampleData];
const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

// Set column widths for better readability
const columnWidths = [
  { wch: 15 }, // ID Card
  { wch: 20 }, // Full Name
  { wch: 12 }, // Date of Birth
  { wch: 25 }, // Email
  { wch: 12 }, // Phone
  { wch: 40 }, // Address
  { wch: 15 }, // Priority Points
  { wch: 8 },  // Math
  { wch: 8 },  // Physics
  { wch: 10 }, // Chemistry
  { wch: 10 }, // Literature
  { wch: 8 },  // English
  { wch: 8 },  // Biology
  { wch: 8 },  // History
  { wch: 10 }, // Geography
  { wch: 20 }, // Preference 1 - Major Code
  { wch: 20 }, // Preference 1 - Method
  { wch: 20 }, // Preference 2 - Major Code
  { wch: 20 }, // Preference 2 - Method
  { wch: 20 }, // Preference 3 - Major Code
  { wch: 20 }, // Preference 3 - Method
];
worksheet['!cols'] = columnWidths;

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Data');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write to file
const outputPath = path.join(outputDir, 'student-import-template.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`✅ Excel template generated successfully at: ${outputPath}`);
console.log('\nTemplate includes:');
console.log('- Required column headers');
console.log('- 5 sample student records');
console.log('- Proper formatting and column widths');
console.log('\nColumn descriptions:');
console.log('- ID Card: Student identification number (required)');
console.log('- Full Name: Student full name (required)');
console.log('- Date of Birth: Format YYYY-MM-DD (required)');
console.log('- Email: Student email address (optional)');
console.log('- Phone: Student phone number (optional)');
console.log('- Address: Student address (optional)');
console.log('- Priority Points: Additional points (0-3, default 0)');
console.log('- Subject scores: Math, Physics, Chemistry, Literature, English, Biology, History, Geography (0-10)');
console.log('- Preferences: Up to 3 preferences with Major Code and Admission Method');
console.log('\nAdmission Methods:');
console.log('- entrance_exam: Based on entrance exam scores');
console.log('- high_school_transcript: Based on high school grades');
console.log('- direct_admission: Direct admission (special cases)');
