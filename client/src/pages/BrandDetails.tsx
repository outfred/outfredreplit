import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { GlassCard } from "@/components/ui/glass-card";
import { ProductTile } from "@/components/ui/product-tile";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Globe, Mail, Instagram, Facebook, Twitter, Youtube, Linkedin } from "lucide-react";
import { SiTiktok } from "react-icons/si";
import type { Brand, ProductSummary } from "@shared/schema";

const SocialIcon = ({ platform }: { platform: string }) => {
  const iconProps = { className: "w-5 h-5" };
  switch (platform) {
    case "instagram": return <Instagram {...iconProps} />;
    case "facebook": return <Facebook {...iconProps} />;
    case "twitter": return <Twitter {...iconProps} />;
    case "tiktok": return <SiTiktok {...iconProps} />;
    case "youtube": return <Youtube {...iconProps} />;
    case "linkedin": return <Linkedin {...iconProps} />;
    default: return null;
  }
};

export default function BrandDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { language } = useLanguage();

  const { data: brand, isLoading: brandLoading } = useQuery<Brand>({
    queryKey: ["/api/brands", id],
    enabled: !!id,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<ProductSummary[]>({
    queryKey: ["/api/products/summary", { brandId: id }],
    enabled: !!id,
  });

  if (brandLoading) {
    return (
      <div className="min-h-screen pt-24 px-4 pb-12">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-64 w-full mb-8 rounded-2xl" />
          <Skeleton className="h-12 w-1/3 mb-4" />
          <Skeleton className="h-24 w-full mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <EmptyState
          icon={Globe}
          title={language === "ar" ? "العلامة التجارية غير موجودة" : "Brand not found"}
          description={language === "ar" ? "لم نتمكن من العثور على هذه العلامة التجارية" : "We couldn't find this brand"}
        />
      </div>
    );
  }

  const brandName = language === "ar" ? brand.nameAr || brand.nameEn : brand.nameEn;
  const brandDescription = language === "ar" ? brand.descriptionAr || brand.descriptionEn : brand.descriptionEn;

  return (
    <div className="min-h-screen pt-24 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Brand Header */}
        <GlassCard className="mb-12 overflow-hidden">
          {/* Cover Image */}
          {brand.coverUrl && (
            <div className="h-64 w-full overflow-hidden">
              <img
                src={brand.coverUrl}
                alt={brandName}
                className="w-full h-full object-cover"
                data-testid="img-brand-cover"
              />
            </div>
          )}

          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Logo */}
              {brand.logoUrl && (
                <div className="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-white/10 p-4">
                  <img
                    src={brand.logoUrl}
                    alt={brandName}
                    className="w-full h-full object-contain"
                    data-testid="img-brand-logo"
                  />
                </div>
              )}

              <div className="flex-1 space-y-4">
                {/* Brand Name */}
                <h1 className="text-4xl md:text-5xl font-bold" data-testid="text-brand-name">
                  {brandName}
                </h1>

                {/* Description */}
                {brandDescription && (
                  <p className="text-lg text-muted-foreground" data-testid="text-brand-description">
                    {brandDescription}
                  </p>
                )}

                {/* Contact Info */}
                <div className="flex flex-wrap gap-3">
                  {brand.websiteUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      data-testid="button-brand-website"
                    >
                      <a href={brand.websiteUrl} target="_blank" rel="noopener noreferrer">
                        <Globe className="w-4 h-4 mr-2" />
                        {language === "ar" ? "الموقع الإلكتروني" : "Website"}
                      </a>
                    </Button>
                  )}

                  {brand.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      data-testid="button-brand-email"
                    >
                      <a href={`mailto:${brand.email}`}>
                        <Mail className="w-4 h-4 mr-2" />
                        {language === "ar" ? "البريد الإلكتروني" : "Email"}
                      </a>
                    </Button>
                  )}

                  {/* Social Media Links */}
                  {brand.socials && Object.entries(brand.socials).map(([platform, url]) => 
                    url ? (
                      <Button
                        key={platform}
                        variant="outline"
                        size="sm"
                        asChild
                        data-testid={`button-social-${platform}`}
                      >
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <SocialIcon platform={platform} />
                          <span className="ml-2 capitalize">{platform}</span>
                        </a>
                      </Button>
                    ) : null
                  )}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Products Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6">
            {language === "ar" ? "المنتجات" : "Products"}
          </h2>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3" data-testid={`skeleton-product-${i}`}>
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Globe}
            title={language === "ar" ? "لا توجد منتجات" : "No products"}
            description={language === "ar" ? "لا توجد منتجات لهذه العلامة التجارية حالياً" : "No products available for this brand yet"}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductTile
                key={product.id}
                {...product}
                onClick={() => setLocation(`/product/${product.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
