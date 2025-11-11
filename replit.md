# Outfred - Egypt's AI-Powered Local Fashion Hub

## Project Overview
**Outfred** is Egypt's first bilingual (Arabic RTL / English LTR) fashion discovery platform powered by AI-driven semantic search, outfit building, and multi-role dashboards. The application features a stunning glassmorphism design inspired by iOS/visionOS aesthetics.

## Tech Stack
- **Frontend**: React 18 + TypeScript, Wouter routing, TanStack Query v5, Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express, PostgreSQL with pgvector, Drizzle ORM, JWT auth
- **AI/ML**: Text/image embeddings (Local/HuggingFace/OpenAI), spell correction, outfit suggestions

## Architecture
- **Schema-first**: All models defined in `shared/schema.ts` with Drizzle + Zod
- **Type-safe**: End-to-end TypeScript with strict mode
- **Role-based access**: user → merchant → admin → owner (JWT with RBAC)
- **Glassmorphism UI**: Brand colors #411129 (burgundy), #b47f8e (rose), #cfd0d2 (charcoal)

## Key Features
1. **Bilingual Search**: Text + image search with Arabic spell correction (هودي → hoodie)
2. **Semantic Discovery**: pgvector-powered similarity matching
3. **Outfit Builder**: AI-suggested combinations, save & share
4. **Multi-role Dashboards**: User profile, merchant product CRUD + CSV import, admin system config
5. **Performance Tracking**: p95/p99 latency metrics per route (target: <250ms)

## Recent Changes (November 11, 2025)
### Completed (Session 1)
- ✅ Complete database schema with pgvector extension
- ✅ Full backend API (40+ endpoints: auth, products, search, merchants, brands, outfits, favorites, admin)
- ✅ JWT authentication with role-based access control (RBAC)
- ✅ Security hardening (architect-approved): ownership enforcement, input validation, immutable fields
- ✅ Database seeded with 48 products, 5 brands, test users (owner/merchant/user accounts)
- ✅ **Authentication Integration**:
  - AuthContext with JWT token management
  - Protected routes with role checks (user/merchant/admin/owner)
  - Login/Register pages connected to backend
  - Proper token refresh and cleanup on failures
  - Wouter routing with render function compatibility
- ✅ **Home Page Integration** (architect-approved):
  - ProductSummary schema for enriched data (price as decimal, brandName from JOIN)
  - Separate endpoints: `/api/products` (canonical Product) vs `/api/products/summary` (enriched)
  - Real data from database via TanStack Query
  - Loading skeletons and error states with retry
  - E2E test verified: products display correctly with prices (e.g., "599 EGP")
- ✅ **Product Page Integration** (architect-approved):
  - Real API integration: products, brands, related products
  - Global query client fetcher (centralized auth, error handling)
  - Null-safe array operations for related products
  - Loading skeletons and error states (product not found)
  - Conditional rendering: images, colors, sizes, tags
  - E2E test verified: details display, favorite toggle, related products (3 items)
  - Performance note: Some endpoints exceed p95 (1.8-1.9s) - monitoring for optimization

### Completed (Session 2 - November 11, 2025)
- ✅ **Search Bug Fixed**: Homepage now filters to `published=true` products only (matching search behavior)
- ✅ **Admin Dashboard**: Connected to real API (users, merchants, brands, metrics with mutations)
- ✅ **CMS Database Schema**: Added 4 new tables:
  - `navLinks` - Header navigation control (labelEn, labelAr, path, order, isEnabled)
  - `footerConfig` - Footer config singleton (copyrightText, socialLinks JSON)
  - `staticPages` - Static pages CMS (slug, title, content, metaDescription, isPublished)
  - `globalShoeBrands` - Global shoe brands catalog (name, popularModels, websiteUrl) - 10 brands seeded
- ✅ **Extended Tables**:
  - `outfits`: Added userHeight, userWeight, aiPrompt, shoeRecommendation (JSON)
  - `systemConfig`: Added Gemini API key support + logoUrl field
- ✅ **Schema Changes Pushed**: `npm run db:push` successful - all tables created in database
- ✅ **Admin Merchant CRUD**: Complete create/edit/delete with owner assignment, status approval, bilingual fields (Task 3)
- ✅ **Admin Product Management**: Merchant filtering, publish/draft toggle, edit/delete flows, CSV bulk import (Task 4)
- ✅ **Admin Brand Management** (Task 5):
  - Bilingual schema: nameEn, nameAr, websiteUrl (SQL migration from name→nameEn)
  - Logo upload: Multer diskStorage (server/uploads), FormData, express.static serving
  - Full CRUD: Create/update/delete with logo persistence
  - Hot reload safety: registerRoutes guard prevents duplicate middleware/routes
  - Image search: uploadMemory instance for buffer support
