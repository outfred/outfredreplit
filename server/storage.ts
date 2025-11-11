import {
  users,
  merchants,
  brands,
  products,
  outfits,
  favorites,
  systemConfig,
  metrics,
  indexingJobs,
  navLinks,
  footerConfig,
  staticPages,
  type User,
  type InsertUser,
  type Merchant,
  type InsertMerchant,
  type Brand,
  type InsertBrand,
  type Product,
  type InsertProduct,
  type ProductSummary,
  type Outfit,
  type InsertOutfit,
  type Favorite,
  type InsertFavorite,
  type SystemConfig,
  type InsertSystemConfig,
  type Metric,
  type InsertMetric,
  type IndexingJob,
  type NavLink,
  type InsertNavLink,
  type FooterConfig,
  type StaticPage,
  type InsertStaticPage,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, like, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { passwordHash: string }): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  listUsers(): Promise<User[]>;

  // Merchants
  getMerchant(id: string): Promise<Merchant | undefined>;
  getMerchantByOwner(userId: string): Promise<Merchant | undefined>;
  createMerchant(merchant: InsertMerchant): Promise<Merchant>;
  updateMerchant(id: string, updates: Partial<Merchant>): Promise<Merchant>;
  deleteMerchant(id: string): Promise<void>;
  listMerchants(): Promise<Merchant[]>;

  // Brands
  getBrand(id: string): Promise<Brand | undefined>;
  getBrandByName(name: string): Promise<Brand | undefined>;
  createBrand(brand: InsertBrand): Promise<Brand>;
  updateBrand(id: string, updates: Partial<Brand>): Promise<Brand>;
  deleteBrand(id: string): Promise<void>;
  listBrands(): Promise<Brand[]>;

  // Products
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  bulkCreateProducts(products: InsertProduct[]): Promise<Product[]>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  listProducts(filters?: {
    merchantId?: string;
    brandId?: string;
    published?: boolean;
    search?: string;
  }): Promise<Product[]>;
  listProductSummaries(filters?: {
    merchantId?: string;
    brandId?: string;
    published?: boolean;
    search?: string;
  }): Promise<ProductSummary[]>;
  getProductsNeedingIndexing(): Promise<Product[]>;

  // Outfits
  getOutfit(id: string): Promise<Outfit | undefined>;
  createOutfit(outfit: InsertOutfit): Promise<Outfit>;
  updateOutfit(id: string, updates: Partial<Outfit>): Promise<Outfit>;
  deleteOutfit(id: string): Promise<void>;
  listOutfitsByUser(userId: string): Promise<Outfit[]>;

  // Favorites
  getFavorite(userId: string, productId: string): Promise<Favorite | undefined>;
  createFavorite(favorite: InsertFavorite): Promise<Favorite>;
  deleteFavorite(userId: string, productId: string): Promise<void>;
  listFavoritesByUser(userId: string): Promise<Favorite[]>;

  // System Config
  getSystemConfig(): Promise<SystemConfig | undefined>;
  updateSystemConfig(updates: Partial<SystemConfig>): Promise<SystemConfig>;

  // Metrics
  createMetric(metric: InsertMetric): Promise<Metric>;
  getMetrics(limit?: number): Promise<Metric[]>;

  // Indexing Jobs
  createIndexingJob(job: Partial<IndexingJob>): Promise<IndexingJob>;
  updateIndexingJob(id: string, updates: Partial<IndexingJob>): Promise<IndexingJob>;
  getLatestIndexingJob(): Promise<IndexingJob | undefined>;

  // Navigation Links
  listNavLinks(): Promise<NavLink[]>;
  listNavLinksAdmin(): Promise<NavLink[]>;
  createNavLink(link: InsertNavLink): Promise<NavLink>;
  updateNavLink(id: string, updates: Partial<NavLink>): Promise<NavLink>;
  deleteNavLink(id: string): Promise<void>;
  reorderNavLinks(updates: { id: string; order: number }[]): Promise<void>;

  // Footer Config
  getFooterConfig(): Promise<FooterConfig | undefined>;
  updateFooterConfig(updates: Partial<FooterConfig>): Promise<FooterConfig>;

  // Static Pages
  getStaticPage(slug: string): Promise<StaticPage | undefined>;
  listStaticPages(publishedOnly?: boolean): Promise<StaticPage[]>;
  createStaticPage(page: InsertStaticPage): Promise<StaticPage>;
  updateStaticPage(id: string, updates: Partial<StaticPage>): Promise<StaticPage>;
  deleteStaticPage(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser & { passwordHash: string }): Promise<User> {
    const [created] = await db
      .insert(users)
      .values(user)
      .returning();
    return created;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    // Prevent ID and email changes
    const { id: _, email: __, ...safeUpdates } = updates as any;
    const [updated] = await db
      .update(users)
      .set(safeUpdates)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Merchants
  async getMerchant(id: string): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.id, id));
    return merchant || undefined;
  }

  async getMerchantByOwner(userId: string): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.ownerUserId, userId));
    return merchant || undefined;
  }

  async createMerchant(merchant: InsertMerchant): Promise<Merchant> {
    const [created] = await db
      .insert(merchants)
      .values([merchant as any])
      .returning();
    return created;
  }

  async updateMerchant(id: string, updates: Partial<Merchant>): Promise<Merchant> {
    // Prevent ID changes
    const { id: _, ...safeUpdates } = updates as any;
    const [updated] = await db
      .update(merchants)
      .set(safeUpdates)
      .where(eq(merchants.id, id))
      .returning();
    return updated;
  }

  async deleteMerchant(id: string): Promise<void> {
    await db.delete(merchants).where(eq(merchants.id, id));
  }

  async listMerchants(): Promise<Merchant[]> {
    return await db.select().from(merchants).orderBy(desc(merchants.createdAt));
  }

  // Brands
  async getBrand(id: string): Promise<Brand | undefined> {
    const [brand] = await db.select().from(brands).where(eq(brands.id, id));
    return brand || undefined;
  }

  async getBrandByName(name: string): Promise<Brand | undefined> {
    const [brand] = await db.select().from(brands).where(eq(brands.nameEn, name));
    return brand || undefined;
  }

  async createBrand(brand: InsertBrand): Promise<Brand> {
    const [created] = await db
      .insert(brands)
      .values([brand as any])
      .returning();
    return created;
  }

  async updateBrand(id: string, updates: Partial<Brand>): Promise<Brand> {
    // Prevent ID changes
    const { id: _, ...safeUpdates } = updates as any;
    const [updated] = await db
      .update(brands)
      .set(safeUpdates)
      .where(eq(brands.id, id))
      .returning();
    return updated;
  }

  async deleteBrand(id: string): Promise<void> {
    await db.delete(brands).where(eq(brands.id, id));
  }

  async listBrands(): Promise<Brand[]> {
    return await db.select().from(brands).orderBy(asc(brands.nameEn));
  }

  // Products
  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db
      .insert(products)
      .values([product as any])
      .returning();
    return created;
  }

  async bulkCreateProducts(productsToCreate: InsertProduct[]): Promise<Product[]> {
    if (productsToCreate.length === 0) return [];
    
    const created = await db
      .insert(products)
      .values(productsToCreate as any)
      .returning();
    return created;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    // Prevent ID changes and ensure updatedAt is set
    const { id: _, ...safeUpdates } = updates as any;
    const [updated] = await db
      .update(products)
      .set({ ...safeUpdates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async listProducts(filters?: {
    merchantId?: string;
    brandId?: string;
    published?: boolean;
    search?: string;
  }): Promise<Product[]> {
    let query = db.select().from(products);

    const conditions = [];
    if (filters?.merchantId) {
      conditions.push(eq(products.merchantId, filters.merchantId));
    }
    if (filters?.brandId) {
      conditions.push(eq(products.brandId, filters.brandId));
    }
    if (filters?.published !== undefined) {
      conditions.push(eq(products.published, filters.published));
    }
    if (filters?.search) {
      conditions.push(sql`${products.title} ILIKE ${'%' + filters.search + '%'}`);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(products.createdAt));
  }

  async listProductSummaries(filters?: {
    merchantId?: string;
    brandId?: string;
    published?: boolean;
    search?: string;
  }): Promise<ProductSummary[]> {
    const conditions = [];
    if (filters?.merchantId) {
      conditions.push(eq(products.merchantId, filters.merchantId));
    }
    if (filters?.brandId) {
      conditions.push(eq(products.brandId, filters.brandId));
    }
    if (filters?.published !== undefined) {
      conditions.push(eq(products.published, filters.published));
    }
    if (filters?.search) {
      conditions.push(sql`${products.title} ILIKE ${'%' + filters.search + '%'}`);
    }

    const rows = await db
      .select({
        product: products,
        brand: brands,
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(products.createdAt));

    return rows.map(({ product, brand }) => ({
      id: product.id,
      merchantId: product.merchantId,
      brandId: product.brandId,
      brandName: brand?.name || null,
      title: product.title,
      description: product.description,
      price: product.priceCents / 100,
      currency: product.currency,
      colors: product.colors,
      sizes: product.sizes,
      fit: product.fit,
      gender: product.gender,
      tags: product.tags,
      images: product.images,
      published: product.published,
      views: product.views,
      clicks: product.clicks,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    }));
  }

  async getProductsNeedingIndexing(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        or(
          sql`${products.lastIndexedAt} IS NULL`,
          sql`${products.updatedAt} > ${products.lastIndexedAt}`
        )
      )
      .limit(100);
  }

  // Outfits
  async getOutfit(id: string): Promise<Outfit | undefined> {
    const [outfit] = await db.select().from(outfits).where(eq(outfits.id, id));
    return outfit || undefined;
  }

  async createOutfit(outfit: InsertOutfit): Promise<Outfit> {
    const [created] = await db
      .insert(outfits)
      .values([outfit as any])
      .returning();
    return created;
  }

  async updateOutfit(id: string, updates: Partial<Outfit>): Promise<Outfit> {
    // Prevent ID and userId changes
    const { id: _, userId: __, ...safeUpdates } = updates as any;
    const [updated] = await db
      .update(outfits)
      .set(safeUpdates)
      .where(eq(outfits.id, id))
      .returning();
    return updated;
  }

  async deleteOutfit(id: string): Promise<void> {
    await db.delete(outfits).where(eq(outfits.id, id));
  }

  async listOutfitsByUser(userId: string): Promise<Outfit[]> {
    return await db
      .select()
      .from(outfits)
      .where(eq(outfits.userId, userId))
      .orderBy(desc(outfits.createdAt));
  }

  // Favorites
  async getFavorite(userId: string, productId: string): Promise<Favorite | undefined> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.productId, productId)));
    return favorite || undefined;
  }

  async createFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const [created] = await db
      .insert(favorites)
      .values(favorite)
      .returning();
    return created;
  }

  async deleteFavorite(userId: string, productId: string): Promise<void> {
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.productId, productId)));
  }

  async listFavoritesByUser(userId: string): Promise<Favorite[]> {
    return await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));
  }

  // System Config
  async getSystemConfig(): Promise<SystemConfig | undefined> {
    const [config] = await db.select().from(systemConfig);
    return config || undefined;
  }

  async updateSystemConfig(updates: Partial<SystemConfig>): Promise<SystemConfig> {
    const existing = await this.getSystemConfig();
    if (existing) {
      const [updated] = await db
        .update(systemConfig)
        .set({ ...updates, updatedAt: new Date() })
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(systemConfig)
        .values({ ...updates, updatedAt: new Date() } as any)
        .returning();
      return created;
    }
  }

  // Metrics
  async createMetric(metric: InsertMetric): Promise<Metric> {
    const [created] = await db
      .insert(metrics)
      .values(metric)
      .returning();
    return created;
  }

  async getMetrics(limit: number = 1000): Promise<Metric[]> {
    return await db
      .select()
      .from(metrics)
      .orderBy(desc(metrics.createdAt))
      .limit(limit);
  }

  // Indexing Jobs
  async createIndexingJob(job: Partial<IndexingJob>): Promise<IndexingJob> {
    const [created] = await db
      .insert(indexingJobs)
      .values(job as any)
      .returning();
    return created;
  }

  async updateIndexingJob(id: string, updates: Partial<IndexingJob>): Promise<IndexingJob> {
    const [updated] = await db
      .update(indexingJobs)
      .set(updates)
      .where(eq(indexingJobs.id, id))
      .returning();
    return updated;
  }

  async getLatestIndexingJob(): Promise<IndexingJob | undefined> {
    const [job] = await db
      .select()
      .from(indexingJobs)
      .orderBy(desc(indexingJobs.startedAt))
      .limit(1);
    return job || undefined;
  }

  // Navigation Links
  async listNavLinks(): Promise<NavLink[]> {
    return await db
      .select()
      .from(navLinks)
      .where(eq(navLinks.isEnabled, true))
      .orderBy(asc(navLinks.order));
  }

  async listNavLinksAdmin(): Promise<NavLink[]> {
    return await db
      .select()
      .from(navLinks)
      .orderBy(asc(navLinks.order));
  }

  async createNavLink(link: InsertNavLink): Promise<NavLink> {
    const [created] = await db
      .insert(navLinks)
      .values(link)
      .returning();
    return created;
  }

  async updateNavLink(id: string, updates: Partial<NavLink>): Promise<NavLink> {
    const [updated] = await db
      .update(navLinks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(navLinks.id, id))
      .returning();
    return updated;
  }

  async deleteNavLink(id: string): Promise<void> {
    await db.delete(navLinks).where(eq(navLinks.id, id));
  }

  async reorderNavLinks(updates: { id: string; order: number }[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (const { id, order } of updates) {
        await tx
          .update(navLinks)
          .set({ order, updatedAt: new Date() })
          .where(eq(navLinks.id, id));
      }
    });
  }

  // Footer Config
  async getFooterConfig(): Promise<FooterConfig | undefined> {
    const [config] = await db.select().from(footerConfig).where(eq(footerConfig.id, "singleton"));
    return config || undefined;
  }

  async updateFooterConfig(updates: Partial<FooterConfig>): Promise<FooterConfig> {
    const existing = await this.getFooterConfig();
    if (existing) {
      const [updated] = await db
        .update(footerConfig)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(footerConfig.id, "singleton"))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(footerConfig)
        .values({ id: "singleton", ...updates })
        .returning();
      return created;
    }
  }

  // Static Pages
  async getStaticPage(slug: string): Promise<StaticPage | undefined> {
    const [page] = await db.select().from(staticPages).where(eq(staticPages.slug, slug));
    return page || undefined;
  }

  async listStaticPages(publishedOnly = false): Promise<StaticPage[]> {
    if (publishedOnly) {
      return await db.select().from(staticPages)
        .where(eq(staticPages.isPublished, true))
        .orderBy(asc(staticPages.slug));
    }
    return await db.select().from(staticPages).orderBy(asc(staticPages.slug));
  }

  async createStaticPage(page: InsertStaticPage): Promise<StaticPage> {
    const [created] = await db
      .insert(staticPages)
      .values([page])
      .returning();
    return created;
  }

  async updateStaticPage(id: string, updates: Partial<StaticPage>): Promise<StaticPage> {
    const { id: _, ...safeUpdates } = updates as any;
    const [updated] = await db
      .update(staticPages)
      .set({ ...safeUpdates, updatedAt: new Date() })
      .where(eq(staticPages.id, id))
      .returning();
    return updated;
  }

  async deleteStaticPage(id: string): Promise<void> {
    await db.delete(staticPages).where(eq(staticPages.id, id));
  }
}

export const storage = new DatabaseStorage();
