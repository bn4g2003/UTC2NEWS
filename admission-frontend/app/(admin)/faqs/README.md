# FAQs Module - Admin Interface

## Overview

The FAQs module provides a complete CRUD interface for managing Frequently Asked Questions (FAQs) in the admission system. This module allows administrators to create, edit, delete, and reorder FAQs that will be displayed on the public website.

## Features

### 1. FAQ List Display (Requirement 18.1)
- Display all FAQs in a DataGrid with pagination
- Show question, answer preview, display order, and active status
- Sort FAQs by display order (ascending by default)
- Search functionality to filter FAQs by question or answer text

### 2. FAQ CRUD Operations (Requirements 18.2, 18.3, 18.5)

#### Create FAQ
- Click "Add FAQ" button to open creation modal
- Fill in required fields:
  - Question (required, max 500 characters)
  - Answer (required, max 5000 characters)
  - Display Order (optional, default 0)
  - Active Status (optional, default true)
- Form validation using Zod schema
- Success/error notifications

#### Edit FAQ
- Click "Edit" action button on any FAQ row
- Modal pre-filled with current FAQ data
- Update any field and save changes
- Form validation using Zod schema
- Success/error notifications

#### Delete FAQ
- Click "Delete" action button on any FAQ row
- Confirmation dialog appears
- Confirm to permanently delete the FAQ
- Success/error notifications

### 3. FAQ Reordering (Requirement 18.6)

The module supports two methods for reordering FAQs:

#### Method 1: Quick Reorder Buttons
- Use arrow up/down buttons in the "Reorder" column
- Move FAQ up or down one position at a time
- Buttons are disabled when FAQ is at the top/bottom
- Changes are saved immediately to the API

#### Method 2: Display Order Field
- Edit FAQ and change the "Display Order" number
- Lower numbers appear first in the list
- Allows precise positioning of FAQs

### 4. Active Status Management
- Toggle FAQ active/inactive status
- Only active FAQs are displayed on the public website
- Visual indicator (green badge for active, red for inactive)

## Data Model

```typescript
interface Faq {
  id: string;
  question: string;
  answer: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Validation Rules (Requirement 18.4)

The FAQ form schema enforces the following validation rules:

- **Question**: Required, 1-500 characters
- **Answer**: Required, 1-5000 characters
- **Display Order**: Integer, minimum 0, default 0
- **Active Status**: Boolean, default true

## API Integration

The module integrates with the following CMS API endpoints:

- `GET /api/cms/faqs` - Fetch all FAQs
- `POST /api/cms/faqs` - Create new FAQ
- `PUT /api/cms/faqs/:id` - Update FAQ
- `DELETE /api/cms/faqs/:id` - Delete FAQ

## Components Used

- **DataGrid**: Displays FAQ list with pagination and sorting
- **FormModal**: Modal dialog for create/edit forms
- **ConfirmDialog**: Confirmation dialog for delete action
- **SearchBar**: Search input with debounce
- **Ant Design Components**: Input, InputNumber, Switch, Button, Space, Tooltip

## Hooks Used

- **usePagination**: Manages pagination state
- **useModal**: Manages modal open/close state
- **useCallback**: Optimizes fetch function
- **useEffect**: Loads data on mount

## File Structure

```
admission-frontend/app/(admin)/faqs/
├── page.tsx          # Main FAQs page component
├── schema.ts         # Zod validation schemas
└── README.md         # This documentation file
```

## Usage

1. Navigate to `/admin/faqs` in the admin interface
2. View the list of all FAQs sorted by display order
3. Use search bar to filter FAQs by question or answer
4. Click "Add FAQ" to create a new FAQ
5. Click "Edit" to modify an existing FAQ
6. Use arrow buttons to reorder FAQs
7. Click "Delete" to remove an FAQ (with confirmation)

## Requirements Validation

This implementation satisfies the following requirements:

- ✅ **Requirement 18.1**: Display FAQs list in DataGrid
- ✅ **Requirement 18.2**: Create FAQ with FormModal
- ✅ **Requirement 18.3**: Edit FAQ with FormModal
- ✅ **Requirement 18.4**: Define validation rules for FAQ data
- ✅ **Requirement 18.5**: Delete FAQ with confirmation
- ✅ **Requirement 18.6**: Support reordering FAQs (via arrow buttons and order number)

## Future Enhancements

Potential improvements for future iterations:

1. **Drag-and-Drop Reordering**: Implement drag-and-drop functionality using a library like `@dnd-kit/core`
2. **Category Grouping**: Add FAQ categories for better organization
3. **Rich Text Editor**: Support formatted text in answers
4. **Bulk Operations**: Select multiple FAQs for bulk delete or status change
5. **Preview Mode**: Preview how FAQ will appear on public website
6. **Search Highlighting**: Highlight search terms in results
7. **Export/Import**: Export FAQs to Excel or import from file
