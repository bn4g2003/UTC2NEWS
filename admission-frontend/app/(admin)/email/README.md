# Email Notification Module

## Overview

The Email Notification module allows administrators to send admission result notifications to students via email. This module provides functionality for selecting recipients, previewing email templates, sending emails, and viewing email history.

## Features

### 1. Email Configuration (Requirement 15.1)
- Select admission session for email sending
- Display session information
- Show recipient count

### 2. Recipient Selection (Requirement 15.2)
- **All Students**: Send to all students with admission results
- **Accepted Students Only**: Send only to accepted students
- **Rejected Students Only**: Send only to rejected students
- **Specific Program**: Send to students in a specific program
- Display recipient count based on selected filters

### 3. Email Preview (Requirement 15.3)
- Preview email template before sending
- Show personalized content with sample data
- Display different templates for accepted/rejected students
- Include program information, scores, and next steps

### 4. Email Sending (Requirement 15.4, 15.5, 15.6, 15.7)
- Show confirmation dialog with recipient count
- Queue emails for background processing
- Display progress indicator during sending
- Show sending summary with success/failure counts
- Handle errors gracefully with user-friendly messages

### 5. Email History (Requirement 15.8)
- View history of all email sending operations
- Display session name, recipient count, sent/failed counts
- Show sending status and timestamp
- Refresh history data

## API Integration

### Email Service Endpoints

```typescript
// Send admission result emails
EmailService.emailControllerSendAdmissionResults(sessionId: string)

// Get email delivery status for a student
EmailService.emailControllerGetEmailStatus(studentId: string)
```

## Component Structure

```
email/
├── page.tsx                 # Main email page component
└── README.md               # This file
```

## Usage

### Sending Emails

1. **Select Session**: Choose an admission session from the dropdown
2. **Select Recipients**: Choose recipient group (all, accepted, rejected, or specific program)
3. **Preview Email**: Click "Preview Email" to see the email template
4. **Send Emails**: Click "Send Emails" to open confirmation dialog
5. **Confirm**: Review recipient count and confirm to queue emails

### Viewing History

1. Click "View History" button
2. Review past email sending operations
3. Check success/failure counts
4. Refresh to see latest data

## Email Template

The email template includes:

### For Accepted Students
- Congratulations message
- Program name and code
- Total score and ranking
- Next steps (enrollment confirmation, document submission, fee payment, orientation)
- Contact information

### For Rejected Students
- Result notification
- Encouragement message
- Alternative options (other programs, reapply, contact admissions)
- Contact information

## Error Handling

The module handles various error scenarios:

- **403 Forbidden**: User lacks permission to send emails
- **404 Not Found**: Session not found or no results available
- **500 Server Error**: Server error during email queueing
- **Network Error**: Connection issues

## Notes

- Emails are queued and sent asynchronously in the background
- The process may take several minutes depending on recipient count
- Only closed sessions (with finalized results) are available for email sending
- Email sending cannot be undone once confirmed

## Future Enhancements

- Custom email templates
- Email scheduling
- Attachment support
- Email tracking and analytics
- Retry failed emails
- Email preview with actual student data
