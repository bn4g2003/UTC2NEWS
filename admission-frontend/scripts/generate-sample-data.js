/**
 * Script to generate sample Excel file with 10 students
 * Run: node scripts/generate-sample-data.js
 */

const XLSX = require('xlsx');
const path = require('path');

// Dữ liệu mẫu 10 thí sinh
const sampleData = [
  {
    'ID Card': '001234567890',
    'Full Name': 'Nguyen Van An',
    'Date of Birth': '2005-03-15',
    'Email': 'nguyenvanan@email.com',
    'Phone': '0901234567',
    'Address': '123 Le Loi Street, District 1, Ho Chi Minh City',
    'Priority Points': 0.5,
    'Math': 8.5,
    'Physics': 9.0,
    'Chemistry': 8.0,
    'Literature': 7.5,
    'English': 8.5,
    'Biology': '',
    'History': '',
    'Geography': '',
    'Preference 1 - Major Code': 'CS',
    'Preference 1 - Method': 'entrance_exam',
    'Preference 2 - Major Code': 'EE',
    'Preference 2 - Method': 'entrance_exam',
    'Preference 3 - Major Code': 'ME',
    'Preference 3 - Method': 'high_school_transcript',
  },
  {
    'ID Card': '001234567891',
    'Full Name': 'Tran Thi Binh',
    'Date of Birth': '2005-07-22',
    'Email': 'tranthibinh@email.com',
    'Phone': '0912345678',
    'Address': '456 Nguyen Hue Street, District 1, Ho Chi Minh City',
    'Priority Points': 1.0,
    'Math': 9.0,
    'Physics': 8.5,
    'Chemistry': 9.0,
    'Literature': 8.0,
    'English': 9.0,
    'Biology': '',
    'History': '',
    'Geography': '',
    'Preference 1 - Major Code': 'EE',
    'Preference 1 - Method': 'entrance_exam',
    'Preference 2 - Major Code': 'CS',
    'Preference 2 - Method': 'entrance_exam',
    'Preference 3 - Major Code': '',
    'Preference 3 - Method': '',
  },
  {
    'ID Card': '001234567892',
    'Full Name': 'Le Van Cuong',
    'Date of Birth': '2005-11-08',
    'Email': 'levancuong@email.com',
    'Phone': '0923456789',
    'Address': '789 Tran Hung Dao Street, District 5, Ho Chi Minh City',
    'Priority Points': 0,
    'Math': 7.5,
    'Physics': 8.0,
    'Chemistry': 7.0,
    'Literature': 9.0,
    'English': 8.5,
    'Biology': 7.5,
    'History': 8.0,
    'Geography': 7.5,
    'Preference 1 - Major Code': 'BA',
    'Preference 1 - Method': 'high_school_transcript',
    'Preference 2 - Major Code': 'EN',
    'Preference 2 - Method': 'high_school_transcript',
    'Preference 3 - Major Code': '',
    'Preference 3 - Method': '',
  },
  {
    'ID Card': '001234567893',
    'Full Name': 'Pham Thi Dung',
    'Date of Birth': '2005-01-30',
    'Email': 'phamthidung@email.com',
    'Phone': '0934567890',
    'Address': '321 Vo Van Tan Street, District 3, Ho Chi Minh City',
    'Priority Points': 0.5,
    'Math': 8.0,
    'Physics': 7.5,
    'Chemistry': 8.5,
    'Literature': 8.5,
    'English': 9.0,
    'Biology': '',
    'History': '',
    'Geography': '',
    'Preference 1 - Major Code': 'EN',
    'Preference 1 - Method': 'entrance_exam',
    'Preference 2 - Major Code': 'BA',
    'Preference 2 - Method': 'entrance_exam',
    'Preference 3 - Major Code': 'CS',
    'Preference 3 - Method': 'high_school_transcript',
  },
  {
    'ID Card': '001234567894',
    'Full Name': 'Hoang Van Em',
    'Date of Birth': '2005-05-18',
    'Email': 'hoangvanem@email.com',
    'Phone': '0945678901',
    'Address': '654 Hai Ba Trung Street, District 1, Ho Chi Minh City',
    'Priority Points': 0,
    'Math': 9.5,
    'Physics': 9.0,
    'Chemistry': 9.5,
    'Literature': 8.0,
    'English': 8.5,
    'Biology': '',
    'History': '',
    'Geography': '',
    'Preference 1 - Major Code': 'CS',
    'Preference 1 - Method': 'entrance_exam',
    'Preference 2 - Major Code': 'EE',
    'Preference 2 - Method': 'entrance_exam',
    'Preference 3 - Major Code': 'ME',
    'Preference 3 - Method': 'entrance_exam',
  },
  {
    'ID Card': '001234567895',
    'Full Name': 'Vo Thi Giang',
    'Date of Birth': '2005-09-25',
    'Email': 'vothigiang@email.com',
    'Phone': '0956789012',
    'Address': '987 Pasteur Street, District 1, Ho Chi Minh City',
    'Priority Points': 1.5,
    'Math': 8.0,
    'Physics': 8.5,
    'Chemistry': 8.0,
    'Literature': 9.0,
    'English': 9.5,
    'Biology': 8.5,
    'History': 8.0,
    'Geography': 8.5,
    'Preference 1 - Major Code': 'EN',
    'Preference 1 - Method': 'high_school_transcript',
    'Preference 2 - Major Code': 'BA',
    'Preference 2 - Method': 'high_school_transcript',
    'Preference 3 - Major Code': 'CS',
    'Preference 3 - Method': 'entrance_exam',
  },
  {
    'ID Card': '001234567896',
    'Full Name': 'Dang Van Hung',
    'Date of Birth': '2005-12-10',
    'Email': 'dangvanhung@email.com',
    'Phone': '0967890123',
    'Address': '147 Cach Mang Thang Tam Street, District 3, Ho Chi Minh City',
    'Priority Points': 0,
    'Math': 7.0,
    'Physics': 7.5,
    'Chemistry': 7.0,
    'Literature': 8.5,
    'English': 8.0,
    'Biology': 7.5,
    'History': 9.0,
    'Geography': 8.5,
    'Preference 1 - Major Code': 'BA',
    'Preference 1 - Method': 'high_school_transcript',
    'Preference 2 - Major Code': '',
    'Preference 2 - Method': '',
    'Preference 3 - Major Code': '',
    'Preference 3 - Method': '',
  },
  {
    'ID Card': '001234567897',
    'Full Name': 'Bui Thi Lan',
    'Date of Birth': '2005-04-05',
    'Email': 'buithilan@email.com',
    'Phone': '0978901234',
    'Address': '258 Dien Bien Phu Street, District 3, Ho Chi Minh City',
    'Priority Points': 0.5,
    'Math': 8.5,
    'Physics': 8.0,
    'Chemistry': 8.5,
    'Literature': 7.5,
    'English': 8.0,
    'Biology': 8.0,
    'History': '',
    'Geography': '',
    'Preference 1 - Major Code': 'ME',
    'Preference 1 - Method': 'entrance_exam',
    'Preference 2 - Major Code': 'EE',
    'Preference 2 - Method': 'entrance_exam',
    'Preference 3 - Major Code': '',
    'Preference 3 - Method': '',
  },
  {
    'ID Card': '001234567898',
    'Full Name': 'Ngo Van Minh',
    'Date of Birth': '2005-08-14',
    'Email': 'ngovanminh@email.com',
    'Phone': '0989012345',
    'Address': '369 Le Van Sy Street, District 3, Ho Chi Minh City',
    'Priority Points': 0,
    'Math': 9.0,
    'Physics': 9.5,
    'Chemistry': 9.0,
    'Literature': 7.0,
    'English': 7.5,
    'Biology': '',
    'History': '',
    'Geography': '',
    'Preference 1 - Major Code': 'EE',
    'Preference 1 - Method': 'entrance_exam',
    'Preference 2 - Major Code': 'ME',
    'Preference 2 - Method': 'entrance_exam',
    'Preference 3 - Major Code': 'CS',
    'Preference 3 - Method': 'entrance_exam',
  },
  {
    'ID Card': '001234567899',
    'Full Name': 'Truong Thi Nga',
    'Date of Birth': '2005-06-20',
    'Email': 'truongthinga@email.com',
    'Phone': '0990123456',
    'Address': '741 Nguyen Thi Minh Khai Street, District 1, Ho Chi Minh City',
    'Priority Points': 2.0,
    'Math': 7.5,
    'Physics': 7.0,
    'Chemistry': 7.5,
    'Literature': 9.5,
    'English': 9.0,
    'Biology': 8.0,
    'History': 9.0,
    'Geography': 8.5,
    'Preference 1 - Major Code': 'EN',
    'Preference 1 - Method': 'high_school_transcript',
    'Preference 2 - Major Code': 'BA',
    'Preference 2 - Method': 'high_school_transcript',
    'Preference 3 - Major Code': '',
    'Preference 3 - Method': '',
  },
];

