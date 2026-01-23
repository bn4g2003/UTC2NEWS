# Posts Module - Integration Guide

## Quick Start

### 1. Access the Module

Navigate to `/posts` in the admin interface (when logged in).

### 2. Required Setup

Ensure the following are configured:

1. **Backend API**: CMS endpoints must be available
   - `GET /cms/posts`
   - `POST /cms/posts`
   - `PUT /cms/posts/:id`
   - `DELETE /cms/posts/:id`
   - `GET /cms/categories`
   - `POST /cms/media`

2. **Authentication**: User must be logged in with appropriate permissions
   - `manage_content` permission for create/update/delete operations

3. **Categories**: At least one category should exist for better organization

### 3. Navigation Integration

Add the Posts menu item to the admin sidebar:

```typescript
// In AdminLayout or Sidebar component
const menuItems = [
  // ... other items
  {
    key: 'posts',
    label: 'Posts',
    icon: <FileTextOutlined />,
    path: '/posts',
    permission: 'manage_content',
  },
  // ... other items
];
```

## Component Dependencies

### Required Components
- ✅ DataGrid (from `@/components/admin/DataGrid`)
- ✅ FormDrawer (from `@/components/admin/FormDrawer`)
- ✅ ConfirmDialog (from `@/components/admin/ConfirmDialog`)
- ✅ RichTextEditor (from `@/components/admin/RichTextEditor`)
- ✅ ImageUpload (from `@/components/admin/ImageUpload`)

### Required Hooks
- ✅ usePagination (from `@/hooks/usePagination`)
- ✅ useModal (from `@/hooks/useModal`)

### Required Services
- ✅ CmsService (from `@/api/services/CmsService`)

## API Response Format

### Expected Post Object
```typescript
{
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  status: 'draft' | 'published';
  categoryId?: string;
  category?: {
    id: string;
    name: string;
  };
  authorId?: string;
  author?: {
    id: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}
```

### Expected Category Object
```typescript
{
  id: string;
  name: string;
  slug: string;
}
```

### Expected Media Upload Response
```typescript
{
  url: string;
  // or
  data: {
    url: string;
  }
}
```

## Testing the Integration

### 1. Manual Testing Checklist

- [ ] Can access `/posts` page
- [ ] Posts list loads successfully
- [ ] Can create a new post
- [ ] Can edit an existing post
- [ ] Can delete a post (with confirmation)
- [ ] Search functionality works
- [ ] Status filter works
- [ ] Category filter works
- [ ] Image upload works
- [ ] Slug auto-generates from title
- [ ] Form validation works
- [ ] Error messages display correctly

### 2. Test Data

Create test posts with:
- Short title (< 50 chars)
- Long title (> 100 chars)
- Vietnamese characters in title
- Special characters in title
- Very long content (> 10,000 chars)
- With and without featured image
- With and without category
- Draft and published status

### 3. Error Scenarios

Test error handling:
- Network error (disconnect internet)
- Invalid image file (upload .txt file)
- Large image file (> 10MB)
- Invalid slug format (spaces, uppercase)
- Missing required fields
- Duplicate slug (if backend validates)

## Common Issues and Solutions

### Issue 1: Posts not loading
**Symptom**: Empty list or loading spinner forever
**Solution**: 
- Check backend API is running
- Verify API endpoint URL in environment variables
- Check browser console for errors
- Verify authentication token is valid

### Issue 2: Image upload fails
**Symptom**: Upload button shows error
**Solution**:
- Check file size (must be < 10MB)
- Check file type (must be image)
- Verify media upload endpoint is working
- Check CORS settings on backend

### Issue 3: Slug validation error
**Symptom**: "Invalid slug format" error
**Solution**:
- Slug must be lowercase
- Only letters, numbers, and hyphens allowed
- No spaces or special characters
- Use the auto-generate feature

### Issue 4: Categories not showing
**Symptom**: Category dropdown is empty
**Solution**:
- Create categories first using Categories module
- Check categories API endpoint
- Verify categories are being fetched on mount

### Issue 5: Rich text editor not working
**Symptom**: Cannot type in content field
**Solution**:
- Check browser console for errors
- Verify RichTextEditor component is imported correctly
- Try refreshing the page

## Performance Optimization

### 1. Pagination
- Currently client-side pagination (10 items per page)
- For large datasets, consider server-side pagination
- Modify `fetchPosts` to accept page and pageSize parameters

### 2. Search and Filter
- Currently client-side filtering
- For large datasets, consider server-side filtering
- Add debounce to search input (300ms recommended)

### 3. Image Upload
- Consider adding image compression before upload
- Add progress indicator for large files
- Implement retry logic for failed uploads

### 4. Content Loading
- Add skeleton loaders for better UX
- Implement lazy loading for images
- Cache categories to reduce API calls

## Security Considerations

### 1. Content Sanitization
- Backend should sanitize HTML content
- Prevent XSS attacks through content field
- Validate all inputs on backend

### 2. File Upload Security
- Backend should validate file types
- Scan uploaded files for malware
- Store files in secure location
- Generate unique filenames

### 3. Permission Checks
- Verify user has `manage_content` permission
- Check permissions on backend for all operations
- Hide UI elements based on permissions

## Monitoring and Logging

### What to Monitor
- Post creation/update/delete success rate
- Image upload success rate
- API response times
- Error rates by type
- User activity (who creates/edits posts)

### Logging
- Log all CRUD operations
- Log failed API calls
- Log validation errors
- Log image upload attempts

## Future Enhancements

### Short Term
1. Add post preview before publishing
2. Implement auto-save draft
3. Add revision history
4. Improve rich text editor (WYSIWYG)

### Medium Term
1. Add SEO metadata fields
2. Implement tags system
3. Add related posts feature
4. Implement post scheduling

### Long Term
1. Add comments management
2. Implement content versioning
3. Add multi-language support
4. Implement content workflow (approval process)

## Support

For issues or questions:
1. Check this integration guide
2. Review the README.md file
3. Check the implementation summary
4. Review the test files for examples
5. Contact the development team

## Changelog

### Version 1.0.0 (Initial Release)
- Complete CRUD operations
- Search and filter functionality
- Rich text editor (textarea-based)
- Image upload support
- Category integration
- Form validation with Zod
- Unit tests for schema validation
