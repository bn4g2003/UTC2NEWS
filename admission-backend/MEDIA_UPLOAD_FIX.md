# Media Upload Fix

## Problem
The media upload endpoint was returning a 400 Bad Request error with two issues:
1. **"Invalid file type or size"** - File validation was too strict
2. **"No file provided"** - FormData wasn't being sent correctly from the browser

## Root Causes

1. **Strict File Validation**: The `FileTypeValidator` in NestJS was using a regex pattern that was too strict.

2. **FormData Issue**: The auto-generated API client was using Node.js `form-data` package which doesn't work properly in browsers. Browsers need native `FormData` API.

3. **Response Structure Mismatch**: The frontend was looking for `url` in the response, but the backend returns `storagePath`.

## Changes Made

### Backend (`admission-backend/src/cms/cms.controller.ts`)

1. **Removed ParseFilePipe validators** and replaced with manual validation
2. **Added explicit MIME type checking** with clear error messages
3. **Added proper BadRequestException** for better error handling
4. **Allowed MIME types**:
   - image/jpeg
   - image/jpg
   - image/png
   - image/gif
   - image/webp
   - application/pdf
5. **Maximum file size**: 10MB

### Frontend

#### 1. API Client (`admission-frontend/src/lib/api-client.ts`)

- **Added axios instance** (`apiClient`) for direct API calls
- **Added request interceptor** to automatically include auth token
- **Added response interceptor** for 401 error handling
- This bypasses the auto-generated client's FormData issues

#### 2. ImageUpload Component (`admission-frontend/src/components/admin/ImageUpload/ImageUpload.tsx`)

- **Changed to use native browser FormData** instead of the generated API client
- **Uses apiClient directly** with axios for proper multipart/form-data handling
- **Updated response handling**: Look for `storagePath` field (matches backend response)
- **Improved error messages**: Display actual error messages from the API

## Testing

To test the fix:

1. **Ensure you are logged in** - The endpoint requires authentication with `media:upload` permission

2. **Restart the backend server** (if not already running):
   ```bash
   cd admission-backend
   npm run start:dev
   ```

3. **Ensure MinIO is running**:
   ```bash
   docker ps | grep minio
   ```
   
   If not running:
   ```bash
   docker-compose up -d minio
   ```

4. **Test the upload**:
   - Navigate to the Posts management page (must be logged in as admin)
   - Click "Add Post" or edit an existing post
   - Try uploading an image in the Featured Image field
   - Verify the image uploads successfully and displays

## Expected Response Structure

The backend returns a MediaFile object:
```json
{
  "id": "uuid",
  "filename": "timestamp-originalname.jpg",
  "originalName": "originalname.jpg",
  "mimeType": "image/jpeg",
  "sizeBytes": 12345,
  "storagePath": "http://localhost:9000/...",
  "uploadedBy": "user-id",
  "createdAt": "2026-01-22T...",
  "uploader": {
    "id": "user-id",
    "username": "admin",
    "fullName": "Admin User"
  }
}
```

The frontend now correctly extracts the `storagePath` field from this response.

## Authentication Requirements

The `/api/cms/media` endpoint requires:
- **Authentication**: Valid JWT token in Authorization header
- **Permission**: `media:upload` permission

If you see "User: anonymous" in the logs, it means:
1. You're not logged in, OR
2. The auth token is not being sent with the request

The fix includes automatic token injection via axios interceptor.

## MinIO Configuration

Ensure MinIO is properly configured in `.env`:
```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_BUCKET_NAME=admission-files
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_USE_SSL=false
```

## Troubleshooting

If you still encounter issues:

1. **Check authentication**:
   - Open browser DevTools > Application > Local Storage
   - Verify `auth-token` exists
   - Try logging out and logging back in

2. **Check MinIO**:
   - MinIO API: http://localhost:9000
   - MinIO Console: http://localhost:9001 (login: minioadmin/minioadmin123)
   - Verify bucket `admission-files` exists

3. **Check permissions**:
   - Verify your user has `media:upload` permission
   - Check backend logs for permission errors

4. **Check network**:
   - Open browser DevTools > Network tab
   - Look for the POST request to `/api/cms/media`
   - Check request headers include `Authorization: Bearer <token>`
   - Check request payload includes the file

5. **Check backend logs** for detailed error messages

