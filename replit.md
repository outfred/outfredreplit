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

## Current Status
- **Server**: Running on port 5000 ✅
- **Database**: Seeded with 48 products, 5 brands ✅
- **Frontend**: Home & Product pages integrated with real data ✅
- **Backend**: All API routes implemented and tested ✅
- **Authentication**: Complete with protected routes and RBAC ✅
- **Integration Progress**: 4/8 tasks complete

## Next Steps (Task 5+)
1. **Search Page**: Connect to hybrid search API, implement text/image search, spell correction, filters
2. **User Profiles & Outfits**: Integrate outfit builder with CRUD API, AI suggestions, auth-protected actions
3. **Merchant Dashboard**: Product CRUD with ownership, CSV import, analytics, indexing trigger
4. **Admin Dashboard**: User/merchant management, AI config, metrics, merchant approval
5. **Polish & Testing**: Comprehensive E2E tests, RTL/LTR verification, performance optimization (<250ms p95)

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
- Frontend-backend integration pending
- Loading/error states need implementation
- Image search requires CLIP embedding setup
- Spell correction dictionary needs expansion
- Integration tests for RBAC paths needed

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
