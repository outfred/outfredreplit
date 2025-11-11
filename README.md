# Outfred - Egypt's AI-Powered Local Fashion Hub

**Outfred** is Egypt's first bilingual (Arabic RTL / English LTR) fashion discovery platform powered by AI-driven semantic search, outfit building, and multi-role dashboards. Built with a stunning glassmorphism design inspired by iOS/visionOS aesthetics.

## 🎨 Design Language

- **Brand Colors**: Deep burgundy (#411129), dusty rose (#b47f8e), charcoal (#cfd0d2)
- **Typography**: Cairo (Arabic), Inter (English)
- **UI Style**: Glassmorphism with backdrop-blur, hairline borders, glow effects
- **Responsive**: Mobile-first with seamless RTL/LTR switching

## ✨ Key Features

### For Users
- **Bilingual Search**: Text and image search with Arabic spell correction
- **Semantic Discovery**: pgvector-powered similarity matching
- **Outfit Builder**: AI-suggested combinations, save & share
- **Favorites**: Bookmark products across merchants
- **Profile Dashboard**: Order history, saved outfits, preferences

### For Merchants
- **Product Management**: CRUD with bulk CSV import
- **Analytics Dashboard**: Views, clicks, conversion metrics
- **Brand Integration**: Connect to existing Egyptian brands
- **Indexing Control**: Trigger product re-indexing for search

### For Admins
- **User Management**: Role assignment (user/merchant/admin/owner)
- **Merchant Approval**: Review and activate new sellers
- **AI Configuration**: Choose embedding provider (Local/HuggingFace/OpenAI)
- **System Metrics**: p95/p99 latency tracking, API analytics
- **Feature Flags**: Toggle image search, outfit AI, multilingual

### For Owner
- All admin capabilities plus:
- **SMTP Configuration**: Email notification settings
- **Spell Correction**: Manage Arabic-English synonym dictionary
- **Indexing Jobs**: Monitor background embedding generation

## 🛠 Tech Stack

**Frontend**:
- React 18 + TypeScript
- Wouter (routing)
- TanStack Query v5
- Tailwind CSS + shadcn/ui
- Framer Motion

**Backend**:
- Node.js + Express
- PostgreSQL with pgvector extension
- Drizzle ORM
- JWT authentication
- Multer (file uploads)

**AI/ML**:
- Text embeddings: Local/HuggingFace/OpenAI
- Image embeddings: CLIP-based visual similarity
- Spell correction: Custom Arabic-English synonyms
- Outfit AI: Rule-based complementary suggestions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ with pgvector extension

### 1. Clone & Install
```bash
git clone <repo-url>
npm install
```

### 2. Database Setup
```bash
# Push schema to database
npm run db:push

# Seed with demo data (50+ products, brands, users)
npm run db:seed
```

### 3. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5000`

### 4. Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@outfred.com | Owner#123 |
| Merchant 1 | merchant1@outfred.com | Demo#123 |
| Merchant 2 | merchant2@outfred.com | Demo#123 |
| User | user@outfred.com | Demo#123 |

## 📁 Project Structure

```
outfred/
├── client/src/
│   ├── components/ui/      # Reusable components (GlassCard, GlowButton, etc.)
│   ├── contexts/           # LanguageContext for i18n
│   ├── pages/              # Home, Search, ProductPage, Profile, Dashboards
│   └── lib/                # Utilities, query client, i18n
├── server/
│   ├── lib/                # Auth (JWT), AI providers, metrics
│   ├── middleware/         # authMiddleware, requireRole
│   ├── routes.ts           # All API endpoints
│   ├── storage.ts          # Database abstraction layer
│   └── seed.ts             # Demo data generator
├── shared/
│   └── schema.ts           # Drizzle models + Zod schemas
└── design_guidelines.md    # Visual design system
```

## 🔐 Authentication Flow

1. **Register/Login**: POST `/api/auth/register` or `/api/auth/login`
2. Receive `accessToken` (15min) and `refreshToken` (7d)
3. Include in requests: `Authorization: Bearer <accessToken>`
4. Refresh when expired: POST `/api/auth/refresh` with refreshToken

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List products (filters: merchantId, brandId, published, search)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (merchant+)
- `PATCH /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/:id/view` - Track view
- `POST /api/products/:id/click` - Track click

### Search
- `POST /api/search/text` - Text search with filters
- `POST /api/search/image` - Image-based search (multipart/form-data)
- `POST /api/search/spell` - Get spell suggestions

### Merchants (Admin)
- `GET /api/admin/merchants` - List all merchants
- `POST /api/admin/merchants` - Create merchant
- `PATCH /api/admin/merchants/:id` - Update merchant
- `DELETE /api/admin/merchants/:id` - Delete merchant
- `POST /api/merchant/import/csv` - Import products from CSV

### Brands
- `GET /api/brands` - List all brands
- `POST /api/admin/brands` - Create brand (admin+)
- `PATCH /api/admin/brands/:id` - Update brand
- `DELETE /api/admin/brands/:id` - Delete brand

### Outfits
- `GET /api/user/outfits` - List user's outfits
- `POST /api/user/outfits` - Create outfit
- `PATCH /api/user/outfits/:id` - Update outfit
- `DELETE /api/user/outfits/:id` - Delete outfit
- `POST /api/outfit/ai` - Get AI suggestions

### Favorites
- `GET /api/user/favorites` - List favorites
- `POST /api/user/favorites` - Add favorite
- `DELETE /api/user/favorites/:productId` - Remove favorite

### Admin
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/:id` - Update user role
- `GET /api/admin/metrics` - Get API metrics + p95/p99
- `GET /api/admin/config` - Get system config
- `PATCH /api/admin/config` - Update system config
- `POST /api/admin/index/rebuild` - Trigger indexing job
- `GET /api/admin/index/health` - Get indexing status

## 🧪 CSV Import Format

Merchants can bulk import products via CSV:

```csv
title,description,price,images,colors,sizes,tags
Black Hoodie,Premium cotton hoodie,799,https://example.com/img.jpg,Black;Gray,S;M;L;XL,hoodie;casual
```

## 🔍 Search Architecture

### Text Search
1. **BM25 Full-Text**: PostgreSQL `ts_vector` for keyword matching
2. **Semantic Vector**: pgvector cosine similarity for concept matching
3. **Hybrid Ranking**: Combines both scores for relevance

### Image Search
1. Upload image → Generate CLIP embedding
2. Find products with similar `imageEmbedding` vectors
3. Return top K results by cosine distance

### Spell Correction
- Arabic → English: هودي → hoodie
- English typos: hoddie → hoodie
- Expandable via `/api/admin/config` synonyms field

## 📊 Performance Targets

- **p95 latency**: < 250ms for all endpoints
- **p99 latency**: < 500ms
- Metrics tracked per route in `metrics` table
- View analytics: `GET /api/admin/metrics`

## 🌐 Internationalization

Language toggle in navbar switches:
- **Text direction**: RTL (Arabic) ↔ LTR (English)
- **Font family**: Cairo ↔ Inter
- **UI strings**: `client/src/lib/i18n.ts`

Example:
```typescript
const { t, language, setLanguage } = useLanguage();

// Use in components
<h1>{t("welcome")}</h1>

// Toggle language
setLanguage(language === "ar" ? "en" : "ar");
```

## 🎯 Outfit Builder AI

Rule-based system suggests complementary products:
1. Select seed product (e.g., black jeans)
2. AI finds: tops, jackets, shoes matching color/style
3. User adds to outfit canvas
4. Save with title + notes

Future: Replace with LLM-based stylist recommendations

## 🔧 Configuration

System owner can configure via Admin Dashboard:

**AI Providers**:
- `local`: Stub embeddings (development)
- `huggingface`: HF Inference API
- `openai`: OpenAI Embeddings API

**Feature Flags**:
- `enableImageSearch`: Toggle visual search
- `enableOutfitAI`: Toggle AI suggestions
- `enableSpellCorrection`: Toggle autocorrect
- `enableMultilingual`: Toggle Arabic support

**SMTP** (Owner only):
- Configure email notifications
- Password reset, order confirmations

## 📝 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📧 Support

For issues or questions:
- Email: support@outfred.com
- Issues: GitHub Issues

---

**Built with ❤️ for Egypt's fashion community**
