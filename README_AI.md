# Outfred - AI/Agent Developer Guide

This document provides technical guidance for AI agents and developers working on the Outfred codebase.

## 🧠 Architecture Philosophy

**Schema-First Development**: All data models are defined in `shared/schema.ts` using Drizzle ORM. This ensures type safety across frontend and backend.

**Horizontal Batching**: Complete entire feature layers before moving to the next:
1. Schema → 2. Frontend → 3. Backend → 4. Integration → 5. Testing

**Type Safety**: TypeScript everywhere with strict mode. Zod schemas for runtime validation.

## 🗂 Data Models

### Core Entities

```typescript
// User with RBAC
User {
  id: varchar (UUID)
  email: string (unique)
  passwordHash: string
  role: "user" | "merchant" | "admin" | "owner"
  name: string
  createdAt: timestamp
}

// Merchant (seller accounts)
Merchant {
  id: varchar (UUID)
  ownerUserId: varchar → User.id
  name: string
  city: string
  status: "pending" | "active" | "suspended"
  contact: string
  createdAt: timestamp
}

// Brand (e.g., "Cairo Streetwear")
Brand {
  id: varchar (UUID)
  name: string (unique)
  city: string
}

// Product (fashion items)
Product {
  id: varchar (UUID)
  merchantId: varchar → Merchant.id
  brandId: varchar → Brand.id
  title: string (bilingual: "Hoodie / هودي")
  description: string
  priceCents: integer
  currency: string (default "EGP")
  colors: string[] (e.g., ["Black", "Gray"])
  sizes: string[] (e.g., ["S", "M", "L"])
  fit: "slim" | "regular" | "relaxed" | "oversized"
  gender: "male" | "female" | "unisex"
  tags: string[] (e.g., ["hoodie", "casual"])
  images: string[] (URLs)
  vectors: jsonb { textEmbedding: number[], imageEmbedding: number[] }
  published: boolean
  views: integer
  clicks: integer
  lastIndexedAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}

// Outfit (user-created collections)
Outfit {
  id: varchar (UUID)
  userId: varchar → User.id
  title: string
  notes: string
  productIds: string[]
  createdAt: timestamp
}

// Favorite (user bookmarks)
Favorite {
  userId: varchar → User.id
  productId: varchar → Product.id
  createdAt: timestamp
  PRIMARY KEY (userId, productId)
}

// SystemConfig (singleton)
SystemConfig {
  id: serial (always 1)
  embeddingsProvider: "local" | "huggingface" | "openai"
  imageGenerationProvider: "off" | "stable-diffusion" | "dalle"
  enableSpellCorrection: boolean
  enableOutfitAI: boolean
  enableImageSearch: boolean
  enableMultilingual: boolean
  synonyms: jsonb { [key: string]: string }
  providerKeys: jsonb { huggingface?: string, openai?: string }
  smtpConfig: jsonb { host?: string, port?: number, user?: string, pass?: string }
  updatedAt: timestamp
}

// Metric (API performance tracking)
Metric {
  id: varchar (UUID)
  requestId: varchar (UUID)
  route: string (e.g., "/api/products")
  method: string (e.g., "GET")
  statusCode: integer
  durationMs: integer
  userId: varchar?
  userRole: string?
  userAgent: string?
  createdAt: timestamp
}

// IndexingJob (background embedding generation)
IndexingJob {
  id: varchar (UUID)
  status: "running" | "completed" | "failed"
  productsTotal: integer
  productsProcessed: integer
  failures: integer
  startedAt: timestamp
  completedAt: timestamp?
}
```

## 🔐 Authentication & Authorization

### JWT Flow
1. **Login/Register** → Returns `accessToken` (15min) + `refreshToken` (7d)
2. **Access Protected Routes** → `Authorization: Bearer <accessToken>`
3. **Token Expired** → POST `/api/auth/refresh` with `refreshToken`
4. **Middleware**: `authMiddleware` + `requireRole(...roles)`

### Role Hierarchy
- **user**: Basic access (browse, search, favorites, outfits)
- **merchant**: User + product CRUD, analytics, CSV import
- **admin**: Merchant + user/merchant management, brand CRUD, metrics
- **owner**: Admin + system config, SMTP, spell correction, indexing

### Implementation
```typescript
// server/middleware/auth.ts
export function authMiddleware(req, res, next) {
  const token = extractTokenFromHeader(req.headers.authorization);
  const payload = verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: "Invalid token" });
  req.user = payload; // { userId, email, role }
  next();
}

export function requireRole(...allowedRoles: string[]) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

// Usage in routes
app.post("/api/products", authMiddleware, requireRole("merchant", "admin", "owner"), async (req, res) => {
  // Only merchants+ can create products
});
```

## 🔍 Search Implementation