// Tạo worksheet
const worksheet = XLSX.utils.json_to_sheet(sampleData);

// Set độ rộng cột
worksheet['!cols'] = [
  { wch: 15 }, // ID Card
  { wch: 20 }, // Full Name
  { wch: 12 }, // Date of Birth
  { wch: 25 }, // Email
  { wch: 12 }, // Phone
  { wch: 45 }, // Address
  { wch: 15 }, // Priority Points
  { wch: 8 },  // Math
  { wch: 8 },  // Physics
  { wch: 10 }, // Chemistry
  { wch: 10 }, // Literature
  { wch: 8 },  // English
  { wch: 8 },  // Biology
  { wch: 8 },  // History
  { wch: 10 }, // Geography
  { wch: 22 }, // Preference 1 - Major Code
  { wch: 22 }, // Preference 1 - Method
  { wch: 22 }, // Preference 2 - Major Code
  { wch: 22 }, // Preference 2 - Method
  { wch: 22 }, // Preference 3 - Major Code
  { wch: 22 }, // Preference 3 - Method
];

// Format ID Card and Phone columns as text to preserve leading zeros
const range = XLSX.utils.decode_range(worksheet['!ref']);
for (let R = range.s.r; R <= range.e.r; ++R) {
  // Column A (ID Card) - index 0
  const idCardCell = XLSX.utils.encode_cell({ r: R, c: 0 });
  if (worksheet[idCardCell]) {
    worksheet[idCardCell].z = '@'; // Text format
    worksheet[idCardCell].t = 's'; // String type
  }
  
  // Column C (Date of Birth) - index 2
  const dobCell = XLSX.utils.encode_cell({ r: R, c: 2 });
  if (worksheet[dobCell] && R > 0) { // Skip header
    worksheet[dobCell].z = 'yyyy-mm-dd'; // Date format
    worksheet[dobCell].t = 's'; // String type to prevent Excel conversion
  }
  
  // Column E (Phone) - index 4
  const phoneCell = XLSX.utils.encode_cell({ r: R, c: 4 });
  if (worksheet[phoneCell]) {
    worksheet[phoneCell].z = '@'; // Text format
    worksheet[phoneCell].t = 's'; // String type
  }
}

