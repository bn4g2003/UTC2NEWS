# Posts Module (CMS)

## Overview

The Posts module provides a complete content management system for creating, editing, and managing blog posts and announcements. It includes rich text editing, image uploads, categorization, and status management.

## Features

### Core Functionality
- ✅ Create new posts with rich content
- ✅ Edit existing posts
- ✅ Delete posts with confirmation
- ✅ Search posts by title or content
- ✅ Filter posts by status (draft/published)
- ✅ Filter posts by category
- ✅ Rich text editor for content
- ✅ Featured image upload
- ✅ Auto-generate URL-friendly slugs
- ✅ Category assignment
- ✅ Draft/Published status management

### Data Grid Features
- Pagination support
- Sortable columns
- Search functionality
- Status and category filters
- Action buttons (Edit, Delete)
- Responsive layout

### Form Validation
- Title: Required, max 200 characters
- Slug: Required, URL-friendly format (lowercase, hyphens only)
- Content: Required, max 50,000 characters
- Excerpt: Optional, max 500 characters
- Category: Optional, must be valid UUID
- Featured Image: Optional, must be valid URL
- Status: Required (draft or published)

## Components

### Main Components
- **PostsPage**: Main page component with DataGrid and CRUD operations
- **RichTextEditor**: Text editor for post content (supports HTML/Markdown)
- **ImageUpload**: Component for uploading featured images

### Schema
- **createPostSchema**: Validation schema for creating posts
- **updatePostSchema**: Validation schema for updating posts
- **generateSlug**: Helper function to generate URL-friendly slugs from titles

## API Integration

Uses the CMS Service from the generated API client:

- `CmsService.cmsControllerFindAllPosts()` - Fetch all posts
- `CmsService.cmsControllerCreatePost(data)` - Create new post
- `CmsService.cmsControllerUpdatePost(id, data)` - Update existing post
- `CmsService.cmsControllerDeletePost(id)` - Delete post
- `CmsService.cmsControllerFindAllCategories()` - Fetch categories
- `CmsService.cmsControllerUploadMedia({ file })` - Upload images

## Usage

### Creating a Post

1. Click "Add Post" button
2. Fill in the form:
   - Enter title (slug auto-generates)
   - Add excerpt (optional)
   - Write content using the rich text editor
   - Upload featured image (optional)
   - Select category (optional)
   - Choose status (draft or published)
3. Click "Create" to save

### Editing a Post

1. Click "Edit" action on a post row
2. Modify the fields as needed
3. Click "Update" to save changes

### Deleting a Post

1. Click "Delete" action on a post row
2. Confirm deletion in the dialog
3. Post will be permanently removed

### Searching and Filtering

- **Search**: Type in the search box to filter by title or content
- **Status Filter**: Select "Draft" or "Published" to filter by status
- **Category Filter**: Select a category to show only posts in that category

## Slug Generation

The module includes automatic slug generation from post titles:

- Converts to lowercase
- Removes diacritics (Vietnamese characters)
- Replaces spaces with hyphens
- Removes special characters
- Handles multiple consecutive hyphens

Example:
- "Tiêu đề bài viết" → "tieu-de-bai-viet"
- "Post Title 123!" → "post-title-123"

## Rich Text Editor

Currently uses a textarea-based editor that supports:
- HTML content
- Markdown content
- Character count display
- Auto-sizing based on content

**Note**: Can be upgraded to a full WYSIWYG editor (like Quill or TinyMCE) when React 19 compatible versions are available.

## Image Upload

The ImageUpload component:
- Supports image files (jpg, png, gif, webp)
- Maximum file size: 10MB
- Uploads to CMS media endpoint
- Displays preview of uploaded image
- Provides link to view full image

## Requirements Validation

This module validates the following requirements:

- **16.1**: Display posts list in DataGrid ✅
- **16.2**: Create post with FormDrawer ✅
- **16.3**: Edit post with FormDrawer ✅
- **16.4**: Integrate rich text editor for post content ✅
- **16.5**: Define validation rules for post data ✅
- **16.6**: Allow uploading featured image ✅
- **16.7**: Delete post with confirmation ✅
- **16.8**: Support searching posts by title or content ✅
- **16.9**: Support filtering posts by category or status ✅

## Testing

Run tests with:

```bash
npm run test:run -- "app/(admin)/posts/schema.test.ts"
```

Test coverage includes:
- Schema validation (create and update)
- Slug generation
- Field validation rules
- Optional field handling
- UUID and URL validation

## Future Enhancements

- [ ] Full WYSIWYG editor (when React 19 compatible)
- [ ] Image gallery integration
- [ ] Post preview before publishing
- [ ] Revision history
- [ ] Bulk operations (delete, publish)
- [ ] Post scheduling
- [ ] SEO metadata fields
- [ ] Tags support
- [ ] Related posts
- [ ] Comments management
