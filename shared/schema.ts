import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  integer, 
  boolean, 
  timestamp, 
  jsonb, 
  pgEnum,
  index
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["user", "merchant", "admin", "owner"]);
export const merchantStatusEnum = pgEnum("merchant_status", ["active", "banned", "pending"]);
export const fitEnum = pgEnum("fit", ["slim", "regular", "relaxed", "oversized"]);
export const genderEnum = pgEnum("gender", ["male", "female", "unisex"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("user"),
  passwordHash: text("password_hash").notNull(),
  language: text("language").notNull().default("en"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Merchants table
export const merchants = pgTable("merchants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerUserId: varchar("owner_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  city: text("city").notNull(),
  socials: jsonb("socials").$type<{ instagram?: string; facebook?: string; website?: string }>(),
  status: merchantStatusEnum("status").notNull().default("pending"),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  policies: text("policies"),
  contact: text("contact"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Brands table (bilingual support)
export const brands = pgTable("brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar"),
  websiteUrl: text("website_url"),
  logoUrl: text("logo_url"),
  coverUrl: text("cover_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Products table with pgvector support
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  brandId: varchar("brand_id").references(() => brands.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").notNull().default("EGP"),
  colors: text("colors").array(),
  sizes: text("sizes").array(),
  fit: fitEnum("fit"),
  gender: genderEnum("gender"),
  tags: text("tags").array(),
  images: text("images").array().notNull(),
  vectors: jsonb("vectors").$type<{
    textEmbedding?: number[];
    imageEmbeddings?: number[][];
  }>(),
  published: boolean("published").notNull().default(true),
  views: integer("views").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  lastIndexedAt: timestamp("last_indexed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  merchantIdx: index("products_merchant_idx").on(table.merchantId),
  brandIdx: index("products_brand_idx").on(table.brandId),
  publishedIdx: index("products_published_idx").on(table.published),
}));

// Outfits table
export const outfits = pgTable("outfits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productIds: text("product_ids").array().notNull(),
  title: text("title").notNull(),
  notes: text("notes"),
  coverImage: text("cover_image"),
  userHeight: integer("user_height"),
  userWeight: integer("user_weight"),
  aiPrompt: text("ai_prompt"),
  shoeRecommendation: jsonb("shoe_recommendation").$type<{
    brand: string;
    model: string;
    imageUrl?: string;
    link?: string;
  }>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Favorites table
export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userProductIdx: index("favorites_user_product_idx").on(table.userId, table.productId),
}));

// SystemConfig table (single row)
export const systemConfig = pgTable("system_config", {
  id: varchar("id").primaryKey().default("singleton"),
  embeddingsProvider: text("embeddings_provider").notNull().default("local"),
  imageGenerationProvider: text("image_generation_provider").notNull().default("off"),
  similarityDimension: integer("similarity_dimension").notNull().default(384),
  similarityMetric: text("similarity_metric").notNull().default("cosine"),
  similarityTopK: integer("similarity_top_k").notNull().default(20),
  enableRerank: boolean("enable_rerank").notNull().default(false),
  enableSpellCorrection: boolean("enable_spell_correction").notNull().default(true),
  enableOutfitAI: boolean("enable_outfit_ai").notNull().default(true),
  enableImageSearch: boolean("enable_image_search").notNull().default(true),
  enableMultilingual: boolean("enable_multilingual").notNull().default(true),
  enableAnalyticsStream: boolean("enable_analytics_stream").notNull().default(false),
  smtpConfig: jsonb("smtp_config").$type<{
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
  }>(),
  providerKeys: jsonb("provider_keys").$type<{
    huggingface?: string;
    openai?: string;
    gemini?: string;
  }>(),
  synonyms: jsonb("synonyms").$type<Record<string, string>>().default({}),
  logoUrl: text("logo_url"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Metrics table
export const metrics = pgTable("metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: text("request_id").notNull(),
  route: text("route").notNull(),
  method: text("method").notNull(),
  statusCode: integer("status_code").notNull(),
  durationMs: integer("duration_ms").notNull(),
  userId: varchar("user_id"),
  userRole: text("user_role"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  routeIdx: index("metrics_route_idx").on(table.route),
  createdAtIdx: index("metrics_created_at_idx").on(table.createdAt),
}));

// IndexingJobs table
export const indexingJobs = pgTable("indexing_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  status: text("status").notNull().default("running"),
  productsProcessed: integer("products_processed").notNull().default(0),
  productsTotal: integer("products_total").notNull().default(0),
  failures: integer("failures").notNull().default(0),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// CMS: Navigation Links table
export const navLinks = pgTable("nav_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  labelEn: text("label_en").notNull(),
  labelAr: text("label_ar").notNull(),
  path: text("path").notNull(),
  order: integer("order").notNull().default(0),
  isExternal: boolean("is_external").notNull().default(false),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  orderIdx: index("nav_links_order_idx").on(table.order),
}));

// CMS: Footer Config table (singleton)
export const footerConfig = pgTable("footer_config", {
  id: varchar("id").primaryKey().default("singleton"),
  copyrightText: text("copyright_text").notNull().default("© 2025 Outfred. All rights reserved."),
  socialLinks: jsonb("social_links").$type<{
    instagram?: string;
    facebook?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    linkedin?: string;
  }>(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// CMS: Static Pages table
export const staticPages = pgTable("static_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  metaDescription: text("meta_description"),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Global Shoe Brands (for outfit builder)
export const globalShoeBrands = pgTable("global_shoe_brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  logoUrl: text("logo_url"),
  popularModels: text("popular_models").array(),
  websiteUrl: text("website_url"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  merchants: many(merchants),
  outfits: many(outfits),
  favorites: many(favorites),
}));

export const merchantsRelations = relations(merchants, ({ one, many }) => ({
  owner: one(users, {
    fields: [merchants.ownerUserId],
    references: [users.id],
  }),
  products: many(products),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [products.merchantId],
    references: [merchants.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  favorites: many(favorites),
}));

export const outfitsRelations = relations(outfits, ({ one }) => ({
  user: one(users, {
    fields: [outfits.userId],
    references: [users.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [favorites.productId],
    references: [products.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  password: z.string().min(8),
});

export const insertMerchantSchema = createInsertSchema(merchants).omit({
  id: true,
  createdAt: true,
});

export const insertBrandSchema = createInsertSchema(brands).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
  clicks: true,
  lastIndexedAt: true,
});

export const insertOutfitSchema = createInsertSchema(outfits).omit({
  id: true,
  createdAt: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
  updatedAt: true,
});

export const insertMetricSchema = createInsertSchema(metrics).omit({
  id: true,
  createdAt: true,
});

export const insertNavLinkSchema = createInsertSchema(navLinks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFooterConfigSchema = createInsertSchema(footerConfig).omit({
  id: true,
  updatedAt: true,
});

export const insertStaticPageSchema = createInsertSchema(staticPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGlobalShoeBrandSchema = createInsertSchema(globalShoeBrands).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Merchant = typeof merchants.$inferSelect;
export type InsertMerchant = z.infer<typeof insertMerchantSchema>;

export type Brand = typeof brands.$inferSelect;
export type InsertBrand = z.infer<typeof insertBrandSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Outfit = typeof outfits.$inferSelect;
export type InsertOutfit = z.infer<typeof insertOutfitSchema>;

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;

export type Metric = typeof metrics.$inferSelect;
export type InsertMetric = z.infer<typeof insertMetricSchema>;

export type IndexingJob = typeof indexingJobs.$inferSelect;

export type NavLink = typeof navLinks.$inferSelect;
export type InsertNavLink = z.infer<typeof insertNavLinkSchema>;

export type FooterConfig = typeof footerConfig.$inferSelect;
export type InsertFooterConfig = z.infer<typeof insertFooterConfigSchema>;

export type StaticPage = typeof staticPages.$inferSelect;
export type InsertStaticPage = z.infer<typeof insertStaticPageSchema>;

export type GlobalShoeBrand = typeof globalShoeBrands.$inferSelect;
export type InsertGlobalShoeBrand = z.infer<typeof insertGlobalShoeBrandSchema>;

// ProductSummary for enriched product data with brand name and normalized price
export const productSummarySchema = z.object({
  id: z.string(),
  merchantId: z.string(),
  brandId: z.string().nullable(),
  brandName: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  currency: z.string(),
  colors: z.array(z.string()).nullable(),
  sizes: z.array(z.string()).nullable(),
  fit: z.string().nullable(),
  gender: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  images: z.array(z.string()),
  published: z.boolean(),
  views: z.number(),
  clicks: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProductSummary = z.infer<typeof productSummarySchema>;