### Text Search (Hybrid)
```typescript
// Combines BM25 full-text + semantic vector similarity
POST /api/search/text
{
  "q": "black hoodie",
  "filters": {
    "sizes": ["M", "L"],
    "colors": ["Black"],
    "priceMin": 500,
    "priceMax": 1500,
    "cities": ["Cairo"],
    "brands": ["Cairo Streetwear"]
  }
}

// Current implementation uses simple LIKE search
// Production: Use ts_vector + pgvector <-> operator
SELECT * FROM products
WHERE 
  to_tsvector('english', title || ' ' || description) @@ plainto_tsquery('black hoodie')
  AND vectors->>'textEmbedding' <-> $embedding < 0.3
ORDER BY ts_rank(...) + (1 - cosine_distance) DESC
LIMIT 20;
```

### Image Search
```typescript
// Upload image → Generate CLIP embedding → Find similar products
POST /api/search/image
Content-Type: multipart/form-data
file: <image>

// Server-side
const embedding = await aiProvider.generateImageEmbedding(req.file.buffer);
const results = await db.query(`
  SELECT *, vectors->>'imageEmbedding' <-> $1 AS distance
  FROM products
  WHERE vectors->>'imageEmbedding' IS NOT NULL
  ORDER BY distance ASC
  LIMIT 10
`, [JSON.stringify(embedding)]);
```

### Spell Correction
```typescript
// server/lib/ai-providers.ts
class SimpleSpellCorrector {
  private synonyms = {
    "هودي": "hoodie",  // Arabic → English
    "hodie": "hoodie",  // Typo → Correct
  };

  suggest(query: string, language: "en" | "ar"): string[] {
    // Returns up to 3 suggestions
  }
}

// Extensible via admin dashboard
PATCH /api/admin/config
{ "synonyms": { "جينز": "jeans" } }
```

## 🎨 Frontend Architecture

### Component Structure
```
components/ui/
├── glass-card.tsx         # GlassCard with variants (default, hover, glow)
├── glow-button.tsx        # GlowButton with color prop
├── search-bar.tsx         # Bilingual search with text/image toggle
├── product-tile.tsx       # Product card with hover animations
├── brand-badge.tsx        # Brand chip with glassmorphism
├── empty-state.tsx        # Graceful empty states
└── ...                    # 40+ shadcn components

pages/
├── Home.tsx               # Hero, trending brands, featured products, categories
├── Search.tsx             # Search results with filters sidebar
├── ProductPage.tsx        # Product details, related items, add to outfit
├── OutfitBuilder.tsx      # Drag-drop outfit canvas, AI suggestions
├── Profile.tsx            # User dashboard (orders, outfits, settings)
├── MerchantDashboard.tsx  # Product CRUD, CSV import, analytics
└── AdminDashboard.tsx     # User/merchant mgmt, system config, metrics
```

### State Management
**TanStack Query v5** for all server state:
```typescript
// Queries (GET)
const { data: products, isLoading } = useQuery({
  queryKey: ["/api/products"],
  // Default fetcher configured in queryClient
});

// Mutations (POST/PATCH/DELETE)
const createProduct = useMutation({
  mutationFn: (data) => apiRequest("/api/products", { method: "POST", body: data }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
  },
});
```

### Routing (wouter)
```typescript
// client/src/App.tsx
<Switch>
  <Route path="/" component={Home} />
  <Route path="/search" component={Search} />
  <Route path="/product/:id" component={ProductPage} />
  <Route path="/outfit-builder" component={OutfitBuilder} />
  <Route path="/profile" component={Profile} />
  <Route path="/merchant" component={MerchantDashboard} />
  <Route path="/admin" component={AdminDashboard} />
  <Route component={NotFound} />
</Switch>

// Navigation
const [, setLocation] = useLocation();
setLocation("/product/123");
```

### Internationalization
```typescript
// client/src/contexts/LanguageContext.tsx
const { t, language, setLanguage } = useLanguage();

// Translations in client/src/lib/i18n.ts
const translations = {
  en: {
    welcome: "Welcome to Outfred",
    searchPlaceholder: "Search for fashion...",
  },
  ar: {
    welcome: "مرحبا بك في أوتفريد",
    searchPlaceholder: "ابحث عن الأزياء...",
  },
};

// Usage
<div dir={language === "ar" ? "rtl" : "ltr"}>
  <h1>{t("welcome")}</h1>
</div>
```

## 🎨 Design System

### Color Palette (Tailwind Config)
```typescript
// tailwind.config.ts
colors: {
  brand: {
    burgundy: "#411129",
    rose: "#b47f8e",
    charcoal: "#cfd0d2",
  },
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  // ... shadcn semantic tokens
}
```

### Glass Components
```typescript
<GlassCard variant="default">  {/* Subtle blur */}
<GlassCard variant="hover">    {/* Elevates on hover */}
<GlassCard variant="glow">     {/* Burgundy glow effect */}

<GlowButton color="burgundy">  {/* Primary action */}
<GlowButton color="rose">      {/* Secondary action */}
<GlowButton color="charcoal">  {/* Neutral action */}
```

