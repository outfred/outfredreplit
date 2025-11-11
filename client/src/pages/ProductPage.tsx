import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { ProductTile } from "@/components/ui/product-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Share2, Store, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Product, ProductSummary, Brand } from "@shared/schema";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function ProductPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const [, setLocation] = useLocation();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Fetch product data
  const { data: product, isLoading: productLoading, error: productError } = useQuery<Product>({
    queryKey: ["/api/products", params.id],
  });

  // Fetch brand data
  const { data: brand } = useQuery<Brand>({
    queryKey: ["/api/brands", product?.brandId],
    enabled: !!product?.brandId,
  });

  // Fetch related products from same brand
  const { data: relatedProductsRaw } = useQuery<ProductSummary[]>({
    queryKey: [`/api/products/summary?brandId=${product?.brandId}&published=true`],
    enabled: !!product?.brandId,
  });

  // Filter out current product and limit to 3
  const relatedProducts = (relatedProductsRaw ?? []).filter((p) => p.id !== params.id).slice(0, 3);

  // Check favorite status (only when authenticated)
  const { data: favoriteStatus } = useQuery<{ isFavorite: boolean }>({
    queryKey: ["/api/favorites", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/favorites/${params.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to check favorite");
      return res.json();
    },
    enabled: !!user && !!params.id,
  });

  const isFavorite = favoriteStatus?.isFavorite || false;

  // Add to favorites mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/favorites", { productId: params.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: language === "ar" ? "تمت الإضافة إلى المفضلة" : "Added to favorites",
      });
    },
    onError: () => {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "فشلت إضافة المنتج إلى المفضلة" : "Failed to add to favorites",
        variant: "destructive",
      });
    },
  });

  // Remove from favorites mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/favorites/${params.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: language === "ar" ? "تمت الإزالة من المفضلة" : "Removed from favorites",
      });
    },
    onError: () => {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "فشلت إزالة المنتج من المفضلة" : "Failed to remove from favorites",
        variant: "destructive",
      });
    },
  });

  // Handle favorite toggle
  const handleFavoriteToggle = () => {
    if (!user) {
      toast({
        title: language === "ar" ? "يرجى تسجيل الدخول" : "Please login",
        description: language === "ar" ? "يجب تسجيل الدخول لحفظ المفضلة" : "You need to login to save favorites",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    if (isFavorite) {
      removeFavoriteMutation.mutate();
    } else {
      addFavoriteMutation.mutate();
    }
  };

  // Handle share
  const handleShare = async () => {
    const shareData = {
      title: product?.title || "Product",
      text: `${product?.title}${brand?.nameEn ? ` by ${brand.nameEn}` : ""} - ${((product?.priceCents || 0) / 100).toFixed(2)} ${product?.currency || "EGP"}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: language === "ar" ? "تمت المشاركة" : "Shared successfully",
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: language === "ar" ? "تم نسخ الرابط" : "Link copied",
          description: language === "ar" ? "تم نسخ رابط المنتج إلى الحافظة" : "Product link copied to clipboard",
        });
      } else {
        throw new Error("Share not supported");
      }
    } catch (error) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "فشلت عملية المشاركة" : "Failed to share",
        variant: "destructive",
      });
    }
  };

  if (productLoading) {
    return (
      <div className="min-h-screen pt-24 px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Skeleton className="aspect-square rounded-2xl" />
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-2xl" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="min-h-screen pt-24 px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <GlassCard className="p-8 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold">Product Not Found</h2>
            <p className="text-muted-foreground">The product you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation("/")} data-testid="button-back-home">
              Back to Home
            </Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  const displayProduct = {
    ...product,
    price: product.priceCents / 100,
    brandName: brand?.name || null,
  };

  const hasImages = displayProduct.images && displayProduct.images.length > 0;

  return (
    <div className="min-h-screen pt-24 px-4 pb-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Images */}
          <div className="space-y-4">
            <GlassCard className="aspect-square overflow-hidden p-0">
              {hasImages ? (
                <img
                  src={displayProduct.images[selectedImage]}
                  alt={displayProduct.title}
                  className="w-full h-full object-cover"
                  data-testid="img-product-main"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <p className="text-muted-foreground">No image available</p>
                </div>
              )}
            </GlassCard>
            {hasImages && (
              <div className="grid grid-cols-4 gap-4">
                {displayProduct.images.map((img, idx) => (
                  <GlassCard
                    key={idx}
                    className={cn(
                      "aspect-square overflow-hidden cursor-pointer p-0",
                      selectedImage === idx && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedImage(idx)}
                    data-testid={`img-thumbnail-${idx}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </GlassCard>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              {displayProduct.brandName && (
                <Badge variant="secondary" className="mb-2" data-testid="badge-brand">
                  {displayProduct.brandName}
                </Badge>
              )}
              <h1 className="text-4xl font-bold mb-2" data-testid="text-product-title">
                {displayProduct.title}
              </h1>
              <p className="text-3xl font-bold text-primary" data-testid="text-product-price">
                {displayProduct.price.toLocaleString()} {displayProduct.currency}
              </p>
            </div>

            {displayProduct.description && (
              <p className="text-muted-foreground" data-testid="text-product-description">
                {displayProduct.description}
              </p>
            )}

            {/* Color Selection */}
            {displayProduct.colors && displayProduct.colors.length > 0 && (
              <div className="space-y-3">
                <Label>{t("color")}</Label>
                <div className="flex gap-2 flex-wrap">
                  {displayProduct.colors.map((color) => (
                    <Button
                      key={color}
                      variant={selectedColor === color ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedColor(color)}
                      className="rounded-xl"
                      data-testid={`button-color-${color}`}
                    >
                      {color}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {displayProduct.sizes && displayProduct.sizes.length > 0 && (
              <div className="space-y-3">
                <Label>{t("size")}</Label>
                <div className="flex gap-2 flex-wrap">
                  {displayProduct.sizes.map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedSize(size)}
                      className="rounded-xl min-w-12"
                      data-testid={`button-size-${size}`}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <GlowButton
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={handleFavoriteToggle}
                disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                data-testid="button-add-favorite"
              >
                {(addFavoriteMutation.isPending || removeFavoriteMutation.isPending) ? (
                  <Loader2 className="w-5 h-5 me-2 animate-spin" />
                ) : (
                  <Heart className={cn("w-5 h-5 me-2", isFavorite && "fill-current")} />
                )}
                {isFavorite ? t("removeFromFavorites") : t("addToFavorites")}
              </GlowButton>
              <Button 
                size="icon" 
                variant="outline" 
                className="rounded-2xl h-12 w-12" 
                onClick={handleShare}
                data-testid="button-share"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Tags */}
            {displayProduct.tags && displayProduct.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {displayProduct.tags.map((tag) => (
                  <Badge key={tag} variant="outline" data-testid={`badge-tag-${tag}`}>
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold mb-8">{t("relatedProducts")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((product) => (
                <ProductTile
                  key={product.id}
                  {...product}
                  onClick={() => setLocation(`/product/${product.id}`)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

