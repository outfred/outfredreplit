import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import multer from "multer";
import { storage } from "./storage";
import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken, verifyRefreshToken } from "./lib/auth";
import { authMiddleware, requireRole, type AuthRequest } from "./middleware/auth";
import { createEmbeddingProvider, spellCorrector } from "./lib/ai-providers";
import { metricsMiddleware } from "./lib/metrics";
import { z } from "zod";
import { insertUserSchema, insertMerchantSchema, insertBrandSchema, insertProductSchema, insertOutfitSchema, insertNavLinkSchema, insertStaticPageSchema } from "@shared/schema";
import path from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

// Initialize upload directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");
try {
  mkdirSync(uploadsDir, { recursive: true });
} catch (err) {
  // Directory already exists
}

// Configure multer for disk storage
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: multerStorage });

// Separate instance for image search (needs buffer)
const uploadMemory = multer({ storage: multer.memoryStorage() });

// Track if routes have been registered to prevent duplicates
let routesRegistered = false;

export async function registerRoutes(app: Express): Promise<Server> {
  // Only register static middleware and routes once (prevent hot reload duplicates)
  if (routesRegistered) {
    return createServer(app);
  }
  
  routesRegistered = true;
  
  // Serve uploaded files statically
  app.use("/uploads", express.static(uploadsDir));
  
  // Apply metrics middleware
  app.use(metricsMiddleware());

  // ===== AUTH ROUTES =====
  
  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, name, password } = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({ email, name, passwordHash, role: "user" });

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken,
        refreshToken,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid input" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = z.object({
        email: z.string().email(),
        password: z.string(),
      }).parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken,
        refreshToken,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid input" });
    }
  });

  // Refresh
  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
      
      const payload = verifyRefreshToken(refreshToken);
      if (!payload) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      const user = await storage.getUser(payload.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);
      
      res.json({ 
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid input" });
    }
  });

  // Logout (client-side mainly, but can track here)
  app.post("/api/auth/logout", authMiddleware, (req, res) => {
    res.json({ success: true });
  });

  // Get current user
  app.get("/api/auth/me", authMiddleware, async (req: AuthRequest, res) => {
    const user = await storage.getUser(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  });

  // ===== PRODUCTS ROUTES =====
  
  // List products (returns canonical Product objects)
  app.get("/api/products", async (req, res) => {
    try {
      const { merchantId, brandId, published, search } = req.query;
      const products = await storage.listProducts({
        merchantId: merchantId as string,
        brandId: brandId as string,
        published: published === "true" ? true : published === "false" ? false : undefined,
        search: search as string,
      });
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch products" });
    }
  });

  // List product summaries (returns enriched ProductSummary with brandName and normalized price)
  app.get("/api/products/summary", async (req, res) => {
    try {
      const { merchantId, brandId, published, search } = req.query;
      const products = await storage.listProductSummaries({
        merchantId: merchantId as string,
        brandId: brandId as string,
        published: published === "true" ? true : published === "false" ? false : undefined,
        search: search as string,
      });
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch products" });
    }
  });

  // Get product
  app.get("/api/products/:id", async (req, res) => {
    const product = await storage.getProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  });

  // Create product (merchant only)
  app.post("/api/products", authMiddleware, requireRole("merchant", "admin", "owner"), async (req: AuthRequest, res) => {
    try {
      const data = insertProductSchema.parse(req.body);
      
      // For merchants: auto-assign their merchantId (prevent impersonation)
      if (req.user!.role === "merchant") {
        const merchant = await storage.getMerchantByOwner(req.user!.userId);
        if (!merchant) {
          return res.status(400).json({ error: "Merchant profile not found. Create merchant profile first." });
        }
        data.merchantId = merchant.id; // Override any provided merchantId
      }
      
      // For admin/owner: merchantId must be provided and valid
      if (req.user!.role !== "merchant") {
        if (!data.merchantId) {
          return res.status(400).json({ error: "merchantId is required" });
        }
        const merchant = await storage.getMerchant(data.merchantId);
        if (!merchant) {
          return res.status(400).json({ error: "Invalid merchantId" });
        }
      }
      
      const product = await storage.createProduct(data);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid input" });
    }
  });

  // Update product
  app.patch("/api/products/:id", authMiddleware, requireRole("merchant", "admin", "owner"), async (req: AuthRequest, res) => {
    try {
      const existingProduct = await storage.getProduct(req.params.id);
      if (!existingProduct) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Verify ownership for merchants
      if (req.user!.role === "merchant") {
        const merchant = await storage.getMerchantByOwner(req.user!.userId);
        if (!merchant || existingProduct.merchantId !== merchant.id) {
          return res.status(403).json({ error: "Not authorized to modify this product" });
        }
      }

      // Validate and sanitize update data
      const updateSchema = insertProductSchema.partial().omit({ id: true });
      const validatedData = updateSchema.parse(req.body);
      
      // Prevent merchantId changes for merchants (only admin/owner can reassign products)
      if (req.user!.role === "merchant") {
        delete (validatedData as any).merchantId;
      } else {
        // Admin/owner can change merchantId, but it must be valid
        if (validatedData.merchantId && validatedData.merchantId !== existingProduct.merchantId) {
          const targetMerchant = await storage.getMerchant(validatedData.merchantId);
          if (!targetMerchant) {
            return res.status(400).json({ error: "Invalid merchantId" });
          }
        }
      }
      
      const product = await storage.updateProduct(req.params.id, validatedData);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update product" });
    }
  });

  // Delete product
  app.delete("/api/products/:id", authMiddleware, requireRole("merchant", "admin", "owner"), async (req: AuthRequest, res) => {
    try {
      // Verify ownership for merchants
      if (req.user!.role === "merchant") {
        const product = await storage.getProduct(req.params.id);
        if (!product) {
          return res.status(404).json({ error: "Product not found" });
        }
        const merchant = await storage.getMerchantByOwner(req.user!.userId);
        if (!merchant || product.merchantId !== merchant.id) {
          return res.status(403).json({ error: "Not authorized to delete this product" });
        }
      }

      await storage.deleteProduct(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to delete product" });
    }
  });

  // Increment product views
  app.post("/api/products/:id/view", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (product) {
        await storage.updateProduct(req.params.id, { views: product.views + 1 });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to record view" });
    }
  });

  // Increment product clicks
  app.post("/api/products/:id/click", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (product) {
        await storage.updateProduct(req.params.id, { clicks: product.clicks + 1 });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to record click" });
    }
  });

  // ===== SEARCH ROUTES =====
  
  // Text search
  app.post("/api/search/text", async (req, res) => {
    try {
      const { q, filters } = z.object({
        q: z.string(),
        filters: z.object({
          sizes: z.array(z.string()).optional(),
          colors: z.array(z.string()).optional(),
          priceMin: z.number().optional(),
          priceMax: z.number().optional(),
          cities: z.array(z.string()).optional(),
          brands: z.array(z.string()).optional(),
        }).optional(),
      }).parse(req.body);

      // Use listProductSummaries for enriched data (includes brandName and normalized price)
      const productSummaries = await storage.listProductSummaries({ search: q, published: true });
      
      // Apply additional filters
      let filtered = productSummaries;
      if (filters) {
        if (filters.priceMin) {
          filtered = filtered.filter(p => p.price >= filters.priceMin!);
        }
        if (filters.priceMax) {
          filtered = filtered.filter(p => p.price <= filters.priceMax!);
        }
        if (filters.sizes?.length) {
          filtered = filtered.filter(p => p.sizes?.some(s => filters.sizes!.includes(s)));
        }
        if (filters.colors?.length) {
          filtered = filtered.filter(p => p.colors?.some(c => filters.colors!.includes(c)));
        }
      }

      res.json({ results: filtered, count: filtered.length });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Search failed" });
    }
  });

  // Image search
  app.post("/api/search/image", uploadMemory.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image provided" });
      }

      const config = await storage.getSystemConfig();
      if (!config?.enableImageSearch) {
        return res.status(503).json({ error: "Image search is disabled" });
      }

      const provider = createEmbeddingProvider(
        config.embeddingsProvider,
        config.providerKeys?.huggingface || config.providerKeys?.openai
      );

      const imageEmbedding = await provider.generateImageEmbedding(req.file.buffer);
      
      // In production, would use pgvector similarity search
      // For now, return sample results using ProductSummary for consistency
      const productSummaries = await storage.listProductSummaries({ published: true });
      const results = productSummaries.slice(0, 10);

      res.json({ results, count: results.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Image search failed" });
    }
  });

  // Spell correction
  app.post("/api/search/spell", async (req, res) => {
    try {
      const { q, language } = z.object({
        q: z.string(),
        language: z.enum(["en", "ar"]).optional().default("en"),
      }).parse(req.body);

      const suggestions = spellCorrector.suggest(q, language);
      res.json({ suggestions });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Spell check failed" });
    }
  });

  // ===== MERCHANTS ROUTES =====
  
  // List merchants (admin only)
  app.get("/api/admin/merchants", authMiddleware, requireRole("admin", "owner"), async (req: AuthRequest, res) => {
    const merchants = await storage.listMerchants();
    res.json(merchants);
  });

  // Create merchant (admin/owner only)
  app.post("/api/admin/merchants", authMiddleware, requireRole("admin", "owner"), async (req: AuthRequest, res) => {
    try {
      const data = insertMerchantSchema.parse(req.body);
      
      if (!data.ownerUserId) {
        return res.status(400).json({ error: "ownerUserId is required" });
      }
      
      // Verify target user exists
      const targetUser = await storage.getUser(data.ownerUserId);
      if (!targetUser) {
        return res.status(400).json({ error: "Invalid ownerUserId" });
      }
      
      // Check if user already has a merchant profile
      const existing = await storage.getMerchantByOwner(data.ownerUserId);
      if (existing) {
        return res.status(400).json({ error: "User already has a merchant profile" });
      }
      
      const merchant = await storage.createMerchant(data);
      res.status(201).json(merchant);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid input" });
    }
  });

  // User self-upgrade to merchant (limited fields)
  app.post("/api/user/upgrade-to-merchant", authMiddleware, requireRole("user"), async (req: AuthRequest, res) => {
    try {
      // Check if user already has a merchant profile
      const existing = await storage.getMerchantByOwner(req.user!.userId);
      if (existing) {
        return res.status(400).json({ error: "Merchant profile already exists" });
      }
      
      // Validate only safe fields for self-upgrade
      const selfUpgradeSchema = z.object({
        name: z.string().min(1),
        city: z.string().min(1),
        contact: z.string().email(),
      });
      const validatedData = selfUpgradeSchema.parse(req.body);
      
      // Create merchant with safe defaults
      const merchant = await storage.createMerchant({
        ownerUserId: req.user!.userId,
        name: validatedData.name,
        city: validatedData.city,
        contact: validatedData.contact,
        status: "pending", // Always pending for self-upgrade, admin must approve
      });
      
      // Upgrade user role to merchant
      await storage.updateUser(req.user!.userId, { role: "merchant" });
      
      res.status(201).json(merchant);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid input" });
    }
  });

  // Update merchant
  app.patch("/api/admin/merchants/:id", authMiddleware, requireRole("admin", "owner"), async (req: AuthRequest, res) => {
    try {
      const updateSchema = insertMerchantSchema.partial().omit({ id: true, ownerUserId: true });
      const validatedData = updateSchema.parse(req.body);
      const merchant = await storage.updateMerchant(req.params.id, validatedData);
      res.json(merchant);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update merchant" });
    }
  });

  // Delete merchant
  app.delete("/api/admin/merchants/:id", authMiddleware, requireRole("admin", "owner"), async (req: AuthRequest, res) => {
    try {
      await storage.deleteMerchant(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to delete merchant" });
    }
  });

  // CSV Import Products (admin/owner only)
  app.post("/api/admin/products/import-csv", authMiddleware, requireRole("admin", "owner"), upload.single("csv"), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No CSV file provided" });
      }

      const { merchantId } = req.body;
      if (!merchantId) {
        return res.status(400).json({ error: "merchantId is required" });
      }

      // Validate merchant exists
      const merchant = await storage.getMerchant(merchantId);
      if (!merchant) {
        return res.status(404).json({ error: "Merchant not found" });
      }

      // Parse CSV
      const { parse } = await import("csv-parse/sync");
      const records = parse(req.file.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      if (records.length === 0) {
        return res.status(400).json({ error: "CSV file is empty" });
      }

      if (records.length > 1000) {
        return res.status(400).json({ error: "CSV file too large (max 1000 products)" });
      }

      // Validate and transform records
      const validatedProducts: InsertProduct[] = [];
      const failed: Array<{ row: number; error: string }> = [];

      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        try {
          // Map CSV fields to Product schema
          const product: InsertProduct = {
            merchantId,
            titleEn: row.titleEn || row.title_en || "",
            titleAr: row.titleAr || row.title_ar || "",
            price: parseFloat(row.price || "0"),
            brandId: row.brandId || row.brand_id,
            colors: row.colors ? row.colors.split(",").map((c: string) => c.trim()) : [],
            sizes: row.sizes ? row.sizes.split(",").map((s: string) => s.trim()) : [],
            tags: row.tags ? row.tags.split(",").map((t: string) => t.trim()) : [],
            images: row.images ? row.images.split(",").map((i: string) => i.trim()) : [],
            published: row.published === "true" || row.published === "1" || false,
            gender: row.gender || "unisex",
            fit: row.fit || "regular",
          };

          // Validate required fields
          if (!product.titleEn || !product.titleAr) {
            failed.push({ row: i + 1, error: "Missing titleEn or titleAr" });
            continue;
          }

          if (!product.brandId) {
            failed.push({ row: i + 1, error: "Missing brandId" });
            continue;
          }

          if (!product.price || product.price <= 0) {
            failed.push({ row: i + 1, error: "Invalid price" });
            continue;
          }

          // Validate brand exists
          const brand = await storage.getBrand(product.brandId);
          if (!brand) {
            failed.push({ row: i + 1, error: `Brand not found: ${product.brandId}` });
            continue;
          }

          validatedProducts.push(product);
        } catch (err: any) {
          failed.push({ row: i + 1, error: err.message || "Validation failed" });
        }
      }

      // Bulk insert validated products
      const created = await storage.bulkCreateProducts(validatedProducts);

      res.json({
        imported: created.length,
        failed: failed.length,
        count: created.length,
        errors: failed,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to import CSV" });
    }
  });

  // ===== MERCHANT-SPECIFIC ROUTES =====
  
  // Get merchant analytics
  app.get("/api/merchant/analytics", authMiddleware, requireRole("merchant", "admin", "owner"), async (req: AuthRequest, res) => {
    try {
      let merchantId: string;

      // Admin/owner can target specific merchant via query param
      if ((req.user!.role === "admin" || req.user!.role === "owner") && req.query.merchantId) {
        merchantId = req.query.merchantId as string;
        // Validate merchant exists
        const merchant = await storage.getMerchant(merchantId);
        if (!merchant) {
          return res.status(404).json({ error: "Merchant not found" });
        }
      } else {
        // Merchant users get their own analytics
        const merchant = await storage.getMerchantByOwner(req.user!.userId);
        if (!merchant) {
          return res.status(404).json({ error: "Merchant profile not found" });
        }
        merchantId = merchant.id;
      }

      const analytics = await storage.getMerchantAnalytics(merchantId);
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch analytics" });
    }
  });

  // Update own merchant profile
  app.patch("/api/merchants/me", authMiddleware, requireRole("merchant", "admin", "owner"), async (req: AuthRequest, res) => {
    try {
      const merchant = await storage.getMerchantByOwner(req.user!.userId);
      if (!merchant) {
        return res.status(404).json({ error: "Merchant profile not found" });
      }

      // Merchants can update: name, city, contact, email, phone, socials
      // But NOT: status, ownerUserId, id
      const updateSchema = insertMerchantSchema
        .partial()
        .omit({ id: true, ownerUserId: true, status: true });
      
      const validatedData = updateSchema.parse(req.body);
      const updated = await storage.updateMerchant(merchant.id, validatedData);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update merchant profile" });
    }
  });

  // Get merchant products
  app.get("/api/merchant/products", authMiddleware, requireRole("merchant", "admin", "owner"), async (req: AuthRequest, res) => {
    try {
      const merchant = await storage.getMerchantByOwner(req.user!.userId);
      if (!merchant && req.user!.role === "merchant") {
        return res.status(404).json({ error: "Merchant profile not found" });
      }
      
      const products = await storage.listProducts({ 
        merchantId: merchant?.id 
      });
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch products" });
    }
  });

  // Import CSV
  app.post("/api/merchant/import/csv", authMiddleware, requireRole("merchant", "admin", "owner"), upload.single("file"), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const csvData = req.file.buffer.toString("utf-8");
      const lines = csvData.split("\n").filter(l => l.trim());
      
      if (lines.length < 2) {
        return res.status(400).json({ error: "CSV file is empty or invalid" });
      }

      const merchant = await storage.getMerchantByOwner(req.user!.userId);
      if (!merchant) {
        return res.status(404).json({ error: "Merchant profile not found" });
      }

      // Parse CSV (simple implementation)
      const headers = lines[0].split(",").map(h => h.trim());
      const products = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim());
        const product: any = { merchantId: merchant.id };
        
        headers.forEach((header, index) => {
          const value = values[index];
          if (header === "title") product.title = value;
          if (header === "description") product.description = value;
          if (header === "price") product.priceCents = parseInt(value) * 100;
          if (header === "images") product.images = value ? [value] : [];
          if (header === "colors") product.colors = value ? value.split(";") : [];
          if (header === "sizes") product.sizes = value ? value.split(";") : [];
          if (header === "tags") product.tags = value ? value.split(";") : [];
        });

        if (product.title && product.priceCents && product.images?.length) {
          const created = await storage.createProduct(product);
          products.push(created);
        }
      }

      res.json({ imported: products.length, products });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "CSV import failed" });
    }
  });

  // ===== BRANDS ROUTES =====
  
  // List brands
  app.get("/api/brands", async (req, res) => {
    const brands = await storage.listBrands();
    res.json(brands);
  });

  // Get single brand
  app.get("/api/brands/:id", async (req, res) => {
    try {
      const brand = await storage.getBrand(req.params.id);
      if (!brand) {
        return res.status(404).json({ error: "Brand not found" });
      }
      res.json(brand);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch brand" });
    }
  });

  // Create brand (admin only) with logo upload
  app.post("/api/admin/brands", authMiddleware, requireRole("admin", "owner"), upload.single("logo"), async (req: AuthRequest, res) => {
    try {
      const brandData: any = {
        nameEn: req.body.nameEn,
        nameAr: req.body.nameAr || undefined,
        descriptionEn: req.body.descriptionEn || undefined,
        descriptionAr: req.body.descriptionAr || undefined,
        websiteUrl: req.body.websiteUrl || undefined,
        email: req.body.email || undefined,
        socials: req.body.socials ? JSON.parse(req.body.socials) : undefined,
        logoUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      };

      const data = insertBrandSchema.parse(brandData);
      const brand = await storage.createBrand(data);
      res.status(201).json(brand);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid input" });
    }
  });

  // Update brand with logo upload
  app.patch("/api/admin/brands/:id", authMiddleware, requireRole("admin", "owner"), upload.single("logo"), async (req: AuthRequest, res) => {
    try {
      const brandData: any = {};
      if (req.body.nameEn) brandData.nameEn = req.body.nameEn;
      if (req.body.nameAr) brandData.nameAr = req.body.nameAr;
      if (req.body.descriptionEn) brandData.descriptionEn = req.body.descriptionEn;
      if (req.body.descriptionAr) brandData.descriptionAr = req.body.descriptionAr;
      if (req.body.websiteUrl) brandData.websiteUrl = req.body.websiteUrl;
      if (req.body.email) brandData.email = req.body.email;
      if (req.body.socials) brandData.socials = JSON.parse(req.body.socials);
      if (req.file) brandData.logoUrl = `/uploads/${req.file.filename}`;

      const updateSchema = insertBrandSchema.partial().omit({ id: true });
      const validatedData = updateSchema.parse(brandData);
      const brand = await storage.updateBrand(req.params.id, validatedData);
      res.json(brand);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update brand" });
    }
  });

  // Delete brand
  app.delete("/api/admin/brands/:id", authMiddleware, requireRole("admin", "owner"), async (req: AuthRequest, res) => {
    try {
      await storage.deleteBrand(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to delete brand" });
    }
  });

  // ===== OUTFITS ROUTES =====
  
  // List user outfits
  app.get("/api/user/outfits", authMiddleware, async (req: AuthRequest, res) => {
    const outfits = await storage.listOutfitsByUser(req.user!.userId);
    res.json(outfits);
  });

  // Create outfit
  app.post("/api/user/outfits", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertOutfitSchema.parse({ ...req.body, userId: req.user!.userId });
      const outfit = await storage.createOutfit(data);
      res.status(201).json(outfit);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid input" });
    }
  });

  // Update outfit
  app.patch("/api/user/outfits/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const outfit = await storage.getOutfit(req.params.id);
      if (!outfit || outfit.userId !== req.user!.userId) {
        return res.status(404).json({ error: "Outfit not found" });
      }
      const updateSchema = insertOutfitSchema.partial().omit({ id: true, userId: true });
      const validatedData = updateSchema.parse(req.body);
      const updated = await storage.updateOutfit(req.params.id, validatedData);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update outfit" });
    }
  });

  // Delete outfit
  app.delete("/api/user/outfits/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const outfit = await storage.getOutfit(req.params.id);
      if (!outfit || outfit.userId !== req.user!.userId) {
        return res.status(404).json({ error: "Outfit not found" });
      }
      await storage.deleteOutfit(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to delete outfit" });
    }
  });

  // AI outfit suggestions with Gemini
  app.post("/api/outfit/ai", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { userHeight, userWeight, aiPrompt } = z.object({
        userHeight: z.number().min(100).max(250),
        userWeight: z.number().min(30).max(200),
        aiPrompt: z.string().min(3),
      }).parse(req.body);

      const config = await storage.getSystemConfig();
      if (!config?.enableOutfitAI) {
        return res.status(503).json({ error: "Outfit AI is disabled" });
      }

      // Get all published products
      const allProducts = await storage.listProducts({ published: true });
      
      if (allProducts.length < 2) {
        return res.status(400).json({ error: "Not enough products available for outfit generation" });
      }

      // Prepare product data for AI
      const availableProducts = allProducts.map(p => ({
        id: p.id,
        nameEn: p.nameEn,
        category: p.category || 'other'
      }));

      // Use Gemini AI if configured
      if (config.embeddingsProvider === 'gemini' && config.providerKeys?.gemini) {
        const { createOutfitSuggestionProvider } = await import("./lib/ai-providers.js");
        const aiProvider = createOutfitSuggestionProvider(config.providerKeys.gemini);
        
        const suggestion = await aiProvider.generateOutfitSuggestions({
          userHeight,
          userWeight,
          aiPrompt,
          availableProducts
        });
        
        // Get full product details
        const topProduct = await storage.getProduct(suggestion.topProductId);
        const bottomProduct = await storage.getProduct(suggestion.bottomProductId);
        
        return res.json({
          topProduct,
          bottomProduct,
          shoeRecommendation: suggestion.shoeRecommendation,
          reasoning: suggestion.reasoning
        });
      }

      // Fallback: Simple rule-based suggestions
      const tops = allProducts.filter(p => 
        ['top', 'shirt', 't-shirt', 'hoodie', 'jacket'].some(cat => p.category?.toLowerCase().includes(cat))
      );
      const bottoms = allProducts.filter(p => 
        ['bottom', 'pants', 'jeans', 'shorts'].some(cat => p.category?.toLowerCase().includes(cat))
      );
      
      const topProduct = tops[Math.floor(Math.random() * tops.length)] || allProducts[0];
      const bottomProduct = bottoms[Math.floor(Math.random() * bottoms.length)] || allProducts[1];
      
      res.json({
        topProduct,
        bottomProduct,
        shoeRecommendation: {
          brandName: "Nike",
          model: "Air Force 1",
          reason: "Classic versatile sneaker"
        },
        reasoning: "Random selection (AI not configured)"
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "AI suggestion failed" });
    }
  });

  // ===== FAVORITES ROUTES =====
  
  // List user favorites
  app.get("/api/user/favorites", authMiddleware, async (req: AuthRequest, res) => {
    const favorites = await storage.listFavoritesByUser(req.user!.userId);
    res.json(favorites);
  });

  // Add favorite
  app.post("/api/user/favorites", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { productId } = z.object({ productId: z.string() }).parse(req.body);
      const favorite = await storage.createFavorite({ userId: req.user!.userId, productId });
      res.status(201).json(favorite);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to add favorite" });
    }
  });

  // Remove favorite
  app.delete("/api/user/favorites/:productId", authMiddleware, async (req: AuthRequest, res) => {
    try {
      await storage.deleteFavorite(req.user!.userId, req.params.productId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to remove favorite" });
    }
  });

  // ===== ADMIN ROUTES =====
  
  // List users
  app.get("/api/admin/users", authMiddleware, requireRole("admin", "owner"), async (req: AuthRequest, res) => {
    const users = await storage.listUsers();
    res.json(users.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role, createdAt: u.createdAt })));
  });

  // Update user role
  app.patch("/api/admin/users/:id", authMiddleware, requireRole("admin", "owner"), async (req: AuthRequest, res) => {
    try {
      const { role } = z.object({ role: z.enum(["user", "merchant", "admin", "owner"]) }).parse(req.body);
      
      // Only owner can create other owners
      if (role === "owner" && req.user!.role !== "owner") {
        return res.status(403).json({ error: "Only owner can assign owner role" });
      }
      
      const user = await storage.updateUser(req.params.id, { role });
      res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update user" });
    }
  });

  // Get metrics
  app.get("/api/admin/metrics", authMiddleware, requireRole("admin", "owner"), async (req: AuthRequest, res) => {
    const limit = parseInt(req.query.limit as string) || 1000;
    const metrics = await storage.getMetrics(limit);
    
    // Calculate p95 and p99 per route
    const routeMetrics: Record<string, number[]> = {};
    metrics.forEach(m => {
      if (!routeMetrics[m.route]) routeMetrics[m.route] = [];
      routeMetrics[m.route].push(m.durationMs);
    });

    const summary = Object.entries(routeMetrics).map(([route, durations]) => {
      const sorted = durations.sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      const p99Index = Math.floor(sorted.length * 0.99);
      return {
        route,
        count: durations.length,
        p95: sorted[p95Index] || 0,
        p99: sorted[p99Index] || 0,
      };
    });

    res.json({ metrics, summary });
  });

  // Get system config
  app.get("/api/admin/config", authMiddleware, requireRole("admin", "owner"), async (req: AuthRequest, res) => {
    const config = await storage.getSystemConfig();
    res.json(config || {});
  });

  // Update system config
  app.patch("/api/admin/config", authMiddleware, requireRole("admin", "owner"), async (req: AuthRequest, res) => {
    try {
      const configSchema = z.object({
        embeddingsProvider: z.enum(["local", "huggingface", "gemini"]).optional(),
        imageGenerationProvider: z.enum(["off", "stable-diffusion", "dalle"]).optional(),
        enableSpellCorrection: z.boolean().optional(),
        enableOutfitAI: z.boolean().optional(),
        enableImageSearch: z.boolean().optional(),
        enableMultilingual: z.boolean().optional(),
        synonyms: z.record(z.string(), z.string()).optional(),
        providerKeys: z.object({
          huggingface: z.string().optional(),
          gemini: z.string().optional(),
        }).optional(),
        smtpConfig: z.object({
          host: z.string().optional(),
          port: z.number().optional(),
          user: z.string().optional(),
          pass: z.string().optional(),
        }).optional(),
      });
      const validatedData = configSchema.parse(req.body);
      const config = await storage.updateSystemConfig(validatedData);
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update config" });
    }
  });

  // Trigger index rebuild
  app.post("/api/admin/index/rebuild", authMiddleware, requireRole("admin", "owner"), async (req: AuthRequest, res) => {
    try {
      const productsToIndex = await storage.getProductsNeedingIndexing();
      
      const job = await storage.createIndexingJob({
        status: "running",
        productsTotal: productsToIndex.length,
        productsProcessed: 0,
        failures: 0,
      });

      // Background indexing (simplified)
      (async () => {
        const config = await storage.getSystemConfig();
        const provider = createEmbeddingProvider(
          config?.embeddingsProvider || "local",
          config?.providerKeys?.huggingface || config?.providerKeys?.openai
        );

        let processed = 0;
        let failures = 0;

        for (const product of productsToIndex) {
          try {
            const textEmbedding = await provider.generateTextEmbedding(
              `${product.title} ${product.description} ${product.tags?.join(" ")}`
            );
            
            await storage.updateProduct(product.id, {
              vectors: { textEmbedding },
              lastIndexedAt: new Date(),
            });
            processed++;
          } catch (error) {
            failures++;
          }
        }

        await storage.updateIndexingJob(job.id, {
          status: "completed",
          productsProcessed: processed,
          failures,
          completedAt: new Date(),
        });
      })();

      res.json({ jobId: job.id, message: "Indexing started", totalProducts: productsToIndex.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to start indexing" });
    }
  });

  // Get indexing job status
  app.get("/api/admin/index/health", authMiddleware, requireRole("admin", "owner"), async (req: AuthRequest, res) => {
    const job = await storage.getLatestIndexingJob();
    res.json(job || { status: "no jobs yet" });
  });

  // Image generation (stub)
  app.post("/api/generate-image", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { prompt, negativePrompt, steps } = z.object({
        prompt: z.string(),
        negativePrompt: z.string().optional(),
        steps: z.number().optional(),
      }).parse(req.body);

      const config = await storage.getSystemConfig();
      if (config?.imageGenerationProvider === "off") {
        return res.status(503).json({ error: "Image generation is disabled" });
      }

      // Stub implementation - would call actual image generation API
      res.json({ 
        imageUrl: "https://via.placeholder.com/512x512?text=Generated+Image",
        message: "Image generation is a stub implementation" 
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Image generation failed" });
    }
  });

  // ===== NAVIGATION LINKS ROUTES =====

  // Public: Get enabled nav links
  app.get("/api/nav-links", async (req, res) => {
    try {
      const links = await storage.listNavLinks();
      res.json(links);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch navigation links" });
    }
  });

  // Admin: Get all nav links
  app.get("/api/admin/nav-links", authMiddleware, requireRole("admin", "owner"), async (req: AuthRequest, res) => {
    try {
      const links = await storage.listNavLinksAdmin();
      res.json(links);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch navigation links" });
    }
  });

  // Admin: Create nav link
  app.post("/api/admin/nav-links", authMiddleware, requireRole("admin", "owner"), async (req: AuthRequest, res) => {
    try {
      const navLinkValidationSchema = insertNavLinkSchema.extend({
        labelEn: z.string().min(1).max(64),
        labelAr: z.string().min(1).max(64),
        path: z.string().min(1).max(256).refine(
          (path) => path.startsWith("/") || path.startsWith("http"),
          { message: "Path must start with / (internal) or http (external)" }
        ),
        order: z.number().min(0),
      });
      
      const data = navLinkValidationSchema.parse(req.body);
      const link = await storage.createNavLink(data);
      res.status(201).json(link);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid input" });
    }
  });

  // Admin: Update nav link
  app.patch("/api/admin/nav-links/:id", authMiddleware, requireRole("admin", "owner"), async (req: AuthRequest, res) => {
    try {
      const navLinkUpdateSchema = insertNavLinkSchema.partial().extend({
        labelEn: z.string().min(1).max(64).optional(),
        labelAr: z.string().min(1).max(64).optional(),
        path: z.string().min(1).max(256).refine(
          (path) => path.startsWith("/") || path.startsWith("http"),
          { message: "Path must start with / (internal) or http (external)" }
        ).optional(),
        order: z.number().min(0).optional(),
      });
      
      const data = navLinkUpdateSchema.parse(req.body);
      const link = await storage.updateNavLink(req.params.id, data);
      res.json(link);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update navigation link" });
    }
  });

  // Admin: Delete nav link
  app.delete("/api/admin/nav-links/:id", authMiddleware, requireRole("admin", "owner"), async (req: AuthRequest, res) => {
    try {
      await storage.deleteNavLink(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to delete navigation link" });
    }
  });

  // Admin: Reorder nav links
  app.patch("/api/admin/nav-links/batch/reorder", authMiddleware, requireRole("admin", "owner"), async (req: AuthRequest, res) => {
    try {
      const { updates } = z.object({
        updates: z.array(z.object({
          id: z.string(),
          order: z.number().min(0),
        })),
      }).parse(req.body);
      
      await storage.reorderNavLinks(updates);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to reorder navigation links" });
    }
  });

  // ===== FOOTER CONFIG ROUTES =====
  
  // Get footer config (public)
  app.get("/api/footer-config", async (req, res) => {
    const config = await storage.getFooterConfig();
    if (!config) {
      return res.json({
        id: "singleton",
        copyrightTextEn: "© 2025 Outfred. All rights reserved.",
        copyrightTextAr: "© 2025 آوتفريد. جميع الحقوق محفوظة.",
        socialLinks: {},
        updatedAt: new Date(),
      });
    }
    res.json(config);
  });

  // Update footer config (admin only)
  app.patch("/api/admin/footer-config", authMiddleware, requireRole("admin", "owner"), async (req: AuthRequest, res) => {
    try {
      const updates: any = {};
      if (req.body.copyrightTextEn !== undefined) updates.copyrightTextEn = req.body.copyrightTextEn;
      if (req.body.copyrightTextAr !== undefined) updates.copyrightTextAr = req.body.copyrightTextAr;
      if (req.body.socialLinks !== undefined) updates.socialLinks = req.body.socialLinks;

      const config = await storage.updateFooterConfig(updates);
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update footer config" });
    }
  });

  // ===== STATIC PAGES ROUTES =====

  // Get static page by slug (public, published only)
  app.get("/api/pages/:slug", async (req, res) => {
    const page = await storage.getStaticPage(req.params.slug);
    if (!page || !page.isPublished) {
      return res.status(404).json({ error: "Page not found" });
    }
    res.json(page);
  });

  // List published static pages (public)
  app.get("/api/pages", async (req, res) => {
    const pages = await storage.listStaticPages(true);
    res.json(pages);
  });

  // Admin: List all static pages
  app.get("/api/admin/pages", authMiddleware, requireRole("admin", "owner"), async (req: AuthRequest, res) => {
    const pages = await storage.listStaticPages(false);
    res.json(pages);
  });

  // Admin: Create static page
  app.post("/api/admin/pages", authMiddleware, requireRole("admin", "owner"), async (req: AuthRequest, res) => {
    try {
      const pageData = insertStaticPageSchema.parse(req.body);
      const page = await storage.createStaticPage(pageData);
      res.json(page);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create page" });
    }
  });

  // Admin: Update static page
  app.patch("/api/admin/pages/:id", authMiddleware, requireRole("admin", "owner"), async (req: AuthRequest, res) => {
    try {
      const updates = req.body;
      const page = await storage.updateStaticPage(req.params.id, updates);
      res.json(page);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update page" });
    }
  });

  // Admin: Delete static page
  app.delete("/api/admin/pages/:id", authMiddleware, requireRole("admin", "owner"), async (req: AuthRequest, res) => {
    try {
      await storage.deleteStaticPage(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to delete page" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