- ✅ **Gemini AI Migration** (Task 6):
  - Replaced OpenAI with Google Gemini across all AI features
  - Text embeddings: text-embedding-004 model (768 dimensions)
  - Image embeddings: Vision model (gemini-2.0-flash-lite) describes image → embed description
  - Outfit suggestions: gemini-2.0-flash-lite with JSON response parsing
  - Admin UI: Gemini provider option + API key input
  - Error handling: Fallback to random embeddings on failure
- ✅ **Outfit Builder Redesign** (Task 7):
  - Backend: POST /api/outfit/ai with Zod validation (height 100-250cm, weight 30-200kg)
  - Gemini Integration: Uses createOutfitSuggestionProvider with API key from system config
  - Frontend: Height/weight number inputs, AI prompt textarea with icons
  - Generate Button: GlowButton with loading state (Loader2 spinner)
  - TanStack Query: Real products from /api/products/summary
  - AI Suggestion Display: Top product, bottom product, shoe recommendation cards
  - Reasoning Display: AI explanation of outfit choices
  - Auto-select: Top+bottom products added to selected items
  - Toast Notifications: Success/error messages
  - Authentication: Bearer token in fetch headers
  - Fallback: Simple rule-based suggestions if Gemini not configured
- ✅ **Navigation CMS** (Task 8):
  - Database Schema: Migrated `label` → `labelEn` + `labelAr` (bilingual nav links)
  - Backend: Storage methods + API routes (public GET + admin CRUD with validation)
  - Seeded Data: 4 default nav links (Home, Search, Outfit Builder, Brands)
  - Navbar Component: Fetches from `/api/nav-links` with bilingual rendering (language === "ar" ? labelAr : labelEn)
  - Admin Dashboard: Navigation tab added with placeholder UI ("Coming soon")
  - Architect Review: PASS - Navbar reads from DB, bilingual support works, no TypeScript errors
- ✅ **Footer CMS** (Task 9):
  - Database Schema: Migrated `copyrightText` → `copyrightTextEn` + `copyrightTextAr` (SQL ALTER TABLE)
  - Backend: GET /api/footer-config (public), PATCH /api/admin/footer-config (admin-only)
  - Footer Component: Bilingual rendering with LanguageContext integration
  - FooterConfigView: Admin UI with En/Ar copyright inputs + 6 social links (Instagram, Facebook, Twitter, TikTok, YouTube, LinkedIn)
  - Admin Dashboard: Footer tab added with FileText icon
  - Bug Fix: MerchantDialog infinite loop resolved (useEffect wrapper for form.reset)
  - Architect Review: PASS - Bilingual schema, secure endpoints, LanguageContext integration, query invalidation correct
- ✅ **Static Pages CMS** (Task 10) - **ARCHITECTURALLY COMPLETE**:
  - Database Schema: staticPages table (slug, titleEn, titleAr, contentEn, contentAr, metaDescriptionEn/Ar, isPublished)
  - Backend: Storage methods + split routes (public `/api/pages/:slug` + admin `/api/admin/pages` CRUD)
  - Frontend: StaticPage.tsx (public view with SEO), StaticPagesView.tsx (admin CRUD with TinyMCE)
  - AdminDashboard: Static Pages tab integrated (button + conditional render)
  - Security: Public/admin routes separated, admin sees all pages (including drafts), public sees published only
  - Critical fixes applied: Auth schema restored, query bug fixed, import/export mismatch fixed (5 architect iterations)
  - Architect Review: **PASS** - Implementation architecturally sound
  - **E2E Test Status**: ❌ **BLOCKED** by pre-existing auth bug (tokens saved but /admin redirects to /login)
  - **Known Auth Regression**: Login succeeds, tokens stored, but AuthContext fails to read localStorage on init → protected routes redirect to /login
  - **Next Action**: Create separate task to debug AuthContext initialization (outside Task 10 scope)

