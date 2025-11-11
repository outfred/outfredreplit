import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ExternalLink, Sparkles } from "lucide-react";
import type { Brand } from "@shared/schema";

export default function Brands() {
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();

  const { data: brands = [], isLoading } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  return (
    <div className="min-h-screen pt-24 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {language === "ar" ? "العلامات التجارية" : "Brands"}
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {language === "ar" 
              ? "استكشف أفضل العلامات التجارية العالمية المتاحة على منصتنا"
              : "Explore the world's best brands available on our platform"
            }
          </p>
        </div>

        {/* Brands Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <GlassCard key={i} className="p-6">
                <Skeleton className="w-full h-32 mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </GlassCard>
            ))}
          </div>
        ) : brands.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title={language === "ar" ? "لا توجد علامات تجارية" : "No brands found"}
            description={language === "ar" ? "لا توجد علامات تجارية متاحة حالياً" : "No brands available at the moment"}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {brands.map((brand) => (
              <GlassCard
                key={brand.id}
                className="p-6 hover:scale-105 transition-transform duration-300 cursor-pointer group"
                onClick={() => setLocation(`/brand/${brand.id}`)}
                data-testid={`card-brand-${brand.id}`}
              >
                {/* Brand Logo */}
                <div className="w-full h-32 mb-4 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
                  {brand.logoUrl ? (
                    <img
                      src={brand.logoUrl}
                      alt={language === "ar" ? brand.nameAr || brand.nameEn : brand.nameEn}
                      className="max-w-full max-h-full object-contain p-4"
                      data-testid={`img-brand-logo-${brand.id}`}
                    />
                  ) : (
                    <div className="text-6xl font-bold text-muted-foreground/20">
                      {(language === "ar" ? brand.nameAr || brand.nameEn : brand.nameEn).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Brand Name */}
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors" data-testid={`text-brand-name-${brand.id}`}>
                  {language === "ar" ? brand.nameAr || brand.nameEn : brand.nameEn}
                </h3>

                {/* Website Link */}
                {brand.websiteUrl && (
                  <a
                    href={brand.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`link-brand-website-${brand.id}`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{language === "ar" ? "زيارة الموقع" : "Visit Website"}</span>
                  </a>
                )}
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
