# Public Layout Components

This directory contains the layout components for the public-facing interface of the Admission Management System.

## Components

### PublicHeader

The header component for the public interface with navigation menu.

**Features:**
- Logo and branding
- Desktop navigation menu
- Mobile responsive hamburger menu
- Active route highlighting
- Government Portal blue theme (#0052CC)

**Navigation Items:**
- Trang chủ (/)
- Tra cứu kết quả (/tra-cuu)
- Ngành tuyển sinh (/nganh-tuyen-sinh)
- Tin tức (/tin-tuc)
- Hướng dẫn (/huong-dan)

**Usage:**
```tsx
import { PublicHeader } from '@/components/public/PublicLayout';

<PublicHeader />
```

### PublicFooter

The footer component with contact information and links.

**Features:**
- Multiple footer sections with links
- Contact information (address, phone, email)
- Copyright notice
- Privacy policy and terms links
- Responsive grid layout

**Footer Sections:**
- Thông tin (Information)
- Tuyển sinh (Admission)
- Tin tức (News)
- Liên hệ (Contact)

**Usage:**
```tsx
import { PublicFooter } from '@/components/public/PublicLayout';

<PublicFooter />
```

## Layout Structure

The public layout uses a flex column layout with:
- Header (sticky at top)
- Main content (flex-1 to fill available space)
- Footer (at bottom)

```tsx
<div className="flex flex-col min-h-screen">
  <PublicHeader />
  <main className="flex-1">
    {children}
  </main>
  <PublicFooter />
</div>
```

## Government Portal Theme

The public interface follows Government Portal design principles:

### Colors
- Primary Blue: #0052CC
- Dark Blue: #0043A8
- White: #FFFFFF
- Gray shades for text and backgrounds

### Design Principles
- **Formal and trustworthy**: Professional appearance suitable for government services
- **Blocky layout**: Clear rectangular sections with defined borders
- **High contrast**: Easy to read text and clear visual hierarchy
- **Responsive**: Mobile-first design that works on all devices

### CSS Classes

Custom utility classes are defined in `globals.css`:

- `.gov-portal-section` - White section with border
- `.gov-portal-heading` - Large heading style
- `.gov-portal-subheading` - Medium heading style
- `.gov-portal-card` - Card component with hover effect
- `.gov-portal-button-primary` - Primary blue button
- `.gov-portal-button-secondary` - Secondary outlined button
- `.gov-portal-link` - Blue underlined link
- `.gov-portal-container` - Container with padding
- `.gov-portal-grid` - Responsive grid layout
- `.gov-portal-hero` - Hero section with gradient
- `.gov-portal-stats` - Statistics display section
- `.gov-portal-input` - Form input style
- `.gov-portal-label` - Form label style

## Responsive Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## Implementation Details

### Requirements Satisfied

**Requirement 21.1**: Public layout with header and footer ✓
**Requirement 21.2**: Footer with contact information and links ✓
**Requirement 21.3**: Government Portal formal colors (blue, white, gray) ✓
**Requirement 21.4**: Blocky layout style ✓
**Requirement 21.5**: Responsive design ✓
**Requirement 21.6**: Responsive navigation ✓
**Requirement 21.7**: Active menu item highlighting ✓

### Technologies Used

- Next.js 14+ App Router
- TypeScript
- Tailwind CSS
- Lucide React (icons)
- Client-side navigation with Next.js Link

## Testing

To test the public layout:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the public pages:
   - Homepage: http://localhost:3000
   - Any public route to see the layout

3. Test responsive behavior:
   - Resize browser window
   - Test mobile menu on small screens
   - Verify active route highlighting

## Future Enhancements

- Add search functionality to header
- Add language switcher (Vietnamese/English)
- Add breadcrumb navigation for nested pages
- Add accessibility improvements (ARIA labels, keyboard navigation)
- Add analytics tracking for navigation clicks