## Current Status
- **Server**: Running on port 5000 ✅
- **Database**: Schema updated with static_pages table + bilingual CMS tables ✅  
- **Frontend**: Home, Product, Admin, OutfitBuilder, StaticPage pages integrated ✅
- **Backend**: All API routes implemented (public + admin static pages) ✅
- **Authentication**: ⚠️ **REGRESSION** - Login succeeds but /admin redirects to /login (AuthContext init bug)
- **AI**: Migrated to Gemini API (text/image embeddings, outfit suggestions) ✅
- **Outfit Builder**: Complete with AI form, Gemini integration, product display ✅
- **Navigation CMS**: Navbar reads from DB with bilingual support (En/Ar) ✅
- **Footer CMS**: Bilingual footer with admin controls (En/Ar copyright + social links) ✅
- **Static Pages CMS**: Backend/frontend complete, admin tab integrated ✅ (e2e blocked by auth bug)
- **Integration Progress**: 10/11 tasks completed (Tasks 1-10)

## Next Steps (Task 11+)
1. **URGENT - Auth Bug Fix**: Debug AuthContext initialization (tokens saved but not read on app bootstrap → /admin redirects to /login)
2. **Header Navigation CRUD UI** (Enhancement): Build full admin CRUD interface for navigation links (create/edit/delete/reorder) - currently placeholder
3. **Logo Upload** (Task 11): Replace "Outfred" text with admin-uploadable logo in header

## Running the Project
```bash
# Start development server
npm run dev

# Push database schema
npm run db:push

# Seed demo data
npm run db:seed

# Default credentials
# Owner: owner@outfred.com / Owner#123
# Merchant: merchant1@outfred.com / Demo#123
# User: user@outfred.com / Demo#123
```

## File Structure
```
outfred/
├── client/src/
│   ├── components/ui/      # GlassCard, GlowButton, SearchBar, ProductTile, etc.
│   ├── contexts/           # LanguageContext for i18n
│   ├── pages/              # Home, Search, ProductPage, Profile, Dashboards
│   └── lib/                # Utilities, query client, i18n
├── server/
│   ├── lib/                # auth.ts, ai-providers.ts, metrics.ts
│   ├── middleware/         # auth.ts (authMiddleware, requireRole)
│   ├── routes.ts           # All API endpoints
│   ├── storage.ts          # DatabaseStorage implementation
│   └── seed.ts             # Demo data generator
├── shared/
│   └── schema.ts           # Drizzle models + Zod schemas
└── design_guidelines.md    # Visual design system
```

## User Preferences
- **Design**: Glassmorphism style, premium feel, exceptional polish
- **Languages**: Bilingual Arabic (RTL) + English (LTR) with runtime toggle
- **Performance**: p95 latency target < 250ms
- **Search**: Hybrid BM25 + semantic vector similarity
- **AI**: Pluggable providers (Local/HF/OpenAI)

## Security Architecture
### Product Ownership
- **Creation**: Merchants auto-assigned their merchantId (prevents impersonation)
- **Updates**: Merchants cannot change merchantId (only admins can reassign products)
- **Deletion**: Ownership verified before deletion

### Merchant Management
- **Self-Upgrade**: Users can upgrade via `/api/user/upgrade-to-merchant` with limited fields (status always "pending")
- **Admin Creation**: Admins/owners use `/api/admin/merchants` with full control
- **Approval Flow**: Self-upgraded merchants must be approved by admin

### Role Hierarchy
- **user**: Browse, search, save outfits, self-upgrade to merchant
- **merchant**: All user actions + create/manage own products + view analytics
- **admin**: All merchant actions + manage all merchants/products + configure system
- **owner**: All admin actions + assign owner role + access sensitive configs

## Known Issues
- **CRITICAL - Auth Regression**: Login succeeds (200 response, tokens saved to localStorage) but navigating to /admin redirects to /login. AuthContext fails to read tokens on app init. Server-side auth works (POST /api/auth/refresh returns 200), but client-side state remains unauthenticated. Likely issue in AuthContext bootstrap logic (useEffect dependency or localStorage read timing).
- BrandBadge component error on Home page (undefined brandName.charAt) - needs null safety fix
- Image search requires CLIP embedding setup (or use Gemini vision model)
- Spell correction dictionary needs expansion
- Integration tests for RBAC paths needed
- Consider automated coverage for AI endpoint validation (with/without Gemini config)

## Performance Notes
- Metrics tracked per route in `metrics` table
- View p95/p99: `GET /api/admin/metrics`
- Target: p95 < 250ms, p99 < 500ms

## Development Notes
- **Routing**: Use wouter's `useLocation()` for navigation: `const [, setLocation] = useLocation(); setLocation("/path");`
- **Authentication**: JWT tokens in `Authorization: Bearer <token>` header
- **Queries**: TanStack Query v5 with default fetcher configured
- **Styling**: Tailwind + shadcn/ui, follow design_guidelines.md religiously
- **Fonts**: Cairo (Arabic), Inter (English) loaded from Google Fonts
