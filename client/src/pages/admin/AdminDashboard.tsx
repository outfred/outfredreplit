import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMerchantSchema, insertBrandSchema } from "@shared/schema";
import { z } from "zod";
import type { User, Merchant, Brand, Product } from "@shared/schema";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Store,
  Sparkles,
  Settings,
  BarChart3,
  ShieldCheck,
  ShieldBan,
  Edit,
  Trash2,
  Mail,
  Database,
  Image as ImageIcon,
  BookOpen,
  Plus,
  Building,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Merchant form schema
const merchantFormSchema = insertMerchantSchema.extend({
  status: z.enum(["pending", "active", "banned"]).optional(),
});

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<
    "users" | "merchants" | "products" | "brands" | "navigation" | "ai" | "metrics" | "config"
  >("users");
  
  // Merchant Dialog State
  const [merchantDialog, setMerchantDialog] = useState<{
    open: boolean;
    mode: "create" | "edit";
    merchant?: Merchant;
  }>({ open: false, mode: "create" });
  
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    merchantId?: string;
    merchantName?: string;
  }>({ open: false });

  // CSV Import State
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [selectedMerchantForImport, setSelectedMerchantForImport] = useState<string>("");

  // Product Filter & Dialog State
  const [productMerchantFilter, setProductMerchantFilter] = useState<string>("");
  const [deleteProductConfirm, setDeleteProductConfirm] = useState<{
    open: boolean;
    productId?: string;
    productName?: string;
  }>({ open: false });

  // Fetch Users (also needed for merchant owner selection)
  const { data: usersData = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: activeView === "users" || activeView === "merchants",
  });

  // Fetch Merchants
  const { data: merchantsData = [], isLoading: merchantsLoading } = useQuery<Merchant[]>({
    queryKey: ["/api/admin/merchants"],
    enabled: activeView === "merchants",
  });

  // Fetch Products (with merchant filter)
  const { data: productsData = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", productMerchantFilter],
    queryFn: async () => {
      const url = (productMerchantFilter && productMerchantFilter !== "all")
        ? `/api/products?merchantId=${productMerchantFilter}`
        : "/api/products";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
    enabled: activeView === "products",
  });

  // Fetch Merchants (also needed for CSV import merchant selection)
  const merchantsForImport = useQuery<Merchant[]>({
    queryKey: ["/api/admin/merchants"],
    enabled: activeView === "products" || csvImportOpen,
  });

  // Fetch Brands
  const { data: brandsData = [], isLoading: brandsLoading } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
    enabled: activeView === "brands",
  });

  // Fetch Metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery<{
    metrics: Array<any>;
    summary: Array<{ route: string; p95: number; p99: number; count: number }>;
  }>({
    queryKey: ["/api/admin/metrics"],
    enabled: activeView === "metrics",
  });

  // Fetch Config
  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ["/api/admin/config"],
    enabled: activeView === "config" || activeView === "ai",
  });

  // Update User Mutation
  const updateUser = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: t("success"), description: "User updated successfully" });
    },
    onError: () => {
      toast({ title: t("error"), description: "Failed to update user", variant: "destructive" });
    },
  });

  // Create Merchant Mutation
  const createMerchant = useMutation({
    mutationFn: async (data: z.infer<typeof merchantFormSchema>) => {
      const res = await apiRequest("POST", "/api/admin/merchants", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/merchants"] });
      toast({ title: t("success"), description: "Merchant created successfully" });
      setMerchantDialog({ open: false, mode: "create" });
    },
    onError: () => {
      toast({ title: t("error"), description: "Failed to create merchant", variant: "destructive" });
    },
  });

  // Update Merchant Mutation
  const updateMerchant = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Merchant> }) => {
      const res = await apiRequest("PATCH", `/api/admin/merchants/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/merchants"] });
      toast({ title: t("success"), description: "Merchant updated successfully" });
      setMerchantDialog({ open: false, mode: "create" });
    },
    onError: () => {
      toast({ title: t("error"), description: "Failed to update merchant", variant: "destructive" });
    },
  });

  // Delete Merchant Mutation
  const deleteMerchant = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/merchants/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/merchants"] });
      toast({ title: t("success"), description: "Merchant deleted successfully" });
      setDeleteConfirm({ open: false });
    },
    onError: () => {
      toast({ title: t("error"), description: "Failed to delete merchant", variant: "destructive" });
    },
  });

  // Delete Product Mutation
  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/products/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: t("success"), description: "Product deleted successfully" });
      setDeleteProductConfirm({ open: false });
    },
    onError: () => {
      toast({ title: t("error"), description: "Failed to delete product", variant: "destructive" });
    },
  });

  // Toggle Publish Product Mutation
  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const res = await apiRequest("PATCH", `/api/products/${id}`, { published });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: t("success"), description: "Product updated successfully" });
    },
    onError: () => {
      toast({ title: t("error"), description: "Failed to update product", variant: "destructive" });
    },
  });

  // Delete Brand Mutation
  const deleteBrand = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/brands/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({ title: t("success"), description: "Brand deleted successfully" });
      setDeleteBrandConfirm({ open: false });
    },
    onError: () => {
      toast({ title: t("error"), description: "Failed to delete brand", variant: "destructive" });
    },
  });

  // Brand Dialog State
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deleteBrandConfirm, setDeleteBrandConfirm] = useState<{
    open: boolean;
    brandId?: string;
    brandName?: string;
  }>({ open: false });

  const users = usersData;
  const merchants = merchantsData;
  const brands = brandsData;
  const metrics = {
    endpoints: metricsData?.summary || [],
    indexSize: "N/A",
    lastCron: "N/A",
    cronStatus: "healthy",
  };

  return (
    <div className="min-h-screen pt-24 px-4 pb-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t("admin")} {t("dashboard")}</h1>
          <p className="text-muted-foreground">Manage users, merchants, and system configuration</p>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <Button
            variant={activeView === "users" ? "default" : "ghost"}
            onClick={() => setActiveView("users")}
            className="rounded-xl whitespace-nowrap"
            data-testid="button-nav-users"
          >
            <Users className="w-4 h-4 me-2" />
            {t("users")}
          </Button>
          <Button
            variant={activeView === "merchants" ? "default" : "ghost"}
            onClick={() => setActiveView("merchants")}
            className="rounded-xl whitespace-nowrap"
            data-testid="button-nav-merchants"
          >
            <Store className="w-4 h-4 me-2" />
            {t("merchants")}
          </Button>
          <Button
            variant={activeView === "products" ? "default" : "ghost"}
            onClick={() => setActiveView("products")}
            className="rounded-xl whitespace-nowrap"
            data-testid="button-nav-products"
          >
            <Database className="w-4 h-4 me-2" />
            {t("products")}
          </Button>
          <Button
            variant={activeView === "brands" ? "default" : "ghost"}
            onClick={() => setActiveView("brands")}
            className="rounded-xl whitespace-nowrap"
            data-testid="button-nav-brands"
          >
            <Sparkles className="w-4 h-4 me-2" />
            {t("brands")}
          </Button>
          <Button
            variant={activeView === "navigation" ? "default" : "ghost"}
            onClick={() => setActiveView("navigation")}
            className="rounded-xl whitespace-nowrap"
            data-testid="button-nav-navigation"
          >
            <BookOpen className="w-4 h-4 me-2" />
            Navigation
          </Button>
          <Button
            variant={activeView === "ai" ? "default" : "ghost"}
            onClick={() => setActiveView("ai")}
            className="rounded-xl whitespace-nowrap"
            data-testid="button-nav-ai"
          >
            <Sparkles className="w-4 h-4 me-2" />
            {t("aiControls")}
          </Button>
          <Button
            variant={activeView === "metrics" ? "default" : "ghost"}
            onClick={() => setActiveView("metrics")}
            className="rounded-xl whitespace-nowrap"
            data-testid="button-nav-metrics"
          >
            <BarChart3 className="w-4 h-4 me-2" />
            {t("systemMetrics")}
          </Button>
          <Button
            variant={activeView === "config" ? "default" : "ghost"}
            onClick={() => setActiveView("config")}
            className="rounded-xl whitespace-nowrap"
            data-testid="button-nav-config"
          >
            <Settings className="w-4 h-4 me-2" />
            {t("configuration")}
          </Button>
        </div>

        {/* Users View */}
        {activeView === "users" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{t("users")}</h2>
              <GlowButton variant="primary" data-testid="button-add-user">
                <Users className="w-4 h-4 me-2" />
                Add User
              </GlowButton>
            </div>
            <GlassCard className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("email")}</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-white/10" data-testid={`row-user-${user.id}`}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" data-testid={`button-edit-user-${user.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" data-testid={`button-delete-user-${user.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </GlassCard>
          </div>
        )}

        {/* Products View */}
        {activeView === "products" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{t("products")}</h2>
              <div className="flex gap-2">
                <Select value={productMerchantFilter} onValueChange={setProductMerchantFilter}>
                  <SelectTrigger className="w-60" data-testid="select-product-merchant-filter">
                    <SelectValue placeholder="All Merchants" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover/95 backdrop-blur-xl border-popover-border">
                    <SelectItem value="all">All Merchants</SelectItem>
                    {merchantsForImport.data?.map((merchant) => (
                      <SelectItem key={merchant.id} value={merchant.id}>
                        {merchant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <GlowButton 
                  variant="outline" 
                  onClick={() => setCsvImportOpen(true)}
                  data-testid="button-import-csv"
                >
                  <Database className="w-4 h-4 me-2" />
                  Import CSV
                </GlowButton>
              </div>
            </div>

            {productsLoading ? (
              <GlassCard className="p-8 text-center">Loading products...</GlassCard>
            ) : (
              <GlassCard className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>{t("price")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead className="text-end">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsData.map((product) => (
                      <TableRow key={product.id} className="border-white/10" data-testid={`row-product-${product.id}`}>
                        <TableCell className="font-medium">{product.titleEn}</TableCell>
                        <TableCell>{product.brandId}</TableCell>
                        <TableCell>{product.price} EGP</TableCell>
                        <TableCell>
                          <Badge variant={product.published ? "default" : "secondary"}>
                            {product.published ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-end">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => togglePublish.mutate({ id: product.id, published: !product.published })}
                              disabled={togglePublish.isPending}
                              data-testid={`button-toggle-publish-${product.id}`}
                            >
                              {product.published ? <ShieldBan className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setDeleteProductConfirm({ open: true, productId: product.id, productName: product.titleEn })}
                              data-testid={`button-delete-product-${product.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </GlassCard>
            )}
          </div>
        )}

        {/* Merchants View */}
        {activeView === "merchants" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{t("merchants")}</h2>
              <GlowButton 
                variant="primary" 
                onClick={() => setMerchantDialog({ open: true, mode: "create" })}
                data-testid="button-add-merchant"
              >
                <Store className="w-4 h-4 me-2" />
                Add Merchant
              </GlowButton>
            </div>
            <GlassCard className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>{t("city")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead className="text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {merchants.map((merchant) => (
                    <TableRow key={merchant.id} className="border-white/10" data-testid={`row-merchant-${merchant.id}`}>
                      <TableCell className="font-medium">{merchant.name}</TableCell>
                      <TableCell>{merchant.ownerUserId}</TableCell>
                      <TableCell>{merchant.city}</TableCell>
                      <TableCell>
                        <Badge variant={merchant.status === "active" ? "default" : "secondary"}>
                          {merchant.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex justify-end gap-2">
                          {merchant.status === "pending" && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => updateMerchant.mutate({ id: merchant.id, data: { status: "active" } })}
                              disabled={updateMerchant.isPending}
                              data-testid={`button-approve-${merchant.id}`}
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setMerchantDialog({ open: true, mode: "edit", merchant })}
                            data-testid={`button-edit-${merchant.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => updateMerchant.mutate({ id: merchant.id, data: { status: "banned" } })}
                            disabled={updateMerchant.isPending}
                            data-testid={`button-ban-${merchant.id}`}
                          >
                            <ShieldBan className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setDeleteConfirm({ open: true, merchantId: merchant.id, merchantName: merchant.name })}
                            data-testid={`button-delete-${merchant.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </GlassCard>
          </div>
        )}

        {/* Brands View */}
        {activeView === "brands" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{t("brands")}</h2>
              <GlowButton 
                variant="default" 
                onClick={() => {
                  setEditingBrand(null);
                  setBrandDialogOpen(true);
                }}
                data-testid="button-add-brand"
              >
                <Plus className="w-4 h-4 me-2" />
                {t("addBrand")}
              </GlowButton>
            </div>

            {brandsLoading ? (
              <GlassCard className="p-8 text-center">Loading brands...</GlassCard>
            ) : (
              <GlassCard className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead>Logo</TableHead>
                      <TableHead>Name (En)</TableHead>
                      <TableHead>Name (Ar)</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead className="text-end">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brands.map((brand) => (
                      <TableRow key={brand.id} className="border-white/10 hover:bg-white/5" data-testid={`row-brand-${brand.id}`}>
                        <TableCell>
                          {brand.logoUrl ? (
                            <img src={brand.logoUrl} alt={brand.nameEn} className="w-12 h-12 object-contain rounded" />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                              <Building className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{brand.nameEn}</TableCell>
                        <TableCell>{brand.nameAr || "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{brand.websiteUrl || "-"}</TableCell>
                        <TableCell className="text-end">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setEditingBrand(brand);
                                setBrandDialogOpen(true);
                              }}
                              data-testid={`button-edit-brand-${brand.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setDeleteBrandConfirm({ open: true, brandId: brand.id, brandName: brand.nameEn })}
                              data-testid={`button-delete-brand-${brand.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </GlassCard>
            )}
          </div>
        )}

        {/* AI Controls View */}
        {activeView === "ai" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">{t("aiControls")}</h2>
            <div className="grid gap-6 max-w-2xl">
              {/* Embeddings Provider */}
              <GlassCard className="p-6">
                <Label className="mb-3 block">{t("embeddingsProvider")}</Label>
                <Select defaultValue="local">
                  <SelectTrigger data-testid="select-embeddings-provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover/95 backdrop-blur-xl border-popover-border">
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="huggingface">Hugging Face</SelectItem>
                    <SelectItem value="gemini">Gemini</SelectItem>
                  </SelectContent>
                </Select>
              </GlassCard>

              {/* Image Generation */}
              <GlassCard className="p-6">
                <Label className="mb-3 block">{t("imageGeneration")}</Label>
                <Select defaultValue="off">
                  <SelectTrigger data-testid="select-image-generation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover/95 backdrop-blur-xl border-popover-border">
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="huggingface">Hugging Face (Stable Diffusion)</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </GlassCard>

              {/* Feature Flags */}
              <GlassCard className="p-6">
                <h3 className="font-semibold mb-4">{t("featureFlags")}</h3>
                <div className="space-y-4">
                  {[
                    { id: "outfit_ai", label: "Outfit AI" },
                    { id: "image_search", label: "Image Search" },
                    { id: "multilingual", label: "Multilingual Support" },
                    { id: "spell_correction", label: "Spell Correction" },
                    { id: "analytics_stream", label: "Analytics Stream" },
                  ].map((flag) => (
                    <div key={flag.id} className="flex items-center justify-between">
                      <Label htmlFor={flag.id}>{flag.label}</Label>
                      <Switch id={flag.id} defaultChecked data-testid={`switch-${flag.id}`} />
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Index Settings */}
              <GlassCard className="p-6">
                <h3 className="font-semibold mb-4">Similarity Index Settings</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dimension">Dimension</Label>
                    <Input id="dimension" type="number" defaultValue="384" data-testid="input-dimension" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metric">Metric</Label>
                    <Select defaultValue="cosine">
                      <SelectTrigger id="metric" data-testid="select-metric">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover/95 backdrop-blur-xl border-popover-border">
                        <SelectItem value="cosine">Cosine</SelectItem>
                        <SelectItem value="euclidean">Euclidean</SelectItem>
                        <SelectItem value="dot">Dot Product</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="topK">Top K Results</Label>
                    <Input id="topK" type="number" defaultValue="20" data-testid="input-topk" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="rerank">Enable Re-ranking</Label>
                    <Switch id="rerank" data-testid="switch-rerank" />
                  </div>
                </div>
              </GlassCard>

              {/* Spell Correction */}
              <GlassCard className="p-6">
                <h3 className="font-semibold mb-4">{t("spellCorrection")}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage synonym dictionary for Arabic and English
                </p>
                <Button variant="outline" data-testid="button-manage-dictionary">
                  <BookOpen className="w-4 h-4 me-2" />
                  Manage Dictionary
                </Button>
              </GlassCard>
            </div>
          </div>
        )}

        {/* Metrics View */}
        {activeView === "metrics" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">{t("systemMetrics")}</h2>
            
            {/* Endpoint Latency */}
            <GlassCard className="overflow-hidden mb-6">
              <div className="p-6">
                <h3 className="font-semibold mb-4">Endpoint Latency (ms)</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead>Route</TableHead>
                    <TableHead>P95</TableHead>
                    <TableHead>P99</TableHead>
                    <TableHead>Requests</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.endpoints.map((endpoint: any) => (
                    <TableRow key={endpoint.route} className="border-white/10">
                      <TableCell className="font-mono text-sm">{endpoint.route}</TableCell>
                      <TableCell>
                        <span className={endpoint.p95 > 250 ? "text-destructive" : "text-primary"}>
                          {endpoint.p95}ms
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={endpoint.p99 > 250 ? "text-destructive" : "text-primary"}>
                          {endpoint.p99}ms
                        </span>
                      </TableCell>
                      <TableCell>{endpoint.count.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </GlassCard>

            {/* System Status */}
            <div className="grid md:grid-cols-3 gap-6">
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Database className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Index Size</h3>
                </div>
                <p className="text-2xl font-bold" data-testid="text-index-size">{metrics.indexSize}</p>
              </GlassCard>
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Settings className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Last Cron Run</h3>
                </div>
                <p className="text-2xl font-bold" data-testid="text-last-cron">{metrics.lastCron}</p>
              </GlassCard>
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Cron Status</h3>
                </div>
                <Badge variant="default" className="text-base" data-testid="badge-cron-status">
                  {metrics.cronStatus}
                </Badge>
              </GlassCard>
            </div>
          </div>
        )}

        {/* Navigation View */}
        {activeView === "navigation" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Navigation Management</h2>
              <GlowButton variant="primary" data-testid="button-add-nav-link">
                <Plus className="w-4 h-4 me-2" />
                Add Link
              </GlowButton>
            </div>
            <GlassCard className="overflow-hidden">
              <p className="p-6 text-muted-foreground">Navigation CMS UI - Coming soon</p>
            </GlassCard>
          </div>
        )}

        {/* Configuration View */}
        {activeView === "config" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">{t("configuration")}</h2>
            <div className="grid gap-6 max-w-2xl">
              {/* SMTP Settings */}
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">{t("smtpSettings")}</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-host">Host</Label>
                      <Input id="smtp-host" placeholder="smtp.example.com" data-testid="input-smtp-host" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">Port</Label>
                      <Input id="smtp-port" type="number" placeholder="587" data-testid="input-smtp-port" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-user">Username</Label>
                    <Input id="smtp-user" placeholder="user@example.com" data-testid="input-smtp-user" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-pass">Password</Label>
                    <Input id="smtp-pass" type="password" placeholder="••••••••" data-testid="input-smtp-pass" />
                  </div>
                </div>
              </GlassCard>

              {/* Provider Keys */}
              <GlassCard className="p-6">
                <h3 className="font-semibold mb-4">Provider API Keys</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="hf-key">Hugging Face API Key</Label>
                    <Input id="hf-key" type="password" placeholder="hf_••••••••" data-testid="input-hf-key" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gemini-key">Gemini API Key</Label>
                    <Input id="gemini-key" type="password" placeholder="AI••••••••" data-testid="input-gemini-key" />
                  </div>
                </div>
              </GlassCard>

              <GlowButton variant="primary" className="w-full" data-testid="button-save-config">
                Save Configuration
              </GlowButton>
            </div>
          </div>
        )}
      </div>

      {/* Merchant Dialog */}
      <MerchantDialog
        open={merchantDialog.open}
        mode={merchantDialog.mode}
        merchant={merchantDialog.merchant}
        onClose={() => setMerchantDialog({ open: false, mode: "create" })}
        onSubmit={(data) => {
          if (merchantDialog.mode === "create") {
            createMerchant.mutate(data);
          } else if (merchantDialog.merchant) {
            updateMerchant.mutate({ id: merchantDialog.merchant.id, data });
          }
        }}
        isPending={createMerchant.isPending || updateMerchant.isPending}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-card-border">
          <DialogHeader>
            <DialogTitle>Delete Merchant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteConfirm.merchantName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm({ open: false })}
              disabled={deleteMerchant.isPending}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm.merchantId && deleteMerchant.mutate(deleteConfirm.merchantId)}
              disabled={deleteMerchant.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMerchant.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <CSVImportDialog
        open={csvImportOpen}
        onClose={() => setCsvImportOpen(false)}
        merchants={merchantsForImport.data || []}
        selectedMerchant={selectedMerchantForImport}
        onMerchantChange={setSelectedMerchantForImport}
      />

      {/* Delete Product Confirmation */}
      <Dialog open={deleteProductConfirm.open} onOpenChange={(open) => setDeleteProductConfirm({ ...deleteProductConfirm, open })}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-card-border">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteProductConfirm.productName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteProductConfirm({ open: false })}
              disabled={deleteProduct.isPending}
              data-testid="button-cancel-delete-product"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteProductConfirm.productId && deleteProduct.mutate(deleteProductConfirm.productId)}
              disabled={deleteProduct.isPending}
              data-testid="button-confirm-delete-product"
            >
              {deleteProduct.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Brand Add/Edit Dialog */}
      <BrandDialog
        open={brandDialogOpen}
        onClose={() => {
          setBrandDialogOpen(false);
          setEditingBrand(null);
        }}
        brand={editingBrand}
      />

      {/* Delete Brand Confirmation */}
      <Dialog open={deleteBrandConfirm.open} onOpenChange={(open) => setDeleteBrandConfirm({ ...deleteBrandConfirm, open })}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-card-border">
          <DialogHeader>
            <DialogTitle>Delete Brand</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteBrandConfirm.brandName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteBrandConfirm({ open: false })}
              disabled={deleteBrand.isPending}
              data-testid="button-cancel-delete-brand"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteBrandConfirm.brandId && deleteBrand.mutate(deleteBrandConfirm.brandId)}
              disabled={deleteBrand.isPending}
              data-testid="button-confirm-delete-brand"
            >
              {deleteBrand.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// CSV Import Dialog Component
function CSVImportDialog({
  open,
  onClose,
  merchants,
  selectedMerchant,
  onMerchantChange,
}: {
  open: boolean;
  onClose: () => void;
  merchants: Merchant[];
  selectedMerchant: string;
  onMerchantChange: (id: string) => void;
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [csvFile, setCSVFile] = useState<File | null>(null);

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!csvFile || !selectedMerchant) {
        throw new Error("Missing CSV file or merchant selection");
      }

      const formData = new FormData();
      formData.append("csv", csvFile);
      formData.append("merchantId", selectedMerchant);

      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/products/import-csv", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to import CSV");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ 
        title: t("success"), 
        description: `Imported ${data.count || 0} products successfully` 
      });
      onClose();
      setCSVFile(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: t("error"), 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "text/csv") {
      setCSVFile(file);
    } else {
      toast({ 
        title: t("error"), 
        description: "Please select a valid CSV file", 
        variant: "destructive" 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-card/95 backdrop-blur-xl border-card-border max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Products from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with product data. Required columns: titleEn, titleAr, price, brandId
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="merchant-select">Select Merchant</Label>
            <Select value={selectedMerchant} onValueChange={onMerchantChange}>
              <SelectTrigger id="merchant-select" data-testid="select-csv-merchant">
                <SelectValue placeholder="Choose merchant" />
              </SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-popover-border">
                {merchants.map((merchant) => (
                  <SelectItem key={merchant.id} value={merchant.id}>
                    {merchant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              data-testid="input-csv-file"
            />
            {csvFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {csvFile.name}
              </p>
            )}
          </div>

          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <p className="font-semibold mb-1">CSV Format Example:</p>
            <code className="text-xs">
              titleEn,titleAr,price,brandId,colors,sizes<br/>
              Hoodie,هودي,599,brand-id-here,"Black,Gray","S,M,L"
            </code>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={importMutation.isPending}
            data-testid="button-cancel-import"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => importMutation.mutate()}
            disabled={importMutation.isPending || !csvFile || !selectedMerchant}
            data-testid="button-submit-import"
          >
            {importMutation.isPending ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Merchant Dialog Component
function MerchantDialog({
  open,
  mode,
  merchant,
  onClose,
  onSubmit,
  isPending,
}: {
  open: boolean;
  mode: "create" | "edit";
  merchant?: Merchant;
  onClose: () => void;
  onSubmit: (data: z.infer<typeof merchantFormSchema>) => void;
  isPending: boolean;
}) {
  const { t } = useLanguage();
  
  const form = useForm<z.infer<typeof merchantFormSchema>>({
    resolver: zodResolver(merchantFormSchema),
    defaultValues: {
      ownerUserId: "",
      name: "",
      city: "",
      contact: "",
      status: "pending" as const,
      logoUrl: "",
      bannerUrl: "",
      policies: "",
    },
  });

  // Reset form when dialog opens or merchant changes
  if (open) {
    if (merchant && mode === "edit") {
      form.reset({
        ownerUserId: merchant.ownerUserId,
        name: merchant.name,
        city: merchant.city,
        contact: merchant.contact || "",
        status: merchant.status,
        logoUrl: merchant.logoUrl || "",
        bannerUrl: merchant.bannerUrl || "",
        policies: merchant.policies || "",
      });
    } else if (mode === "create") {
      form.reset({
        ownerUserId: "",
        name: "",
        city: "",
        contact: "",
        status: "pending" as const,
        logoUrl: "",
        bannerUrl: "",
        policies: "",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-card/95 backdrop-blur-xl border-card-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add New Merchant" : "Edit Merchant"}</DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Create a new merchant account with all required details" 
              : "Update merchant information and settings"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="ownerUserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner User</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-owner-user">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover/95 backdrop-blur-xl border-popover-border">
                      {usersData.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Merchant business name" data-testid="input-merchant-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("city")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Cairo, Alexandria, etc." data-testid="input-merchant-city" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Email or phone number" data-testid="input-merchant-contact" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("status")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-merchant-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover/95 backdrop-blur-xl border-popover-border">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="banned">Banned</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." data-testid="input-merchant-logo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="policies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policies</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Return policy, shipping info, etc." rows={3} data-testid="input-merchant-policies" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
                data-testid="button-cancel-merchant"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                data-testid="button-submit-merchant"
              >
                {isPending ? "Saving..." : mode === "create" ? "Create" : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Brand Add/Edit Dialog Component
function BrandDialog({
  open,
  onClose,
  brand,
}: {
  open: boolean;
  onClose: () => void;
  brand: Brand | null;
}) {
  const { toast } = useToast();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const { t } = useLanguage();

  const form = useForm<z.infer<typeof insertBrandSchema>>({
    resolver: zodResolver(insertBrandSchema.extend({
      logoUrl: z.string().optional(),
    })),
    defaultValues: {
      nameEn: brand?.nameEn || "",
      nameAr: brand?.nameAr || "",
      websiteUrl: brand?.websiteUrl || "",
      logoUrl: brand?.logoUrl || "",
    },
  });

  const createBrand = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch("/api/admin/brands", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: data,
      });
      if (!res.ok) throw new Error("Failed to create brand");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({ title: t("success"), description: "Brand created successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: t("error"), description: "Failed to create brand", variant: "destructive" });
    },
  });

  const updateBrand = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const res = await fetch(`/api/admin/brands/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: data,
      });
      if (!res.ok) throw new Error("Failed to update brand");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({ title: t("success"), description: "Brand updated successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: t("error"), description: "Failed to update brand", variant: "destructive" });
    },
  });

  const onSubmit = (values: z.infer<typeof insertBrandSchema>) => {
    const formData = new FormData();
    formData.append("nameEn", values.nameEn);
    if (values.nameAr) formData.append("nameAr", values.nameAr);
    if (values.websiteUrl) formData.append("websiteUrl", values.websiteUrl);
    if (logoFile) formData.append("logo", logoFile);

    if (brand) {
      updateBrand.mutate({ id: brand.id, data: formData });
    } else {
      createBrand.mutate(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card/95 backdrop-blur-xl border-card-border max-w-2xl">
        <DialogHeader>
          <DialogTitle>{brand ? "Edit Brand" : "Create Brand"}</DialogTitle>
          <DialogDescription>
            {brand ? "Update brand information" : "Add a new brand to the platform"}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nameEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Name (English)</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-brand-name-en" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nameAr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Name (Arabic)</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-brand-name-ar" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." data-testid="input-brand-website" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Logo</FormLabel>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                data-testid="input-brand-logo"
              />
              {brand?.logoUrl && !logoFile && (
                <div className="mt-2">
                  <img src={brand.logoUrl} alt={brand.nameEn} className="w-24 h-24 object-contain rounded border" />
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createBrand.isPending || updateBrand.isPending}
                data-testid="button-cancel-brand"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createBrand.isPending || updateBrand.isPending}
                data-testid="button-save-brand"
              >
                {createBrand.isPending || updateBrand.isPending ? "Saving..." : brand ? "Update Brand" : "Create Brand"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