### Typography
- **Arabic**: Cairo font (weights: 400, 600, 700)
- **English**: Inter font (weights: 400, 500, 600, 700)
- **Loaded via**: `@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');`

## 🔧 Development Workflows

### Adding a New Feature
1. **Define Schema** (`shared/schema.ts`):
   ```typescript
   export const newTable = pgTable("new_table", {
     id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
     // ... fields
   });
   export type NewTable = typeof newTable.$inferSelect;
   export const insertNewTableSchema = createInsertSchema(newTable);
   ```

2. **Push to DB**: `npm run db:push`

3. **Update Storage** (`server/storage.ts`):
   ```typescript
   export interface IStorage {
     getNewTable(id: string): Promise<NewTable | undefined>;
     createNewTable(data: InsertNewTable): Promise<NewTable>;
   }
   ```

4. **Add Routes** (`server/routes.ts`):
   ```typescript
   app.get("/api/new-table", async (req, res) => {
     const items = await storage.listNewTable();
     res.json(items);
   });
   ```

5. **Build Frontend**:
   - Create component in `client/src/components/`
   - Add page in `client/src/pages/`
   - Use TanStack Query for data fetching

### CSV Import Format
Merchants can upload CSV files with these columns:
```csv
title,description,price,images,colors,sizes,tags
Product Name,Product description,999,https://img.jpg,Black;White,S;M;L,tag1;tag2
```

### Running Seed Data
```bash
npm run db:seed
```

This creates:
- 1 owner user
- 3 demo users (2 merchants, 1 regular user)
- 5 brands (Cairo Streetwear, Alexandria Fashion, etc.)
- 60+ products with bilingual titles
- System config with local AI provider

## 📊 Performance Monitoring

### Metrics Collection
Every API request is tracked:
```typescript
// server/lib/metrics.ts
export async function recordMetric(data: {
  route: string,
  method: string,
  statusCode: number,
  durationMs: number,
  userId?: string,
}) {
  await storage.createMetric(data);
}

// Applied via middleware
app.use(metricsMiddleware());
```

### Viewing Analytics
```bash
GET /api/admin/metrics?limit=1000

Response:
{
  "metrics": [...],
  "summary": [
    { "route": "/api/products", "count": 543, "p95": 87, "p99": 132 }
  ]
}
```

**Target**: p95 < 250ms, p99 < 500ms

## 🧪 Testing Strategy

### Unit Tests
- Zod schema validation
- Auth helper functions (JWT, bcrypt)
- Spell correction logic

### Integration Tests
- API endpoint contracts
- Database CRUD operations
- File upload (CSV, images)

### E2E Tests (Playwright)
- User registration → merchant creation → product CRUD
- Search flow (text, image, filters)
- Outfit builder drag-drop
- Admin dashboard operations

### Manual Testing Checklist
- [ ] RTL/LTR toggle works on all pages
- [ ] Search returns relevant results
- [ ] Image upload (CSV import, image search)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Loading states and error handling
- [ ] Role-based access control

## 🚢 Deployment

### Environment Variables
```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/outfred
JWT_SECRET=your-secret-key
REFRESH_SECRET=your-refresh-secret

# Optional (AI Providers)
HUGGINGFACE_API_KEY=hf_xxxxx
OPENAI_API_KEY=sk-xxxxx

# Production
NODE_ENV=production
PORT=3000
```

### Build & Start
```bash
npm run build
npm start
```

### Database Migration
```bash
# Development
npm run db:push

# Production (use migrations)
npx drizzle-kit generate:pg
npx drizzle-kit push:pg
```

## 🐛 Common Issues

### "useNavigate is not exported"
**Solution**: wouter uses `useLocation` for navigation:
```typescript
const [, setLocation] = useLocation();
setLocation("/path");
```

### CORS errors
**Solution**: Vite dev server already proxies API requests. In production, ensure Express serves frontend:
```typescript
app.use(express.static("dist/public"));
```

### pgvector not found
**Solution**: Install extension in PostgreSQL:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Embeddings slow
**Solution**: 
1. Use `local` provider for development
2. Batch index products: `POST /api/admin/index/rebuild`
3. Cache embeddings in `products.vectors` column

## 📚 Further Reading

- **Drizzle ORM**: https://orm.drizzle.team/docs/overview
- **pgvector**: https://github.com/pgvector/pgvector
- **TanStack Query**: https://tanstack.com/query/latest
- **shadcn/ui**: https://ui.shadcn.com
- **Wouter**: https://github.com/molefrog/wouter

---

**Questions?** Check existing code patterns in `server/routes.ts` and `client/src/pages/` for reference implementations.
