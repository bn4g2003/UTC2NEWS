# News and Posts Module (Public Interface)

## Overview

The News and Posts module provides a public-facing interface for viewing news articles and announcements. It includes a list view with pagination and category filtering, as well as detailed post views with rich text content.

## Features

### News List Page (`/tin-tuc`)

- **Display Published Posts**: Shows all published posts from the CMS
- **Category Filtering**: Filter posts by category with visual category buttons
- **Pagination**: Navigate through posts with page numbers (9 posts per page)
- **Responsive Grid**: 3-column grid on desktop, adapts to mobile
- **Loading States**: Skeleton loaders while fetching data
- **Empty States**: User-friendly messages when no posts are available

### Post Detail Page (`/tin-tuc/[slug]`)

- **Full Post Content**: Display complete post with rich text formatting
- **Featured Image**: Large hero image if available
- **Meta Information**: Publication date, author, category
- **Breadcrumb Navigation**: Easy navigation back to list
- **Related Posts**: Show 3 related posts from the same category
- **Share Functionality**: Native share API support
- **Not Found Handling**: Graceful error handling for missing posts

### NewsCard Component

- **Post Preview**: Title, excerpt, featured image, date, category
- **Hover Effects**: Visual feedback on hover
- **Responsive Images**: Next.js Image optimization
- **Fallback Images**: Placeholder when no featured image
- **Line Clamping**: Truncate long titles and excerpts

## File Structure

```
app/(public)/tin-tuc/
├── page.tsx              # News list page
├── [slug]/
│   └── page.tsx          # Post detail page
└── README.md             # This file

src/components/public/NewsCard/
├── NewsCard.tsx          # NewsCard component
└── index.ts              # Export file
```

## API Integration

### CMS Service Methods Used

- `CmsService.cmsControllerFindAllPosts('true')` - Fetch published posts
- `CmsService.cmsControllerFindAllCategories()` - Fetch categories

### Data Models

```typescript
interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  status: string;
  publishedAt?: string;
  createdAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  author?: {
    id: string;
    fullName: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}
```

## Styling

Uses Government Portal theme classes:
- `gov-portal-container` - Main container with padding
- `gov-portal-heading` - Page headings
- `gov-portal-card` - Card containers
- `gov-portal-button-primary` - Primary action buttons
- `gov-portal-button-secondary` - Secondary action buttons
- `gov-portal-link` - Text links
- `gov-portal-grid` - Responsive grid layout

## User Experience

### Navigation Flow

1. User visits `/tin-tuc` to see all news
2. User can filter by category or view all posts
3. User clicks on a post card to view details
4. User reads full post at `/tin-tuc/[slug]`
5. User can navigate to related posts or back to list

### Pagination Behavior

- Shows 9 posts per page
- Page numbers displayed in center
- Previous/Next buttons on sides
- Disabled state for first/last pages
- Smooth scroll to top on page change
- Resets to page 1 when category changes

### Category Filtering

- "Tất cả" (All) button shows all posts
- Individual category buttons filter posts
- Active category highlighted in blue
- Post count updates based on filter
- Pagination recalculates for filtered results

## Accessibility

- Semantic HTML structure
- Alt text for images
- Keyboard navigation support
- Focus states on interactive elements
- ARIA labels where appropriate

## Performance Optimizations

- Next.js Image component for optimized images
- Client-side data fetching with loading states
- Pagination to limit rendered posts
- Lazy loading of images
- Smooth scroll behavior

## Error Handling

- Loading states with skeleton loaders
- Empty state messages
- 404 handling for missing posts
- Console error logging
- Graceful fallbacks for missing data

## Future Enhancements

- Server-side rendering for better SEO
- Search functionality
- Tags/keywords filtering
- Social media sharing buttons
- Comments section
- Print-friendly view
- RSS feed

## Requirements Validation

✅ **Requirement 25.1**: Display list of published posts
✅ **Requirement 25.2**: Display post preview with image
✅ **Requirement 25.3**: Paginate posts list
✅ **Requirement 25.4**: Filter posts by category
✅ **Requirement 25.5**: Display full post content with rich text
✅ **Requirement 25.6**: Display latest posts from CMS
✅ **Requirement 25.7**: Load posts from CMS API

## Testing

To test the News module:

1. **List View**:
   - Navigate to `/tin-tuc`
   - Verify posts are displayed in grid
   - Test category filtering
   - Test pagination controls
   - Check loading states
   - Verify empty states

2. **Detail View**:
   - Click on a post card
   - Verify full content is displayed
   - Check featured image rendering
   - Test breadcrumb navigation
   - Verify related posts appear
   - Test back button

3. **Edge Cases**:
   - No posts available
   - No featured image
   - No excerpt
   - No category
   - Invalid slug (404)
   - Long titles/content

## Notes

- Posts must have `status: 'published'` to appear
- Slug must be unique for proper routing
- Rich text content rendered with `dangerouslySetInnerHTML`
- Date formatting uses Vietnamese locale
- Images require proper CORS configuration
