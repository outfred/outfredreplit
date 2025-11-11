import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";
import {
  Package,
  Upload,
  BarChart3,
  Settings,
  Plus,
  Eye,
  MousePointerClick,
  RefreshCw,
  Loader2,
  Globe,
  Edit,
  Trash2,
  Save,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function MerchantDashboard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<"products" | "import" | "analytics" | "settings">("products");

  // State for forms
  const [storeName, setStoreName] = useState("");
  const [storeCity, setStoreCity] = useState("");
  const [storeContact, setStoreContact] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Scraper dialog state
  const [scraperOpen, setScraperOpen] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scrapedData, setScrapedData] = useState<any | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());

  // Product dialog state (for create/edit)
  const [productDialog, setProductDialog] = useState<{
    open: boolean;
    product?: Product | null;
    initialData?: {
      title: string;
      description: string;
      price: number;
      images: string[];
    };
  }>({ open: false });

  // Product form state
  const [productForm, setProductForm] = useState({
    title: "",
    description: "",
    price: 0,
    images: [""],
  });

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/merchant/products"],
  });

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<{
    totalProducts: number;
    publishedProducts: number;
    totalViews: number;
    totalClicks: number;
    conversionRate: number;
    revenue: number;
  }>({
    queryKey: ["/api/merchant/analytics"],
    enabled: activeView === "analytics",
  });

  // Fetch merchant profile
  const { data: merchantProfile } = useQuery<{ id: string; name: string; city: string; contact: string }>({
    queryKey: ["/api/merchants/me"],
    enabled: activeView === "settings",
  });

  // Update form when profile loads (useEffect to avoid setState during render)
  useEffect(() => {
    if (merchantProfile && activeView === "settings") {
      setStoreName(merchantProfile.name || "");
      setStoreCity(merchantProfile.city || "");
      setStoreContact(merchantProfile.contact || "");
    }
  }, [merchantProfile, activeView]);

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/analytics"] });
      toast({ title: "Product deleted successfully" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to delete product",
        variant: "destructive"
      });
    },
  });

  // Update merchant profile mutation
  const updateMerchantMutation = useMutation({
    mutationFn: async (data: { name: string; city: string; contact: string }) => {
      return await apiRequest("PATCH", "/api/merchants/me", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchants/me"] });
      toast({ title: "Store settings updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update settings", variant: "destructive" });
    },
  });

  // CSV import mutation
  const importCsvMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/merchant/import/csv", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Import failed");
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/analytics"] });
      toast({ 
        title: `Imported ${data.imported} products`,
        description: data.failed > 0 ? `${data.failed} rows failed` : undefined 
      });
      setCsvFile(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to import CSV", variant: "destructive" });
    },
  });

  // Scrape product mutation
  const scrapeMutation = useMutation({
    mutationFn: async (url: string) => {
      return await apiRequest("POST", "/api/merchant/scrape-product", { url });
    },
    onSuccess: (data: any) => {
      setScrapedData(data);
      toast({ title: "Product scraped successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Scraping failed", 
        description: error.message || "Failed to scrape product",
        variant: "destructive" 
      });
    },
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/products", {
        title: data.title,
        description: data.description,
        priceCents: Math.round(data.price * 100),
        images: data.images.filter((img: string) => img.trim()),
        published: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/analytics"] });
      toast({ title: "Product created successfully!" });
      setProductDialog({ open: false });
      setScrapedData(null);
      setScrapeUrl("");
      setScraperOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create product", variant: "destructive" });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/products/${id}`, {
        title: data.title,
        description: data.description,
        priceCents: Math.round(data.price * 100),
        images: data.images.filter((img: string) => img.trim()),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/products"] });
      toast({ title: "Product updated successfully!" });
      setProductDialog({ open: false });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update product", variant: "destructive" });
    },
  });

  // Handle scrape submit
  const handleScrape = () => {
    if (!scrapeUrl.trim()) {
      toast({ title: "Error", description: "Please enter a URL", variant: "destructive" });
      return;
    }
    scrapeMutation.mutate(scrapeUrl);
  };

  // Handle save scraped product (single product)
  const handleSaveScraped = () => {
    if (!scrapedData || scrapedData.type !== 'single') return;
    setProductForm({
      title: scrapedData.title,
      description: scrapedData.description,
      price: scrapedData.price,
      images: scrapedData.images.length > 0 ? scrapedData.images : [""],
    });
    setProductDialog({ open: true, initialData: scrapedData });
    setScraperOpen(false);
  };

  // Handle import selected products from collection
  const handleImportSelected = async () => {
    if (!scrapedData || scrapedData.type !== 'collection') return;
    if (selectedProducts.size === 0) {
      toast({ title: "Error", description: "Please select at least one product", variant: "destructive" });
      return;
    }

    const productsToImport = scrapedData.products.filter((_: any, idx: number) => 
      selectedProducts.has(idx)
    );

    let successCount = 0;
    let failCount = 0;

    // Show progress toast
    toast({ 
      title: `Importing ${productsToImport.length} products...`,
      description: "Please wait, this may take a moment"
    });

    try {
      for (const product of productsToImport) {
        try {
          await apiRequest("POST", "/api/products", {
            title: product.title,
            description: product.description,
            priceCents: Math.round(product.price * 100),
            images: product.images.filter((img: string) => img?.trim()).length > 0 
              ? product.images.filter((img: string) => img?.trim()) 
              : [],
            published: true,
          });
          successCount++;
        } catch (err) {
          failCount++;
        }
      }
      
      // Invalidate queries after all imports
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/analytics"] });
      
      // Show summary
      if (failCount === 0) {
        toast({ 
          title: `Successfully imported ${successCount} products!`,
          description: "All selected products have been added to your store"
        });
      } else {
        toast({ 
          title: `Imported ${successCount} of ${productsToImport.length} products`,
          description: `${failCount} products failed to import`,
          variant: "destructive"
        });
      }
      
      // Close dialog and reset
      setScraperOpen(false);
      setScrapedData(null);
      setSelectedProducts(new Set());
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to import products", 
        variant: "destructive" 
      });
    }
  };

  // Toggle product selection
  const toggleProductSelection = (index: number) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedProducts(newSelection);
  };

  // Select all products
  const selectAllProducts = () => {
    if (!scrapedData || scrapedData.type !== 'collection') return;
    const allIndices = new Set<number>(scrapedData.products.map((_: any, idx: number) => idx));
    setSelectedProducts(allIndices);
  };

  // Handle open create dialog
  const handleOpenCreate = () => {
    setProductForm({ title: "", description: "", price: 0, images: [""] });
    setProductDialog({ open: true });
  };

  // Handle open edit dialog
  const handleOpenEdit = (product: Product) => {
    setProductForm({
      title: product.title,
      description: product.description || "",
      price: product.priceCents / 100,
      images: product.images.length > 0 ? product.images : [""],
    });
    setProductDialog({ open: true, product });
  };

  // Handle save product
  const handleSaveProduct = () => {
    if (!productForm.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }
    if (productForm.price <= 0) {
      toast({ title: "Error", description: "Price must be greater than 0", variant: "destructive" });
      return;
    }

    if (productDialog.product) {
      updateProductMutation.mutate({ id: productDialog.product.id, data: productForm });
    } else {
      createProductMutation.mutate(productForm);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-4 pb-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t("merchant")} {t("dashboard")}</h1>
          <p className="text-muted-foreground">Manage your products and store</p>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <Button
            variant={activeView === "products" ? "default" : "ghost"}
            onClick={() => setActiveView("products")}
            className="rounded-xl whitespace-nowrap"
            data-testid="button-nav-products"
          >
            <Package className="w-4 h-4 me-2" />
            {t("products")}
          </Button>
          <Button
            variant={activeView === "import" ? "default" : "ghost"}
            onClick={() => setActiveView("import")}
            className="rounded-xl whitespace-nowrap"
            data-testid="button-nav-import"
          >
            <Upload className="w-4 h-4 me-2" />
            {t("importProducts")}
          </Button>
          <Button
            variant={activeView === "analytics" ? "default" : "ghost"}
            onClick={() => setActiveView("analytics")}
            className="rounded-xl whitespace-nowrap"
            data-testid="button-nav-analytics"
          >
            <BarChart3 className="w-4 h-4 me-2" />
            {t("analytics")}
          </Button>
          <Button
            variant={activeView === "settings" ? "default" : "ghost"}
            onClick={() => setActiveView("settings")}
            className="rounded-xl whitespace-nowrap"
            data-testid="button-nav-settings"
          >
            <Settings className="w-4 h-4 me-2" />
            {t("storeSettings")}
          </Button>
        </div>

        {/* Products View */}
        {activeView === "products" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{t("products")}</h2>
              <div className="flex gap-2">
                <GlowButton 
                  variant="glass" 
                  onClick={() => setScraperOpen(true)}
                  data-testid="button-scrape-product"
                >
                  <Globe className="w-4 h-4 me-2" />
                  Scrape from URL
                </GlowButton>
                <GlowButton 
                  variant="primary" 
                  onClick={handleOpenCreate}
                  data-testid="button-add-product"
                >
                  <Plus className="w-4 h-4 me-2" />
                  {t("addProduct")}
                </GlowButton>
              </div>
            </div>

            {productsLoading ? (
              <GlassCard className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading products...</p>
              </GlassCard>
            ) : products.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No products yet"
                description="Add your first product to get started"
                actionLabel={t("addProduct")}
              />
            ) : (
              <GlassCard className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead>Product</TableHead>
                      <TableHead>{t("price")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("views")}</TableHead>
                      <TableHead>{t("clicks")}</TableHead>
                      <TableHead className="text-end">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id} className="border-white/10" data-testid={`row-product-${product.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={product.images[0] || "/placeholder-product.png"}
                              alt={product.title}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <span className="font-medium">{product.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>{(product.priceCents / 100).toFixed(0)} EGP</TableCell>
                        <TableCell>
                          <Badge variant={product.published ? "default" : "secondary"}>
                            {product.published ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell>{product.views}</TableCell>
                        <TableCell>{product.clicks}</TableCell>
                        <TableCell className="text-end">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleOpenEdit(product)}
                              data-testid={`button-edit-${product.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              data-testid={`button-delete-${product.id}`}
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this product?")) {
                                  deleteMutation.mutate(product.id);
                                }
                              }}
                              disabled={deleteMutation.isPending}
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

        {/* Import View */}
        {activeView === "import" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">{t("importProducts")}</h2>
            <GlassCard className="p-8">
              <div className="max-w-2xl mx-auto text-center space-y-6">
                <Upload className="w-16 h-16 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Upload CSV File</h3>
                  <p className="text-muted-foreground">
                    Import products in bulk using a CSV file
                  </p>
                </div>
                <div className="border-2 border-dashed border-white/20 rounded-2xl p-12 hover-elevate transition-all">
                  <input
                    type="file"
                    accept=".csv"
                    className="sr-only"
                    id="csv-upload"
                    data-testid="input-csv-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCsvFile(file);
                        importCsvMutation.mutate(file);
                      }
                    }}
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <GlowButton 
                      variant="primary" 
                      type="button" 
                      onClick={() => document.getElementById("csv-upload")?.click()}
                      disabled={importCsvMutation.isPending}
                      data-testid="button-choose-file"
                    >
                      {importCsvMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
                      {importCsvMutation.isPending ? "Importing..." : "Choose File"}
                    </GlowButton>
                    {csvFile && <p className="text-sm text-muted-foreground">{csvFile.name}</p>}
                    <p className="text-sm text-muted-foreground">or drag and drop</p>
                  </label>
                </div>
                <Button variant="outline" data-testid="button-download-template">
                  Download CSV Template
                </Button>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Analytics View */}
        {activeView === "analytics" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">{t("analytics")}</h2>
            {analyticsLoading ? (
              <GlassCard className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading analytics...</p>
              </GlassCard>
            ) : analytics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">{t("views")}</p>
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-3xl font-bold" data-testid="text-total-views">{analytics.totalViews}</p>
                </GlassCard>
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">{t("clicks")}</p>
                    <MousePointerClick className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-3xl font-bold" data-testid="text-total-clicks">{analytics.totalClicks}</p>
                </GlassCard>
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Conversion</p>
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-3xl font-bold" data-testid="text-conversion-rate">{analytics.conversionRate}%</p>
                </GlassCard>
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <Package className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-3xl font-bold" data-testid="text-revenue">{analytics.revenue} EGP</p>
                </GlassCard>
              </div>
            ) : null}
          </div>
        )}

        {/* Settings View */}
        {activeView === "settings" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">{t("storeSettings")}</h2>
            <GlassCard className="p-6 max-w-2xl">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Store Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Your store name"
                    data-testid="input-store-name"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">City</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Cairo"
                    data-testid="input-city"
                    value={storeCity}
                    onChange={(e) => setStoreCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Contact</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="contact@store.com"
                    data-testid="input-contact"
                    value={storeContact}
                    onChange={(e) => setStoreContact(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full" 
                  data-testid="button-save-store-settings"
                  onClick={() => updateMerchantMutation.mutate({ 
                    name: storeName, 
                    city: storeCity, 
                    contact: storeContact 
                  })}
                  disabled={updateMerchantMutation.isPending}
                >
                  {updateMerchantMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
                  {updateMerchantMutation.isPending ? "Saving..." : t("save")}
                </Button>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Product Scraper Dialog */}
        <Dialog open={scraperOpen} onOpenChange={setScraperOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Import Products from URL</DialogTitle>
              <DialogDescription>
                Enter a product URL or Shopify collection URL to import products
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Product/Collection URL</Label>
                <Input
                  placeholder="https://example.com/collections/all or https://example.com/products/item"
                  value={scrapeUrl}
                  onChange={(e) => setScrapeUrl(e.target.value)}
                  data-testid="input-scrape-url"
                />
                <p className="text-xs text-muted-foreground">
                  Supports: Single products, Shopify collections (/collections/all)
                </p>
              </div>

              <Button
                onClick={handleScrape}
                disabled={scrapeMutation.isPending}
                className="w-full"
                data-testid="button-start-scrape"
              >
                {scrapeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin me-2" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 me-2" />
                    Fetch Products
                  </>
                )}
              </Button>

              {/* Single Product Preview */}
              {scrapedData && scrapedData.type === 'single' && (
                <div className="border border-white/20 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold">Product Found</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Title:</span> {scrapedData.title}
                    </div>
                    <div>
                      <span className="font-medium">Price:</span> {scrapedData.price} EGP
                    </div>
                    <div>
                      <span className="font-medium">Images:</span> {scrapedData.images.length} found
                    </div>
                    {scrapedData.description && (
                      <div>
                        <span className="font-medium">Description:</span>{" "}
                        {scrapedData.description.substring(0, 100)}...
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleSaveScraped}
                    className="w-full"
                    data-testid="button-use-scraped-data"
                  >
                    <Save className="w-4 h-4 me-2" />
                    Add to Products
                  </Button>
                </div>
              )}

              {/* Collection Products List */}
              {scrapedData && scrapedData.type === 'collection' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">
                      Found {scrapedData.count} Products
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={selectAllProducts}
                        data-testid="button-select-all"
                      >
                        Select All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedProducts(new Set())}
                        data-testid="button-deselect-all"
                      >
                        Deselect All
                      </Button>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {scrapedData.products.map((product: any, idx: number) => (
                      <div
                        key={idx}
                        className={`border border-white/20 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover-elevate ${
                          selectedProducts.has(idx) ? 'bg-primary/10 border-primary/30' : ''
                        }`}
                        onClick={() => toggleProductSelection(idx)}
                        data-testid={`product-item-${idx}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(idx)}
                          onChange={() => toggleProductSelection(idx)}
                          className="w-4 h-4"
                          data-testid={`checkbox-product-${idx}`}
                        />
                        <img
                          src={product.images[0] || "/placeholder-product.png"}
                          alt={product.title}
                          className="w-16 h-16 rounded object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{product.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.price} EGP • {product.images.length} images
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <p className="text-sm text-muted-foreground mb-3">
                      {selectedProducts.size} of {scrapedData.count} products selected
                    </p>
                    <Button
                      onClick={handleImportSelected}
                      disabled={selectedProducts.size === 0 || createProductMutation.isPending}
                      className="w-full"
                      data-testid="button-import-selected"
                    >
                      {createProductMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin me-2" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 me-2" />
                          Import Selected ({selectedProducts.size})
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Product Create/Edit Dialog */}
        <Dialog open={productDialog.open} onOpenChange={(open) => setProductDialog({ open })}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {productDialog.product ? "Edit Product" : "Create Product"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  placeholder="Product title"
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  data-testid="input-product-title"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Product description"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={4}
                  data-testid="input-product-description"
                />
              </div>

              <div className="space-y-2">
                <Label>Price (EGP) *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                  data-testid="input-product-price"
                />
              </div>

              <div className="space-y-2">
                <Label>Images (URLs)</Label>
                {productForm.images.map((img, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={img}
                      onChange={(e) => {
                        const newImages = [...productForm.images];
                        newImages[idx] = e.target.value;
                        setProductForm({ ...productForm, images: newImages });
                      }}
                      data-testid={`input-product-image-${idx}`}
                    />
                    {idx === productForm.images.length - 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setProductForm({ ...productForm, images: [...productForm.images, ""] })}
                        data-testid="button-add-image"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setProductDialog({ open: false })}
                data-testid="button-cancel-product"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProduct}
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
                data-testid="button-save-product"
              >
                {(createProductMutation.isPending || updateProductMutation.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 me-2" />
                    Save Product
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
