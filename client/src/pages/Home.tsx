import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { SearchBar } from "@/components/ui/search-bar";
import { ProductTile } from "@/components/ui/product-tile";
import { BrandBadge } from "@/components/ui/brand-badge";
import { GlassCard } from "@/components/ui/glass-card";
import { Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { ProductSummary, Brand } from "@shared/schema";

export default function Home() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const handleSearch = (query: string) => {
    setLocation(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleImageSearch = (file: File) => {
    console.log("Image search:", file);
  };

  const { data: brands, isLoading: brandsLoading, error: brandsError, refetch: refetchBrands } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const { data: products, isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useQuery<ProductSummary[]>({
    queryKey: ["/api/products/summary"],
  });

  const featuredProducts = products?.slice(0, 8) || [];
  const trendingBrands = brands?.slice(0, 6) || [];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-background z-0" />
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-5" />
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Sparkles className="w-6 h-6" />
              <span className="text-sm font-semibold uppercase tracking-wider">
                AI-Powered Fashion
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                {t("heroTitle")}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              {t("heroSubtitle")}
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <SearchBar
              placeholder={t("searchPlaceholder")}
              onSearch={handleSearch}
              onImageUpload={handleImageSearch}
              data-testid="search-bar-hero"
            />
          </div>
        </div>
      </div>

      {/* Trending Brands */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center gap-2 mb-8">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h2 className="text-3xl font-bold">{t("trendingBrands")}</h2>
        </div>
        
        {brandsError ? (
          <GlassCard className="p-8 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <p className="text-muted-foreground">{t("errorLoadingBrands")}</p>
            <Button onClick={() => refetchBrands()} variant="outline" data-testid="button-retry-brands">
              {t("retry")}
            </Button>
          </GlassCard>
        ) : brandsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" data-testid={`skeleton-brand-${i}`} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingBrands.map((brand) => (
              <BrandBadge
                key={brand.id}
                {...brand}
                onClick={() => setLocation(`/search?brand=${brand.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8">{t("featuredProducts")}</h2>
        
        {productsError ? (
          <GlassCard className="p-8 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <p className="text-muted-foreground">{t("errorLoadingProducts")}</p>
            <Button onClick={() => refetchProducts()} variant="outline" data-testid="button-retry-products">
              {t("retry")}
            </Button>
          </GlassCard>
        ) : productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3" data-testid={`skeleton-product-${i}`}>
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductTile
                key={product.id}
                {...product}
                onClick={() => setLocation(`/product/${product.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8">{t("categories")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Hoodies", "T-Shirts", "Jeans", "Jackets"].map((category) => (
            <GlassCard
              key={category}
              variant="hover"
              className="aspect-square flex items-center justify-center cursor-pointer"
              onClick={() => setLocation(`/search?category=${category}`)}
              data-testid={`card-category-${category.toLowerCase()}`}
            >
              <h3 className="text-xl font-semibold">{category}</h3>
            </GlassCard>
          ))}
        </div>
      </section>
    </div>
  );
}
