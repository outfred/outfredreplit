import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  Download,
  ImagePlus,
  X,
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Zod schemas for settings form
const storeSettingsSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  city: z.string().min(1, "City is required"),
  contact: z.string().optional().or(z.literal("")),
  socials: z.object({
    instagram: z.string().url().or(z.literal("")).optional(),
    facebook: z.string().url().or(z.literal("")).optional(),
    twitter: z.string().url().or(z.literal("")).optional(),
    tiktok: z.string().url().or(z.literal("")).optional(),
    youtube: z.string().url().or(z.literal("")).optional(),
    linkedin: z.string().url().or(z.literal("")).optional(),
    website: z.string().url().or(z.literal("")).optional(),
  }).optional(),
});

type StoreSettingsForm = z.infer<typeof storeSettingsSchema>;

export default function MerchantDashboard() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<"products" | "import" | "analytics" | "settings">("products");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);

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

  // Fetch merchant profile (always load for imports and settings)
  const { data: merchantProfile } = useQuery<{ 
    id: string; 
    name: string; 
    city: string; 
    contact?: string;
    logoUrl?: string;
    socials?: {
      instagram?: string;
      facebook?: string;
      twitter?: string;
      tiktok?: string;
      youtube?: string;
      linkedin?: string;
      website?: string;
    };
  }>({
    queryKey: ["/api/merchants/me"],
  });

  // Initialize form with merchant profile data
  const form = useForm<StoreSettingsForm>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      name: "",
      city: "",
      contact: "",
      socials: {
        instagram: "",
        facebook: "",
        twitter: "",
        tiktok: "",
        youtube: "",
        linkedin: "",
        website: "",
      },
    },
  });

  // Update form when profile loads
  useEffect(() => {
    if (merchantProfile) {
      form.reset({
        name: merchantProfile.name || "",
        city: merchantProfile.city || "",
        contact: merchantProfile.contact || "",
        socials: {
          instagram: merchantProfile.socials?.instagram || "",
          facebook: merchantProfile.socials?.facebook || "",
          twitter: merchantProfile.socials?.twitter || "",
          tiktok: merchantProfile.socials?.tiktok || "",
          youtube: merchantProfile.socials?.youtube || "",
          linkedin: merchantProfile.socials?.linkedin || "",
          website: merchantProfile.socials?.website || "",
        },
      });
      setStoreName(merchantProfile.name || "");
      setStoreCity(merchantProfile.city || "");
      setStoreContact(merchantProfile.contact || "");
    }
  }, [merchantProfile, form]);

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/analytics"] });
      if (merchantProfile?.id) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/products/summary", { merchantId: merchantProfile.id }] 
        });
      }
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
    mutationFn: async (data: StoreSettingsForm) => {
      return await apiRequest("PATCH", "/api/merchants/me", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchants/me"] });
      toast({ 
        title: language === "ar" ? "تم تحديث إعدادات المتجر بنجاح" : "Store settings updated successfully" 
      });
    },
    onError: () => {
      toast({ 
        title: language === "ar" ? "خطأ" : "Error", 
        description: language === "ar" ? "فشل تحديث الإعدادات" : "Failed to update settings", 
        variant: "destructive" 
      });
    },
  });

  // Upload merchant logo mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);
      const response = await fetch("/api/merchants/me/logo", {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Logo upload failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchants/me"] });
      setSelectedLogoFile(null);
      setLogoPreview(null);
      toast({ 
        title: language === "ar" ? "تم رفع الشعار بنجاح" : "Logo uploaded successfully" 
      });
    },
    onError: () => {
      toast({ 
        title: language === "ar" ? "خطأ" : "Error", 
        description: language === "ar" ? "فشل رفع الشعار" : "Failed to upload logo", 
        variant: "destructive" 
      });
    },
  });

  // Remove merchant logo mutation
  const removeLogoMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", "/api/merchants/me", { logoUrl: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchants/me"] });
      setLogoPreview(null);
      setSelectedLogoFile(null);
      toast({ 
        title: language === "ar" ? "تم حذف الشعار بنجاح" : "Logo removed successfully" 
      });
    },
    onError: () => {
      toast({ 
        title: language === "ar" ? "خطأ" : "Error", 
        description: language === "ar" ? "فشل حذف الشعار" : "Failed to remove logo", 
        variant: "destructive" 
      });
    },
  });

  // Handle logo file selection
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle logo upload
  const handleLogoUpload = () => {
    if (selectedLogoFile) {
      uploadLogoMutation.mutate(selectedLogoFile);
    }
  };

  // Handle settings form submission
  const onSubmitSettings = (data: StoreSettingsForm) => {
    updateMerchantMutation.mutate(data);
  };

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
      if (merchantProfile?.id) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/products/summary", { merchantId: merchantProfile.id }] 
        });
      }
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
      const response = await apiRequest("POST", "/api/merchant/scrape-product", { url });
      return await response.json();
    },
    onSuccess: (data: any) => {
      setScrapedData(data);
      if (data.type === 'collection') {
        toast({ 
          title: `Found ${data.count} products!`,
          description: "Select products to import"
        });
      } else {
        toast({ title: "Product scraped successfully!" });
      }
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
      if (merchantProfile?.id) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/products/summary", { merchantId: merchantProfile.id }] 
        });
      }
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
      if (merchantProfile?.id) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/products/summary", { merchantId: merchantProfile.id }] 
        });
      }
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

    // Get merchant ID
    if (!merchantProfile?.id) {
      toast({ title: "Error", description: "Merchant profile not found", variant: "destructive" });
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
          // Filter and validate images
          const validImages = (product.images || [])
            .filter((img: string) => img && typeof img === 'string' && img.trim())
            .map((img: string) => img.trim());
          
          // Skip products without valid images
          if (validImages.length === 0) {
            console.log(`Skipping product "${product.title}" - no valid images`);
            failCount++;
            continue;
          }
          
          const payload = {
            merchantId: merchantProfile.id,
            title: product.title || 'Untitled',
            description: product.description || '',
            priceCents: Math.round((product.price || 0) * 100),
            images: validImages,
            published: true,
          };
          
          console.log('Sending product:', payload);
          await apiRequest("POST", "/api/products", payload);
          successCount++;
        } catch (err: any) {
          console.error(`Failed to import "${product.title}":`, err?.message || err);
          failCount++;
        }
      }
      
      // Invalidate queries after all imports
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/analytics"] });
      if (merchantProfile?.id) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/products/summary", { merchantId: merchantProfile.id }] 
        });
      }
      
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
              <GlowButton 
                variant="primary" 
                onClick={handleOpenCreate}
                data-testid="button-add-product"
              >
                <Plus className="w-4 h-4 me-2" />
                {t("addProduct")}
              </GlowButton>
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
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">{t("importProducts")}</h2>
            
            {/* URL/Shopify Import */}
            <GlassCard className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Import from URL</h3>
                <p className="text-muted-foreground text-sm">
                  Import from product URLs or Shopify collections
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://yourwebsite.com/collections/all"
                    value={scrapeUrl}
                    onChange={(e) => setScrapeUrl(e.target.value)}
                    data-testid="input-url-import"
                    className="flex-1"
                  />
                  <GlowButton
                    variant="primary"
                    onClick={handleScrape}
                    disabled={scrapeMutation.isPending || !scrapeUrl.trim()}
                    data-testid="button-fetch-url"
                  >
                    {scrapeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin me-2" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4 me-2" />
                        Fetch Products
                      </>
                    )}
                  </GlowButton>
                </div>

                {/* Single Product */}
                {scrapedData && scrapedData.type === 'single' && (
                  <div className="border border-white/20 rounded-xl p-4 space-y-3 bg-white/5">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" />
                      <h4 className="font-semibold">Product Found</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Title:</span>
                        <p className="font-medium">{scrapedData.title}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Price:</span>
                        <p className="font-medium">{scrapedData.price} EGP</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Images:</span>
                        <p className="font-medium">{scrapedData.images.length} found</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleSaveScraped}
                      className="w-full"
                      data-testid="button-add-scraped"
                    >
                      <Plus className="w-4 h-4 me-2" />
                      Add to Products
                    </Button>
                  </div>
                )}

                {/* Collection Products */}
                {scrapedData && scrapedData.type === 'collection' && (
                  <div className="border border-white/20 rounded-xl p-4 space-y-4 bg-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary" />
                        <h4 className="font-semibold">Found {scrapedData.count} Products</h4>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={selectAllProducts}
                          data-testid="button-select-all-url"
                        >
                          Select All
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedProducts(new Set())}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2">
                      {scrapedData.products.map((product: any, idx: number) => (
                        <div
                          key={idx}
                          className={`border border-white/20 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover-elevate ${
                            selectedProducts.has(idx) ? 'bg-primary/20 border-primary/50' : 'bg-white/5'
                          }`}
                          onClick={() => toggleProductSelection(idx)}
                          data-testid={`url-product-${idx}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(idx)}
                            onChange={() => toggleProductSelection(idx)}
                            className="w-4 h-4"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <img
                            src={product.images[0] || "/placeholder-product.png"}
                            alt={product.title}
                            className="w-14 h-14 rounded object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{product.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.price} EGP • {product.images.length} img
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <p className="text-sm text-muted-foreground">
                        {selectedProducts.size} selected
                      </p>
                      <Button
                        onClick={handleImportSelected}
                        disabled={selectedProducts.size === 0}
                        data-testid="button-import-url-selected"
                      >
                        <Save className="w-4 h-4 me-2" />
                        Import ({selectedProducts.size})
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* CSV Import */}
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
                  <Download className="w-4 h-4 me-2" />
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
            <h2 className="text-2xl font-bold mb-6">
              {language === "ar" ? "إعدادات المتجر" : "Store Settings"}
            </h2>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitSettings)} className="space-y-6">
                {/* Two-column layout for cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Card 1: Store Details + Logo */}
                  <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      {language === "ar" ? "معلومات المتجر" : "Store Information"}
                    </h3>
                    
                    {/* Logo Upload Section */}
                    <div className="mb-6">
                      <Label className="mb-2 block">
                        {language === "ar" ? "شعار المتجر" : "Store Logo"}
                      </Label>
                      <div className="flex items-center gap-4">
                        <Avatar className="w-20 h-20">
                          <AvatarImage 
                            src={logoPreview || merchantProfile?.logoUrl || ""} 
                            alt="Store logo" 
                          />
                          <AvatarFallback className="bg-primary/10">
                            <ImagePlus className="w-8 h-8 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoSelect}
                            data-testid="input-logo-file"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            data-testid="button-select-logo"
                          >
                            <Upload className="w-4 h-4 me-2" />
                            {language === "ar" ? "اختر شعار" : "Select Logo"}
                          </Button>
                          {selectedLogoFile && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleLogoUpload}
                              disabled={uploadLogoMutation.isPending}
                              data-testid="button-upload-logo"
                            >
                              {uploadLogoMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin me-2" />
                              ) : (
                                <Save className="w-4 h-4 me-2" />
                              )}
                              {uploadLogoMutation.isPending 
                                ? (language === "ar" ? "جاري الرفع..." : "Uploading...")
                                : (language === "ar" ? "رفع الشعار" : "Upload Logo")
                              }
                            </Button>
                          )}
                          {(merchantProfile?.logoUrl || logoPreview) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLogoMutation.mutate()}
                              disabled={removeLogoMutation.isPending}
                              data-testid="button-remove-logo"
                            >
                              <X className="w-4 h-4 me-2" />
                              {language === "ar" ? "حذف الشعار" : "Remove Logo"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Store Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>
                            {language === "ar" ? "اسم المتجر" : "Store Name"}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder={language === "ar" ? "اسم متجرك" : "Your store name"}
                              data-testid="input-store-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* City */}
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>
                            {language === "ar" ? "المدينة" : "City"}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder={language === "ar" ? "القاهرة" : "Cairo"}
                              data-testid="input-city"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Contact */}
                    <FormField
                      control={form.control}
                      name="contact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language === "ar" ? "معلومات الاتصال" : "Contact"}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="contact@store.com"
                              data-testid="input-contact"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </GlassCard>

                  {/* Card 2: Social Links */}
                  <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      {language === "ar" ? "روابط التواصل الاجتماعي" : "Social Media Links"}
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Instagram */}
                      <FormField
                        control={form.control}
                        name="socials.instagram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {language === "ar" ? "إنستجرام" : "Instagram"}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="https://instagram.com/yourstore"
                                data-testid="input-instagram"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Facebook */}
                      <FormField
                        control={form.control}
                        name="socials.facebook"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {language === "ar" ? "فيسبوك" : "Facebook"}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="https://facebook.com/yourstore"
                                data-testid="input-facebook"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Twitter */}
                      <FormField
                        control={form.control}
                        name="socials.twitter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {language === "ar" ? "تويتر" : "Twitter"}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="https://twitter.com/yourstore"
                                data-testid="input-twitter"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* TikTok */}
                      <FormField
                        control={form.control}
                        name="socials.tiktok"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {language === "ar" ? "تيك توك" : "TikTok"}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="https://tiktok.com/@yourstore"
                                data-testid="input-tiktok"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* YouTube */}
                      <FormField
                        control={form.control}
                        name="socials.youtube"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {language === "ar" ? "يوتيوب" : "YouTube"}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="https://youtube.com/@yourstore"
                                data-testid="input-youtube"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* LinkedIn */}
                      <FormField
                        control={form.control}
                        name="socials.linkedin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {language === "ar" ? "لينكد إن" : "LinkedIn"}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="https://linkedin.com/company/yourstore"
                                data-testid="input-linkedin"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Website */}
                      <FormField
                        control={form.control}
                        name="socials.website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {language === "ar" ? "الموقع الإلكتروني" : "Website"}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="https://yourwebsite.com"
                                data-testid="input-website"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </GlassCard>
                </div>

                {/* Save Button */}
                <Button 
                  type="submit" 
                  className="w-full lg:w-auto" 
                  data-testid="button-save-store-settings"
                  disabled={updateMerchantMutation.isPending}
                >
                  {updateMerchantMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin me-2" />
                  ) : (
                    <Save className="w-4 h-4 me-2" />
                  )}
                  {updateMerchantMutation.isPending 
                    ? (language === "ar" ? "جاري الحفظ..." : "Saving...") 
                    : (language === "ar" ? "حفظ الإعدادات" : "Save Settings")
                  }
                </Button>
              </form>
            </Form>
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
