import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/ui/glass-card";
import { FavoriteProductTile } from "@/components/ui/favorite-product-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Package, Settings as SettingsIcon, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductSummary } from "@shared/schema";

export default function Profile() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("favorites");

  // Fetch user's favorites from API (cache isolated by user ID)
  const { data: favoritesData, isLoading: favoritesLoading } = useQuery<ProductSummary[]>({
    queryKey: ["/api/favorites", user?.id],
    enabled: !!user,
  });
  
  // Ensure favorites is always an array (defensive check)
  const favorites = Array.isArray(favoritesData) ? favoritesData : [];

  const outfits = [];
  const orders = [];

  return (
    <div className="min-h-screen pt-24 px-4 pb-16">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <GlassCard className="p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1" data-testid="text-profile-name">
                {user?.name || "User"}
              </h1>
              <p className="text-muted-foreground" data-testid="text-profile-email">
                {user?.email || ""}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8 bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10">
            <TabsTrigger value="favorites" data-testid="tab-favorites">
              <Heart className="w-4 h-4 me-2" />
              {t("favorites")}
            </TabsTrigger>
            <TabsTrigger value="outfits" data-testid="tab-outfits">
              <Package className="w-4 h-4 me-2" />
              {t("myOutfits")}
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">
              <Package className="w-4 h-4 me-2" />
              {t("orders")}
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <SettingsIcon className="w-4 h-4 me-2" />
              {t("settings")}
            </TabsTrigger>
          </TabsList>

          {/* Favorites */}
          <TabsContent value="favorites">
            {favoritesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <GlassCard key={i} className="p-4">
                    <Skeleton className="aspect-square rounded-xl mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </GlassCard>
                ))}
              </div>
            ) : favorites.length === 0 ? (
              <EmptyState
                icon={Heart}
                title={language === "ar" ? "لا توجد مفضلات" : "No favorites yet"}
                description={language === "ar" ? "ابدأ بإضافة المنتجات إلى المفضلة" : "Start adding products to your favorites"}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {favorites.map((product) => (
                  <FavoriteProductTile 
                    key={product.id} 
                    id={product.id}
                    title={product.title}
                    price={product.price}
                    images={product.images}
                    brandName={product.brandName || undefined}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Outfits */}
          <TabsContent value="outfits">
            {outfits.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No outfits yet"
                description="Create your first outfit in the Outfit Builder"
                actionLabel="Create Outfit"
                onAction={() => window.location.href = "/outfit-builder"}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Outfits will be displayed here */}
              </div>
            )}
          </TabsContent>

          {/* Orders */}
          <TabsContent value="orders">
            <EmptyState
              icon={Package}
              title="No orders yet"
              description="Your order history will appear here"
            />
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <GlassCard className="p-6 max-w-2xl">
              <h2 className="text-2xl font-bold mb-6">{t("settings")}</h2>
              
              <div className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">{t("name")}</Label>
                  <Input id="name" defaultValue="John Doe" data-testid="input-name" />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input id="email" type="email" defaultValue="john@example.com" data-testid="input-email" />
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <Label htmlFor="language">{t("language")}</Label>
                  <Select value={language} onValueChange={(val) => setLanguage(val as "en" | "ar")}>
                    <SelectTrigger id="language" data-testid="select-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover/95 backdrop-blur-xl border-popover-border">
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Theme */}
                <div className="space-y-2">
                  <Label htmlFor="theme">{t("theme")}</Label>
                  <Select value={theme} onValueChange={(val) => setTheme(val as "light" | "dark")}>
                    <SelectTrigger id="theme" data-testid="select-theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover/95 backdrop-blur-xl border-popover-border">
                      <SelectItem value="light">{t("light")}</SelectItem>
                      <SelectItem value="dark">{t("dark")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" data-testid="button-save-settings">
                  {t("save")}
                </Button>
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
