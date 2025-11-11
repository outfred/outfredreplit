import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";

export interface BrandBadgeProps {
  id: string;
  name: string;
  logoUrl?: string;
  onClick?: () => void;
  className?: string;
}

export function BrandBadge({
  id,
  name,
  logoUrl,
  onClick,
  className,
}: BrandBadgeProps) {
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
          <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg font-bold text-primary">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm truncate" data-testid={`text-brand-${id}`}>
          {name}
        </h3>
      </div>
    </GlassCard>
  );
}