// Tạo workbook
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Data');

// Lưu file
const outputPath = path.join(__dirname, '..', 'student-import-sample-data.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log('✅ File mẫu đã được tạo: student-import-sample-data.xlsx');
console.log('📊 Số lượng thí sinh: 10');
console.log('📋 Các ngành:');
console.log('   - CS: Computer Science');
console.log('   - EE: Electrical Engineering');
console.log('   - ME: Mechanical Engineering');
console.log('   - BA: Business Administration');
console.log('   - EN: English');
console.log('📝 Phương thức:');
console.log('   - entrance_exam: Xét tuyển theo điểm thi đầu vào');
console.log('   - high_school_transcript: Xét tuyển học bạ');
console.log('');
console.log('📄 Chi tiết 10 thí sinh:');
console.log('1. Nguyen Van An - CS/EE/ME - Điểm cao khối A (Toán, Lý, Hóa)');
console.log('2. Tran Thi Binh - EE/CS - Điểm cao, ưu tiên 1.0');
console.log('3. Le Van Cuong - BA/EN - Xét học bạ, điểm cân đối');
console.log('4. Pham Thi Dung - EN/BA/CS - Điểm Anh cao');
console.log('5. Hoang Van Em - CS/EE/ME - Điểm xuất sắc khối A');
console.log('6. Vo Thi Giang - EN/BA/CS - Ưu tiên 1.5, điểm học bạ tốt');
console.log('7. Dang Van Hung - BA - Chỉ 1 nguyện vọng, xét học bạ');
console.log('8. Bui Thi Lan - ME/EE - Điểm khối A tốt');
console.log('9. Ngo Van Minh - EE/ME/CS - Điểm Lý xuất sắc');
console.log('10. Truong Thi Nga - EN/BA - Ưu tiên 2.0, điểm Văn cao');
