# Excel Import Module

## Overview

The Excel Import module provides functionality for bulk importing student data from Excel files. It includes file validation, data parsing, preview with error highlighting, and batch import execution.

## Features

### 1. File Upload (Requirement 12.1)
- Drag-and-drop upload area
- Support for .xlsx and .xls file formats
- File format validation
- Maximum file size: 10MB

### 2. File Validation (Requirements 12.2, 12.3)
- Validates Excel file format (.xlsx, .xls)
- Validates file structure and required columns
- Displays clear error messages for invalid files
- Checks for required headers: ID Card Number, Full Name, Date of Birth

### 3. Data Parsing and Preview (Requirements 12.4, 12.5)
- Parses Excel data using the `xlsx` library
- Flexible column header mapping (case-insensitive)
- Validates each row against the student schema
- Displays preview table with all records
- Highlights invalid records in red
- Shows validation errors for each invalid record
- Displays statistics: total, valid, and invalid record counts

### 4. Import Execution (Requirements 12.6, 12.7, 12.8, 12.9)
- Confirmation dialog before import
- Imports only valid records
- Progress indicator during import
- Import summary with success/failure counts
- Download error report for invalid records
- Download Excel template

## File Structure

```
admission-frontend/app/(admin)/import/
├── page.tsx          # Main import page component
├── schema.ts         # Validation schema and types
└── README.md         # This file
```

## Excel Template Format

The Excel file must contain the following columns (case-insensitive):

| Column Name | Required | Format | Example |
|------------|----------|--------|---------|
| ID Card Number | Yes | 9 or 12 digits | 123456789 |
| Full Name | Yes | Letters and spaces only | Nguyen Van A |
| Date of Birth | Yes | ISO date format | 2005-01-15 |
| Email | No | Valid email | student@example.com |
| Phone | No | 10 digits starting with 0 | 0912345678 |
| Address | No | Text (max 200 chars) | 123 Main St, Hanoi |
| Priority Points | No | Number 0-3 | 0 |

## Validation Rules

### ID Card Number
- Must be 9 or 12 digits
- Required field

### Full Name
- Must contain only letters and spaces
- Maximum 100 characters
- Required field

### Date of Birth
- Must be a valid date
- Student age must be between 15 and 100 years
- Required field

### Email
- Must be a valid email format
- Optional field

### Phone
- Must be 10 digits starting with 0
- Optional field

### Address
- Maximum 200 characters
- Optional field

### Priority Points
- Must be a number between 0 and 3
- Optional field (defaults to 0)

## Usage

1. **Download Template**: Click "Download Excel Template" to get a sample file
2. **Prepare Data**: Fill in the Excel file with student data
3. **Upload File**: Drag and drop or click to upload the Excel file
4. **Review Preview**: Check the preview table for validation errors
5. **Download Error Report**: If there are errors, download the error report
6. **Fix Errors**: Correct the errors in the Excel file and re-upload
7. **Import**: Click "Import X Valid Records" to start the import process
8. **Review Summary**: Check the import summary for results

## Error Handling

### File Format Errors
- Invalid file type: "Invalid file format. Please upload an Excel file (.xlsx or .xls)"
- Empty file: "Excel file is empty"
- Missing required columns: "Missing required columns: [column names]"

### Validation Errors
- Each invalid record is highlighted in red in the preview table
- Validation errors are displayed in the "Errors" column
- Error report can be downloaded for offline review

### Import Errors
- Network errors: "Import failed: [error message]"
- API errors: Displayed with specific error message from backend
- Partial success: Shows count of successful and failed imports

## API Integration

The module uses the `ImportService` from the generated API client:

```typescript
ImportService.importControllerImportStudents({
  file: File,
  sessionId: string
})
```

## Dependencies

- `xlsx`: Excel file parsing and generation
- `antd`: UI components (Upload, Table, Progress, etc.)
- `zod`: Schema validation
- `@ant-design/icons`: Icons

## Future Enhancements

- [ ] Support for multiple file upload
- [ ] Real-time validation during file upload
- [ ] Import history and audit log
- [ ] Duplicate detection
- [ ] Batch import scheduling
- [ ] Import from CSV files
- [ ] Column mapping customization
- [ ] Data transformation rules

## Testing

The module should be tested with:
- Valid Excel files with all required columns
- Invalid file formats (PDF, Word, etc.)
- Empty Excel files
- Files with missing required columns
- Files with invalid data (wrong formats, out of range values)
- Large files (performance testing)
- Files with duplicate records

## Notes

- The import operation is atomic (all or nothing) on the backend
- Only valid records are sent to the API for import
- Invalid records are skipped and reported in the error report
- The session ID must be provided before import (future enhancement: add session selector)
