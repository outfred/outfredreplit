# Outfred Design Guidelines

## Design Approach
**Reference-Based Approach**: Inspired by modern e-commerce platforms with premium fashion aesthetics. Drawing from:
- Airbnb (glass cards, clean layouts)
- Instagram (image-first product tiles)
- Linear (crisp typography, refined UI)
- Apple (minimalist iOS/visionOS glassmorphism)

## Core Design System

### Brand Colors
- **Primary**: `#411129` (Deep burgundy)
- **Accent**: `#b47f8e` (Dusty rose)
- **Neutral**: `#cfd0d2` (Light gray)
- **Surface layers**: 8–12% opacity overlays for glassmorphic depth

### Typography
- **Arabic (RTL)**: Cairo font family
- **English (LTR)**: Inter font family
- **Hierarchy**: 
  - Hero headings: text-4xl to text-6xl, font-bold
  - Section headings: text-2xl to text-3xl, font-semibold
  - Body text: text-base, font-normal
  - Captions: text-sm, font-medium

### Layout & Spacing System
**Tailwind spacing primitives**: Consistent use of 2, 4, 8, 12, 16, 20, 24 units
- Component padding: `p-4`, `p-6`, `p-8`
- Section margins: `my-12`, `my-16`, `my-20`
- Grid gaps: `gap-4`, `gap-6`, `gap-8`
- Container max-widths: `max-w-7xl` for main content

### Glassmorphism System (iOS/visionOS Style)
- **Border radius**: `rounded-2xl`, `rounded-3xl` for cards and containers
- **Borders**: Hairline 1px borders with subtle opacity (`border border-white/10`)
- **Backdrop**: `backdrop-blur-xl` for glass effect
- **Background**: Semi-transparent layers with `bg-white/8` to `bg-white/12`
- **Shadows**: Subtle elevation with `shadow-lg`, `shadow-xl`

## Component Library

### Core Components
1. **GlassCard**: Rounded corners (2xl/3xl), backdrop blur, hairline borders, subtle shadows
2. **GlowButton**: Primary actions with accent color, subtle glow effect, no hover blurs on image backgrounds
3. **NavBar**: Sticky header with glass effect, bilingual toggle, user menu
4. **SearchBar**: Prominent search with text/image upload toggle
5. **ProductTile**: Image-first with overlay info, aspect-ratio-square
6. **BrandBadge**: Logo with glass background, rounded-full or rounded-xl
7. **DataTable**: Clean rows, sortable headers, pagination
8. **EmptyState**: Centered icon + message for zero-state screens

### Navigation Components
- Top navigation bar with glass effect, sticky positioning
- Merchant/Admin sidebars with icon + label, collapsible on mobile
- Breadcrumbs for deep navigation paths
- Tab navigation for dashboard sections

### Form Components
- Glass-styled inputs with `rounded-xl`, subtle borders
- Color/size variant selectors (pills or swatches)
- File upload dropzones with preview thumbnails
- Toggle switches for feature flags and settings
- Multi-language form labels with RTL/LTR support

### Data Display
- Product grids: 2-4 columns responsive (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`)
- Analytics cards: Metric value + label + trend indicator
- Outfit builder: Drag-and-drop grid with preview panel

## Page-Specific Layouts

### B2C Public Pages

**Home Page**:
- Full-width hero section (70-80vh) with background image, search bar overlay, gradient overlay for readability
- Trending brands section: Horizontal scroll or grid of brand badges
- Category showcase: Large image tiles with category names
- Featured products: 4-column grid with ProductTiles
- Footer: Links, language toggle, social icons

**Search Results**:
- Sticky filter sidebar (left on LTR, right on RTL)
- Product grid main area (3-4 columns)
- Sort dropdown and view toggle (grid/list)
- Pagination or infinite scroll

**Product Page**:
- Image gallery (left on LTR, right on RTL): Primary large image + thumbnails
- Product details (opposite side): Title, price, brand badge, size/color selectors, add to favorites, merchant info
- Related products section below
- Outfit suggestions carousel

**Outfit Builder**:
- Split layout: Selected items (left/right) + recommendations panel
- Save outfit button with glass effect
- AI suggestion trigger with loading state

### Merchant Dashboard

**Layout Structure**:
- Sidebar navigation (glass effect, icons + labels)
- Main content area with page header + breadcrumbs
- Action buttons in header (Add Product, Import CSV, Reindex)

**Product Management**:
- Table view with thumbnail, title, price, status, actions
- Inline editing or modal forms
- Bulk actions toolbar

**Import Interface**:
- CSV upload dropzone (prominent, centered)
- Mapping preview table
- Progress indicator for batch processing
- Success/error toast notifications

**Analytics**:
- Metric cards grid (4 columns): Views, clicks, conversions, revenue
- Simple line/bar charts (minimal, clean)
- Date range selector

### Admin Dashboard

**Layout Structure**:
- Comprehensive sidebar with sections: Users, Merchants, AI Controls, System
- Tabbed interfaces for complex sections

**AI Controls**:
- Provider selection: Dropdown with Local/HuggingFace/OpenAI
- Feature toggles: Switch components for each AI feature
- Index configuration: Input fields for dimensions, metric, topK
- Spell correction: Toggle + dictionary management table

**System Metrics**:
- Endpoint latency cards with p95/p99 values
- Index sizes and status indicators
- Cron job health dashboard
- Real-time metric stream (optional chart)

**Page Builder**:
- Section list with add/remove/reorder
- JSON preview panel
- Export button

## RTL/LTR Bilingual Support

### Implementation
- Runtime `dir="rtl"` or `dir="ltr"` attribute on root element
- Tailwind directional utilities: `ms-4` (margin-start), `pe-6` (padding-end)
- Flip navigation positions, sidebars, and text alignment
- Mirror icons where appropriate (arrows, chevrons)
- Maintain visual hierarchy in both directions

### UI Elements
- Language toggle: Floating button or in navigation bar (flag icons or AR/EN text)
- Persist preference in localStorage
- All text content in both languages via dictionary lookup

## Animations & Interactions

**Micro-interactions** (150–250ms ease):
- Hover: Subtle scale (1.02) or brightness increase
- Enter: Fade + translate-y (from 10px to 0)
- Exit: Fade only
- Loading states: Shimmer effect on product tiles

**Restricted animations**:
- No distracting looping animations
- No parallax or scroll-driven effects
- Keep motion purposeful and minimal

## Images

### Hero Images
- **Home Page**: Full-width fashion lifestyle image (Egyptian models, Cairo backdrop, diverse clothing styles)
- **Product Page**: Multiple high-quality product images (white background + lifestyle shots)
- **Brand Pages**: Brand logo + cover/banner image

### Product Images
- Aspect ratio: Square (1:1) for consistency
- Minimum resolution: 800x800px
- Support for multiple images per product (gallery)
- Image upload with client-side compression

### Placeholder Strategy
- Empty states: Illustrated icons or simple graphics
- Missing product images: Generic fashion icon with brand colors
- Loading states: Shimmer skeleton matching layout

## Accessibility & Responsiveness

- Mobile-first responsive: Stack columns on small screens, expand on desktop
- Touch targets: Minimum 44x44px for all interactive elements
- Keyboard navigation: Focus states with visible outlines
- ARIA labels for icon-only buttons
- Color contrast: Ensure text meets WCAG AA standards on glass backgrounds

## Design Consistency Rules

- Use glass effect consistently: cards, modals, dropdowns, navigation
- Maintain hairline border style across all containers
- Apply brand colors strategically: primary for CTAs, accent for highlights
- Keep typography hierarchy strict across all pages
- Respect spacing system for visual rhythm