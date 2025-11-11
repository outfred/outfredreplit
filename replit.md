# Outfred - Egypt's AI-Powered Local Fashion Hub

### Overview
Outfred is Egypt's first bilingual (Arabic RTL / English LTR) fashion discovery platform. It leverages AI for semantic search, outfit building, and features multi-role dashboards. The platform aims to provide a premium user experience with a glassmorphism design inspired by iOS/visionOS. Key capabilities include AI-powered product discovery, outfit suggestions, and comprehensive management tools for users, merchants, and administrators. The project vision is to become a leading local fashion hub in Egypt.

### User Preferences
- **Design**: Glassmorphism style, premium feel, exceptional polish
- **Languages**: Bilingual Arabic (RTL) + English (LTR) with runtime toggle
- **Performance**: p95 latency target < 250ms
- **Search**: Hybrid BM25 + semantic vector similarity
- **AI**: Pluggable providers (Local/HF/OpenAI)

### System Architecture
The application is built with a schema-first, type-safe architecture using React 18 + TypeScript for the frontend and Node.js + Express with PostgreSQL (pgvector) for the backend. Drizzle ORM is used for database interactions.

**UI/UX Decisions:**
- **Design System**: Glassmorphism UI with brand colors #411129 (burgundy), #b47f8e (rose), #cfd0d2 (charcoal).
- **Styling**: Tailwind CSS + shadcn/ui.
- **Fonts**: Cairo (Arabic) and Inter (English) from Google Fonts.
- **Bilingual Support**: Full Arabic (RTL) and English (LTR) with runtime toggling for all text content, including dynamically loaded data.

**Technical Implementations & Feature Specifications:**
- **Authentication**: JWT-based with robust role-based access control (RBAC) for user, merchant, admin, and owner roles. Includes protected routes and token refresh mechanisms.
- **Search**: AI-powered bilingual search with text and image input, supporting Arabic spell correction and semantic discovery via `pgvector` for similarity matching.
- **Outfit Builder**: AI-suggested outfit combinations based on user input (height, weight, prompt), allowing users to save and share. Integrates with Gemini AI for suggestions.
- **Multi-role Dashboards**:
    - **User Profile**: Personal settings and saved items.
    - **Merchant Dashboard**: 
      - **Product Management**: Full CRUD with individual create/edit dialogs (title, description, price, images)
      - **Product Import**: Three methods:
        1. **CSV Import**: Bulk upload via file (supports title, description, price, images, colors, sizes, tags, brand)
        2. **URL Scraper (Single)**: Extract product data from individual product pages
        3. **Shopify Collection Import**: Fetch multiple products from Shopify collection pages (e.g., `/collections/all`) via JSON API, with checkbox selection and bulk import (up to 250 products, limited to 50 for safety). Features URL normalization, progress feedback, and success/failure tracking.
      - **Analytics**: Track products, views, clicks, conversion rate, and revenue
      - **Store Settings**: Configure store name, city, and contact information
    - **Admin Dashboard**: Comprehensive system configuration, management of users, merchants, brands, navigation links, footer content, and static pages.
- **Content Management Systems (CMS)**:
    - **Navigation CMS**: Full CRUD interface for header navigation links with bilingual support (labelEn/labelAr), order management, and up/down reordering. Implemented in separate `NavigationLinksView.tsx` component.
    - **Footer CMS**: Configurable footer content, including bilingual copyright text and social media links.
    - **Static Pages CMS**: Management of static content pages with bilingual support and SEO metadata.
- **Performance Monitoring**: P95/P99 latency metrics tracked per API route, with a target of <250ms for p95.
- **Security**: Ownership enforcement for resources (e.g., merchants can only manage their own products), input validation, and immutable fields.
- **AI Integration**: Switched to Google Gemini API for text embeddings (text-embedding-004), image embeddings (Vision model), and outfit suggestions (gemini-2.0-flash-lite). Features a pluggable AI provider architecture.
- **File Structure**: Organized into `client`, `server`, and `shared` directories, with `shared/schema.ts` defining all Drizzle models and Zod schemas for end-to-end type safety.

### External Dependencies
- **Frontend**: React 18, TypeScript, Wouter (routing), TanStack Query v5, Tailwind CSS, shadcn/ui.
- **Backend**: Node.js, Express, PostgreSQL, pgvector, Drizzle ORM, JWT.
- **AI/ML**: Google Gemini API (text-embedding-004, gemini-2.0-flash-lite), potentially other pluggable providers (Local/HuggingFace/OpenAI) for embeddings and suggestions.
- **Payments**: (Not explicitly mentioned as integrated, but a common dependency for e-commerce).
- **Cloud Storage**: Multer for image uploads (specifically for brand logos, storing in `server/uploads`).