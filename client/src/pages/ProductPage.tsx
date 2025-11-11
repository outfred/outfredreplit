import { useParams, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { ProductTile } from "@/components/ui/product-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Store } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ProductPage() {
  const { t } = useLanguage();
  const params = useParams();
  const [, setLocation] = useLocation();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Mock data
  const product = {
    id: params.id,
    title: "Premium Cotton Hoodie",
    description: "High-quality cotton hoodie with modern fit. Perfect for casual wear.",
    price: 799,
    currency: "EGP",
    images: ["/placeholder-product.png", "/placeholder-product.png"],
    brandName: "Cairo Streetwear",
    merchantName: "Fashion Store Cairo",
    colors: ["Black", "White", "Gray"],
    sizes: ["S", "M", "L", "XL"],
    fit: "Regular",
    gender: "Unisex",
    tags: ["hoodie", "cotton", "casual"],
  };

  const relatedProducts = [
    { id: "2", title: "Classic T-Shirt", price: 399, images: ["/placeholder-product.png"], brandName: "Cairo Streetwear" },
    { id: "3", title: "Denim Jeans", price: 899, images: ["/placeholder-product.png"], brandName: "Alexandria Fashion" },
    { id: "4", title: "Varsity Jacket", price: 1299, images: ["/placeholder-product.png"], brandName: "Giza Style" },
  ];

  return (
    <div className="min-h-screen pt-24 px-4 pb-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Images */}
          <div className="space-y-4">
            <GlassCard className="aspect-square overflow-hidden p-0">
              <img
                src={product.images[selectedImage]}
                alt={product.title}
                className="w-full h-full object-cover"
                data-testid="img-product-main"
              />
            </GlassCard>
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((img, idx) => (
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
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2">
                {product.brandName}
              </Badge>
              <h1 className="text-4xl font-bold mb-2" data-testid="text-product-title">
                {product.title}
              </h1>
              <p className="text-3xl font-bold text-primary" data-testid="text-product-price">
                {product.price} {product.currency}
              </p>
            </div>

            <p className="text-muted-foreground" data-testid="text-product-description">
              {product.description}
            </p>

            {/* Color Selection */}
            <div className="space-y-3">
              <Label>{t("color")}</Label>
              <div className="flex gap-2">
                {product.colors.map((color) => (
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

            {/* Size Selection */}
            <div className="space-y-3">
              <Label>{t("size")}</Label>
              <div className="flex gap-2">
                {product.sizes.map((size) => (
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

            {/* Actions */}
            <div className="flex gap-3">
              <GlowButton
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={() => setIsFavorite(!isFavorite)}
                data-testid="button-add-favorite"
              >
                <Heart className={cn("w-5 h-5 me-2", isFavorite && "fill-current")} />
                {isFavorite ? t("removeFromFavorites") : t("addToFavorites")}
              </GlowButton>
              <Button size="icon" variant="outline" className="rounded-2xl h-12 w-12" data-testid="button-share">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Merchant Info */}
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("soldBy")}</p>
                  <p className="font-semibold" data-testid="text-merchant-name">{product.merchantName}</p>
                </div>
              </div>
            </GlassCard>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Related Products */}
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
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold mb-2">{children}</p>;
}
