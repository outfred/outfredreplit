import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";
import { useLanguage } from "@/contexts/LanguageContext";

export interface BrandBadgeProps {
  id: string;
  name?: string;
  nameEn?: string;
  nameAr?: string;
  logoUrl?: string;
  onClick?: () => void;
  className?: string;
}

export function BrandBadge({
  id,
  name,
  nameEn,
  nameAr,
  logoUrl,
  onClick,
  className,
}: BrandBadgeProps) {
  const { language } = useLanguage();
  
  // Support both old (name) and new (nameEn/nameAr) schema
  const displayName = name || 
    (language === "ar" ? (nameAr || nameEn) : nameEn) || 
    "Unknown";
  
  return (
    <GlassCard
      variant="hover"
      className={cn(
        "group cursor-pointer overflow-hidden",
        "flex items-center gap-3 p-4",
        className
      )}
      onClick={onClick}
      data-testid={`card-brand-${id}`}
    >
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
        {logoUrl ? (
          <img src={logoUrl} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg font-bold text-primary">
            {displayName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm truncate" data-testid={`text-brand-${id}`}>
          {displayName}
        </h3>
      </div>
    </GlassCard>
  );
}
