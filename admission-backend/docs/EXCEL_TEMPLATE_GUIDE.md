# Excel Template Guide for Student Data Import

## Overview

This guide explains how to prepare an Excel file for bulk student data import into the Admission Management System.

## Template File

The example template is located at: `docs/student-import-template.xlsx`

To generate a fresh template, run:
```bash
npm run generate:template
```

## File Requirements

- **File Format**: Excel (.xlsx or .xls)
- **Sheet Name**: Any name (first sheet will be used)
- **Encoding**: UTF-8 recommended
- **Max File Size**: 10MB

## Column Structure

### Required Columns

The following columns MUST be present in the header row (first row):

| Column Name | Data Type | Format | Required | Description |
|------------|-----------|--------|----------|-------------|
| ID Card | String | 9-12 digits | Yes | Student identification number (must be unique) |
| Full Name | String | Text | Yes | Student's full name |
| Date of Birth | Date | YYYY-MM-DD | Yes | Student's date of birth |
| Email | String | email@domain.com | No | Student's email address |
| Phone | String | 10-15 digits | No | Student's phone number |
| Address | String | Text | No | Student's residential address |
| Priority Points | Number | 0-3 | Yes | Additional priority points (default: 0) |

### Subject Score Columns

All subject scores are optional. Include only the subjects relevant to the admission method.

| Column Name | Data Type | Range | Description |
|------------|-----------|-------|-------------|
| Math | Number | 0-10 | Mathematics score |
| Physics | Number | 0-10 | Physics score |
| Chemistry | Number | 0-10 | Chemistry score |
| Literature | Number | 0-10 | Literature score |
| English | Number | 0-10 | English score |
| Biology | Number | 0-10 | Biology score |
| History | Number | 0-10 | History score |
| Geography | Number | 0-10 | Geography score |

**Note**: Leave cells empty for subjects not taken. Do not use 0 for missing subjects.

### Preference Columns

Students can specify up to 3 preferences (NV1, NV2, NV3). Each preference requires both Major Code and Method.

| Column Name | Data Type | Required | Description |
|------------|-----------|----------|-------------|
| Preference 1 - Major Code | String | Yes* | First choice major code (e.g., "CS", "EE") |
| Preference 1 - Method | String | Yes* | First choice admission method |
| Preference 2 - Major Code | String | No | Second choice major code |
| Preference 2 - Method | String | No | Second choice admission method |
| Preference 3 - Major Code | String | No | Third choice major code |
| Preference 3 - Method | String | No | Third choice admission method |

*At least one preference is required.

## Admission Methods

Valid values for admission method columns:

| Method | Description | Required Subjects |
|--------|-------------|-------------------|
| `entrance_exam` | Based on entrance exam scores | Math, Physics, Chemistry (or other combinations) |
| `high_school_transcript` | Based on high school grades | All relevant subjects |
| `direct_admission` | Direct admission (special cases) | May vary |

**Important**: The admission method must match the quota configuration for the major in the admission session.

## Data Validation Rules

### ID Card
- Must be unique across all students
- 9-12 characters
- No special characters
- Example: `001234567890`

### Full Name
- Cannot be empty
- Maximum 100 characters
- Unicode characters supported (Vietnamese names)
- Example: `Nguyễn Văn A`

### Date of Birth
- Format: YYYY-MM-DD or Excel date format
- Must be a valid date
- Typically between 1990-2010 for admission purposes
- Example: `2005-03-15`

### Email
- Must be valid email format
- Example: `student@email.com`

### Phone
- 10-15 digits
- Can include country code
- Example: `0901234567`

### Priority Points
- Number between 0 and 3
- Decimal values allowed (e.g., 0.5, 1.0)
- Default: 0

### Subject Scores
- Number between 0 and 10
- Decimal values allowed (e.g., 8.5, 9.0)
- Leave empty if subject not taken
- Do NOT use 0 for missing subjects

### Major Codes
- Must exist in the system
- Case-sensitive
- Common codes: CS, EE, ME, BA, EN
- Check with admin for complete list

## Example Data

