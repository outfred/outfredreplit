import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Package,
  Upload,
  BarChart3,
  Settings,
  Plus,
  Eye,
  MousePointerClick,
  RefreshCw,
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

export default function MerchantDashboard() {
  const { t } = useLanguage();
  const [activeView, setActiveView] = useState<"products" | "import" | "analytics" | "settings">("products");

  // Mock data
  const products = [
    {
      id: "1",
      title: "Black Hoodie",
      price: 799,
      published: true,
      views: 245,
      clicks: 32,
      image: "/placeholder-product.png",
    },
    {
      id: "2",
      title: "Blue Jeans",
      price: 899,
      published: true,
      views: 189,
      clicks: 24,
      image: "/placeholder-product.png",
    },
  ];

  const analytics = {
    totalViews: 434,
    totalClicks: 56,
    conversionRate: 12.9,
    revenue: 0,
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
                <GlowButton variant="glass" data-testid="button-reindex">
                  <RefreshCw className="w-4 h-4 me-2" />
                  {t("reindexProducts")}
                </GlowButton>
                <GlowButton variant="primary" data-testid="button-add-product">
                  <Plus className="w-4 h-4 me-2" />
                  {t("addProduct")}
                </GlowButton>
              </div>
            </div>

            {products.length === 0 ? (
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
                              src={product.image}
                              alt={product.title}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <span className="font-medium">{product.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>{product.price} EGP</TableCell>
                        <TableCell>
                          <Badge variant={product.published ? "default" : "secondary"}>
                            {product.published ? t("active") : t("pending")}
                          </Badge>
                        </TableCell>
                        <TableCell>{product.views}</TableCell>
                        <TableCell>{product.clicks}</TableCell>
                        <TableCell className="text-end">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" data-testid={`button-edit-${product.id}`}>
                              {t("edit")}
                            </Button>
                            <Button size="sm" variant="ghost" data-testid={`button-delete-${product.id}`}>
                              {t("delete")}
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
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <GlowButton variant="primary" type="button" onClick={() => document.getElementById("csv-upload")?.click()}>
                      Choose File
                    </GlowButton>
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
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">City</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Cairo"
                    data-testid="input-city"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Contact</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="contact@store.com"
                    data-testid="input-contact"
                  />
                </div>
                <Button className="w-full" data-testid="button-save-store-settings">
                  {t("save")}
                </Button>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
