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
import { insertUserSchema, insertMerchantSchema, insertBrandSchema, insertProductSchema, insertOutfitSchema } from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
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
      res.json({ accessToken: newAccessToken });
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
  
  // List products
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

      // Simple text search (BM25 would be implemented with pg_trgm or tsvector in production)
      const products = await storage.listProducts({ search: q, published: true });
      
      // Apply additional filters
      let filtered = products;
      if (filters) {
        if (filters.priceMin) {
          filtered = filtered.filter(p => p.priceCents >= filters.priceMin! * 100);
        }
        if (filters.priceMax) {
          filtered = filtered.filter(p => p.priceCents <= filters.priceMax! * 100);
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
  app.post("/api/search/image", upload.single("image"), async (req, res) => {
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
      // For now, return sample results
      const products = await storage.listProducts({ published: true });
      const results = products.slice(0, 10);

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

  // Create brand (admin only)
  app.post("/api/admin/brands", authMiddleware, requireRole("admin", "owner"), async (req: AuthRequest, res) => {
    try {
      const data = insertBrandSchema.parse(req.body);
      const brand = await storage.createBrand(data);
      res.status(201).json(brand);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid input" });
    }
  });

  // Update brand
  app.patch("/api/admin/brands/:id", authMiddleware, requireRole("admin", "owner"), async (req: AuthRequest, res) => {
    try {
      const updateSchema = insertBrandSchema.partial().omit({ id: true });
      const validatedData = updateSchema.parse(req.body);
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

  // AI outfit suggestions
  app.post("/api/outfit/ai", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { seedProductId, styleTags } = z.object({
        seedProductId: z.string().optional(),
        styleTags: z.array(z.string()).optional(),
      }).parse(req.body);

      const config = await storage.getSystemConfig();
      if (!config?.enableOutfitAI) {
        return res.status(503).json({ error: "Outfit AI is disabled" });
      }

      // Simple rule-based suggestions
      const allProducts = await storage.listProducts({ published: true });
      const suggestions = allProducts.slice(0, 4);

      res.json({ suggestions });
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
        embeddingsProvider: z.enum(["local", "huggingface", "openai"]).optional(),
        imageGenerationProvider: z.enum(["off", "stable-diffusion", "dalle"]).optional(),
        enableSpellCorrection: z.boolean().optional(),
        enableOutfitAI: z.boolean().optional(),
        enableImageSearch: z.boolean().optional(),
        enableMultilingual: z.boolean().optional(),
        synonyms: z.record(z.string(), z.string()).optional(),
        providerKeys: z.object({
          huggingface: z.string().optional(),
          openai: z.string().optional(),
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

  const httpServer = createServer(app);
  return httpServer;
}