### Example 1: Entrance Exam Student

```
ID Card: 001234567890
Full Name: Nguyen Van A
Date of Birth: 2005-03-15
Email: nguyenvana@email.com
Phone: 0901234567
Address: 123 Le Loi Street, District 1, Ho Chi Minh City
Priority Points: 0.5
Math: 8.5
Physics: 9.0
Chemistry: 8.0
Literature: 7.5
English: 8.5
Biology: (empty)
History: (empty)
Geography: (empty)
Preference 1 - Major Code: CS
Preference 1 - Method: entrance_exam
Preference 2 - Major Code: EE
Preference 2 - Method: entrance_exam
Preference 3 - Major Code: ME
Preference 3 - Method: high_school_transcript
```

### Example 2: High School Transcript Student

```
ID Card: 001234567892
Full Name: Le Van C
Date of Birth: 2005-11-08
Email: levanc@email.com
Phone: 0923456789
Address: 789 Tran Hung Dao Street, District 5, Ho Chi Minh City
Priority Points: 0.0
Math: 7.5
Physics: 8.0
Chemistry: 7.0
Literature: 9.0
English: 8.5
Biology: 7.5
History: 8.0
Geography: 7.5
Preference 1 - Major Code: BA
Preference 1 - Method: high_school_transcript
Preference 2 - Major Code: EN
Preference 2 - Method: high_school_transcript
Preference 3 - Major Code: (empty)
Preference 3 - Method: (empty)
```

## Common Errors and Solutions

### Error: "Missing required column: [column name]"
**Solution**: Ensure all required columns are present in the header row with exact spelling.

### Error: "Duplicate ID card number"
**Solution**: Check for duplicate ID cards in your Excel file or in the database.

### Error: "Invalid major code: [code]"
**Solution**: Verify the major code exists in the system. Contact admin for valid codes.

### Error: "Invalid admission method"
**Solution**: Use only valid methods: `entrance_exam`, `high_school_transcript`, or `direct_admission`.

### Error: "Missing required subjects for admission method"
**Solution**: Ensure all required subjects for the chosen admission method have scores.

### Error: "Invalid date format"
**Solution**: Use YYYY-MM-DD format or Excel date format.

### Error: "Priority points out of range"
**Solution**: Priority points must be between 0 and 3.

### Error: "Subject score out of range"
**Solution**: Subject scores must be between 0 and 10.

## Import Process

1. **Prepare Excel File**: Fill in student data using the template
2. **Validate Data**: Check all required fields and formats
3. **Login to System**: Get JWT authentication token
4. **Upload File**: POST to `/import/students` with file and sessionId
5. **Review Results**: Check import summary and validation errors
6. **Fix Errors**: If validation fails, correct errors and re-upload

## API Endpoint

```
POST /import/students
Content-Type: multipart/form-data
Authorization: Bearer {jwt_token}

Body:
- file: Excel file (.xlsx or .xls)
- sessionId: Admission session ID
```

**Response:**
```json
{
  "totalRecords": 100,
  "successCount": 95,
  "failureCount": 5,
  "errors": [
    {
      "row": 10,
      "field": "idCard",
      "message": "Duplicate ID card number"
    }
  ]
}
```

## Best Practices

1. **Test with Small Batch**: Import 5-10 records first to verify format
2. **Backup Data**: Keep a copy of your Excel file before import
3. **Check Major Codes**: Verify all major codes exist in the system
4. **Validate Dates**: Ensure dates are in correct format
5. **Remove Empty Rows**: Delete any empty rows at the end of the sheet
6. **Use Template**: Always start with the provided template
7. **Check Duplicates**: Ensure no duplicate ID cards in your file
8. **Verify Quotas**: Confirm quotas are configured for all major-method combinations

## Support

For issues or questions:
- Check API documentation at `/api/docs`
- Review validation error messages
- Contact system administrator
- Refer to the requirements document

## Version History

- v1.0 (2026-01-21): Initial template with 21 columns
  - 7 student information columns
  - 8 subject score columns
  - 6 preference columns (3 preferences × 2 fields)
