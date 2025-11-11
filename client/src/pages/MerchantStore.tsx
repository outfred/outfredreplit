import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProductTile } from "@/components/ui/product-tile";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductSummary } from "@shared/schema";
import {
  Store,
  MapPin,
  Mail,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
} from "lucide-react";
import { SiTiktok } from "react-icons/si";
import { Button } from "@/components/ui/button";

interface Merchant {
  id: string;
  name: string;
  city: string;
  contact?: string;
  logoUrl?: string;
  bannerUrl?: string;
  socials?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    linkedin?: string;
    website?: string;
  };
}

export default function MerchantStore() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { language } = useLanguage();

  const { data: merchant, isLoading: merchantLoading } = useQuery<Merchant>({
    queryKey: ["/api/merchants", id],
    queryFn: async () => {
      const res = await fetch(`/api/merchants/${id}`);
      if (!res.ok) throw new Error("Merchant not found");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<ProductSummary[]>({
    queryKey: ["/api/products/summary", id],
    queryFn: async () => {
      const res = await fetch(`/api/products/summary?merchantId=${id}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
    enabled: !!id,
  });

  if (merchantLoading) {
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

  if (!merchant) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <EmptyState
          icon={Store}
          title={language === "ar" ? "المتجر غير موجود" : "Store not found"}
          description={language === "ar" ? "لم نتمكن من العثور على هذا المتجر" : "We couldn't find this store"}
        />
      </div>
    );
  }

  const socialLinks = [
    { icon: Instagram, url: merchant.socials?.instagram, name: "Instagram" },
    { icon: Facebook, url: merchant.socials?.facebook, name: "Facebook" },
    { icon: Twitter, url: merchant.socials?.twitter, name: "Twitter" },
    { icon: SiTiktok, url: merchant.socials?.tiktok, name: "TikTok" },
    { icon: Youtube, url: merchant.socials?.youtube, name: "YouTube" },
    { icon: Linkedin, url: merchant.socials?.linkedin, name: "LinkedIn" },
    { icon: Globe, url: merchant.socials?.website, name: language === "ar" ? "الموقع" : "Website" },
  ].filter(link => link.url);

  return (
    <div className="min-h-screen pt-24 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Merchant Header */}
        <GlassCard className="mb-12 overflow-hidden">
          {/* Banner */}
          {merchant.bannerUrl && (
            <div className="h-64 w-full overflow-hidden">
              <img
                src={merchant.bannerUrl}
                alt={merchant.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
              {/* Store Logo */}
              <Avatar className="w-24 h-24 border-4 border-background">
                <AvatarImage src={merchant.logoUrl || ""} alt={merchant.name} />
                <AvatarFallback className="bg-primary/10 text-2xl">
                  {merchant.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Store Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2" data-testid={`text-merchant-name-${id}`}>
                  {merchant.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                  {merchant.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{merchant.city}</span>
                    </div>
                  )}
                  {merchant.contact && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{merchant.contact}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-muted-foreground">
                  {language === "ar" ? "تابعنا على:" : "Follow us:"}
                </span>
                {socialLinks.map((link) => (
                  <Button
                    key={link.name}
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(link.url, "_blank")}
                    data-testid={`button-social-${link.name.toLowerCase()}`}
                  >
                    <link.icon className="w-4 h-4 me-2" />
                    {link.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Products Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">
            {language === "ar" ? "منتجات المتجر" : "Store Products"}
          </h2>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Store}
            title={language === "ar" ? "لا توجد منتجات" : "No products found"}
            description={language === "ar" ? "لم يتم إضافة منتجات لهذا المتجر بعد" : "This store hasn't added any products yet"}
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
