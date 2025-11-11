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
### Completed
- ✅ Complete database schema with pgvector extension (User, Merchant, Brand, Product, Outfit, Favorite, SystemConfig, Metric, IndexingJob)
- ✅ Full backend API implementation with 40+ endpoints (auth, products, search, merchants, brands, outfits, favorites, admin)
- ✅ JWT authentication with role-based access control
- ✅ AI provider abstraction layer (Local/HuggingFace/OpenAI)
- ✅ Storage layer with DatabaseStorage implementation
- ✅ Metrics middleware for API performance tracking
- ✅ Comprehensive seed data (60+ products, 5 brands, demo users)
- ✅ README.md and README_AI.md documentation

### Navigation Fix
- Fixed wouter import issue: Changed `useNavigate()` to `useLocation()` across all pages
- Updated: Home.tsx, Search.tsx, ProductPage.tsx, OutfitBuilder.tsx

## Current Status
- **Server**: Running on port 5000 ✅
- **Database**: Schema pushed, ready for seeding
- **Frontend**: All components built, routing configured
- **Backend**: All API routes implemented
- **Documentation**: Complete user + developer guides

## Next Steps
1. Run seed data: `npm run db:seed`
2. Test complete user journey
3. Integrate frontend with backend APIs
4. Add loading states and error handling
5. Test RTL/LTR switching
6. Performance optimization (ensure p95 < 250ms)

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

## Known Issues
- Frontend-backend integration pending
- Loading/error states need implementation
- Image search requires CLIP embedding setup
- Spell correction dictionary needs expansion

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
