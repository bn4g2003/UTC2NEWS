# Guides and FAQs Page

## Overview

The Guides and FAQs page (`/huong-dan`) provides comprehensive information to help users understand the admission process. It includes guide posts, downloadable templates, and frequently asked questions organized in an accordion format.

## Features

### 1. Guide Posts Section (Task 26.1)
- Displays published posts from the "Hướng dẫn" category
- Shows post title, excerpt, and link to full content
- Uses government portal card styling for consistency
- Links to full post detail pages

### 2. FAQ Accordion Component (Task 26.2)
- Displays FAQs in an expandable/collapsible accordion format
- Uses Radix UI Accordion primitive for accessibility
- Smooth expand/collapse animations
- Click to expand/collapse individual FAQ items
- Supports HTML content in answers

### 3. Template Downloads (Task 26.3)
- Provides downloadable template files
- Student data import Excel template
- Registration guide PDF
- Download button triggers file download
- Clear descriptions for each template

### 4. FAQ Grouping (Task 26.4)
- Groups FAQs by category
- Category filter buttons to show FAQs from specific categories
- "Tất cả" (All) option to show all FAQs
- Displays category count in filter
- Maintains FAQ order within each category

### 5. Data Fetching (Task 26.5)
- Fetches active FAQs from CMS API using `CmsService.cmsControllerFindAllFaqs('true')`
- Fetches published guide posts from CMS API using `CmsService.cmsControllerFindAllPosts('true')`
- Filters posts by "huong-dan" category slug
- Sorts FAQs by order field
- Loading skeleton while fetching data
- Error handling with console logging

## Components Used

### Shadcn/ui Components
- **Accordion**: Expandable/collapsible FAQ display
  - `AccordionItem`: Individual FAQ item
  - `AccordionTrigger`: Clickable question header
  - `AccordionContent`: Expandable answer content

### Lucide React Icons
- `Download`: Template download icon
- `FileText`: Document/guide icon
- `HelpCircle`: FAQ section icon
- `ChevronDown`: Accordion expand/collapse indicator

## Data Structure

### FAQ Interface
```typescript
interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
  category?: string;
  isActive: boolean;
}
```

### Post Interface
```typescript
interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  status: string;
  publishedAt?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}
```

### Template File Interface
```typescript
interface TemplateFile {
  name: string;
  description: string;
  url: string;
  icon: React.ReactNode;
}
```

## Styling

The page uses the Government Portal theme with:
- **Colors**: Blue (#0052CC) primary, white backgrounds, gray text
- **Layout**: Blocky, formal design with clear sections
- **Typography**: Bold headings, readable body text
- **Cards**: Border-based cards with hover effects
- **Buttons**: Rectangular buttons with no border radius
- **Responsive**: Mobile-first design with breakpoints

## API Integration

### CMS Service Methods
- `cmsControllerFindAllFaqs(active?: string)`: Fetch FAQs
  - Pass 'true' to get only active FAQs
- `cmsControllerFindAllPosts(published?: string)`: Fetch posts
  - Pass 'true' to get only published posts

## User Experience

1. **Page Load**: Shows loading skeletons while fetching data
2. **Guide Posts**: Click to navigate to full post detail
3. **Templates**: Click download button to get files
4. **FAQs**: 
   - Click question to expand answer
   - Click again to collapse
   - Filter by category to narrow results
5. **Contact**: Contact information at bottom for additional help

## Accessibility

- Semantic HTML structure
- Keyboard navigation support (via Radix UI)
- ARIA attributes for accordion (via Radix UI)
- Focus management
- Screen reader friendly

## Requirements Validation

✅ **Requirement 26.1**: Display list of guide posts
✅ **Requirement 26.2**: Display FAQs in accordion format
✅ **Requirement 26.3**: Expand/collapse on click
✅ **Requirement 26.4**: Allow downloading template files
✅ **Requirement 26.5**: Load FAQs from CMS API
✅ **Requirement 26.6**: Group FAQs by category

## Future Enhancements

- Search functionality for FAQs
- FAQ voting (helpful/not helpful)
- Related FAQs suggestions
- Print-friendly FAQ view
- FAQ sharing functionality
- Analytics tracking for popular FAQs
