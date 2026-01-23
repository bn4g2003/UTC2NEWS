# Categories Module

## Overview

The Categories module provides CRUD operations for managing content categories in the CMS. Categories are used to organize posts and other content.

## Features

- **List Categories**: Display all categories in a DataGrid with search functionality
- **Create Category**: Add new categories with name, slug, and description
- **Edit Category**: Update existing category information
- **Delete Category**: Remove categories with validation to prevent deletion of categories with associated posts
- **Search**: Filter categories by name, slug, or description
- **Auto-slug Generation**: Automatically generate URL-friendly slugs from category names

## Requirements Validation

This module validates the following requirements:

- **Requirement 17.1**: Display categories list in DataGrid
- **Requirement 17.2**: Create category with FormModal
- **Requirement 17.3**: Edit category with FormModal
- **Requirement 17.4**: Define validation rules for category data
- **Requirement 17.5**: Delete category with confirmation
- **Requirement 17.6**: Prevent deletion of categories with associated posts

## Components

### CategoriesPage

Main page component that orchestrates all category operations.

**Location**: `app/(admin)/categories/page.tsx`

**Features**:
- DataGrid display with pagination
- Search functionality
- Create/Edit modal forms
- Delete confirmation dialog
- Post count display
- Validation for deletion (prevents deleting categories with posts)

### Category Schema

Zod validation schema for category forms.

**Location**: `app/(admin)/categories/schema.ts`

**Schemas**:
- `categorySchema`: Base validation schema
- `createCategorySchema`: Schema for creating categories
- `updateCategorySchema`: Schema for updating categories (partial)

**Validation Rules**:
- **Name**: Required, 1-100 characters
- **Slug**: Required, URL-friendly format (lowercase, hyphens, numbers only)
- **Description**: Optional, max 500 characters

**Helper Functions**:
- `generateSlug(name: string)`: Converts category name to URL-friendly slug
  - Handles Vietnamese characters (removes diacritics, converts đ to d)
  - Converts to lowercase
  - Replaces spaces with hyphens
  - Removes special characters

## API Integration

Uses `CmsService` from the generated API client:

- `cmsControllerFindAllCategories()`: Fetch all categories
- `cmsControllerCreateCategory(data)`: Create new category
- `cmsControllerUpdateCategory(id, data)`: Update existing category
- `cmsControllerDeleteCategory(id)`: Delete category

## Data Model

```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    posts: number;
  };
}
```

## Usage

### Creating a Category

1. Click "Add Category" button
2. Fill in the form:
   - **Name**: Enter category name (e.g., "Technology")
   - **Slug**: Auto-generated from name, can be edited
   - **Description**: Optional description
3. Click "Create"

### Editing a Category

1. Click "Edit" action on a category row
2. Modify the form fields
3. Click "Update"

### Deleting a Category

1. Click "Delete" action on a category row
2. Confirm deletion in the dialog
3. **Note**: Categories with associated posts cannot be deleted

### Searching Categories

Use the search bar to filter categories by:
- Name
- Slug
- Description

## Validation

### Name Validation
- Required field
- Minimum 1 character
- Maximum 100 characters

### Slug Validation
- Required field
- Must be URL-friendly (lowercase letters, numbers, hyphens only)
- Pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- Maximum 200 characters

### Description Validation
- Optional field
- Maximum 500 characters

## Error Handling

- **API Errors**: Displayed as toast notifications
- **Validation Errors**: Displayed inline below form fields
- **Delete Validation**: Prevents deletion of categories with posts, shows error message

## Testing

Unit tests are provided in `schema.test.ts`:

```bash
npm test -- "app/(admin)/categories/schema.test.ts" --run
```

**Test Coverage**:
- Schema validation (name, slug, description)
- Create/Update schema validation
- Slug generation with various inputs
- Vietnamese character handling
- Edge cases (empty strings, max lengths, special characters)

## Implementation Notes

1. **Auto-slug Generation**: When creating a category, the slug is automatically generated from the name as you type. You can still manually edit the slug if needed.

2. **Post Count Display**: The DataGrid shows the number of posts associated with each category, helping administrators understand category usage.

3. **Delete Protection**: The module implements Property 34 from the design document: "Categories with posts cannot be deleted". This prevents data integrity issues.

4. **Vietnamese Support**: The slug generator properly handles Vietnamese characters, converting them to ASCII equivalents (e.g., "Công nghệ" → "cong-nghe").

5. **Search Functionality**: Client-side search filters categories in real-time without requiring API calls.

## Future Enhancements

Potential improvements for future iterations:

- Hierarchical categories (parent-child relationships)
- Category icons or colors
- Bulk operations (delete multiple, merge categories)
- Category usage statistics
- SEO metadata fields
- Category ordering/sorting
