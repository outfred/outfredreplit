import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";
import { Heart } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";

export interface ProductTileProps {
  id: string;
  title: string;
  price: number;
  currency?: string;
  images: string[];
  brandName?: string;
  isFavorite?: boolean;
  onClick?: () => void;
  onFavoriteToggle?: () => void;
  className?: string;
}

export function ProductTile({
  id,
  title,
  price,
  currency = "EGP",
  images,
  brandName,
  isFavorite = false,
  onClick,
  onFavoriteToggle,
  className,
}: ProductTileProps) {
  const imageUrl = images[0] || "/placeholder-product.png";
  const formattedPrice = `${price.toLocaleString()} ${currency}`;

  return (
    <GlassCard
      variant="hover"
      className={cn("group overflow-hidden cursor-pointer", className)}
      onClick={onClick}
      data-testid={`card-product-${id}`}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl bg-muted">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-2 end-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-md hover:bg-white/30 dark:hover:bg-black/30"
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle?.();
            }}
            data-testid={`button-favorite-${id}`}
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-colors",
                isFavorite ? "fill-primary text-primary" : "text-white"
              )}
            />
          </Button>
        </div>
        {brandName && (
          <div className="absolute bottom-2 start-2">
            <Badge variant="secondary" className="backdrop-blur-md bg-white/20 dark:bg-black/20">
              {brandName}
            </Badge>
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-sm line-clamp-2" data-testid={`text-title-${id}`}>
          {title}
        </h3>
        <p className="text-lg font-bold text-primary" data-testid={`text-price-${id}`}>
          {formattedPrice}
        </p>
      </div>
    </GlassCard>
  );
}
