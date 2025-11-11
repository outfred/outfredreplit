import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { ProductTile } from "@/components/ui/product-tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, X, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function OutfitBuilder() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [outfitTitle, setOutfitTitle] = useState("");
  const [outfitNotes, setOutfitNotes] = useState("");

  // Mock data
  const availableProducts = [
    { id: "1", title: "Black Hoodie", price: 799, images: ["/placeholder-product.png"], brandName: "Cairo Streetwear" },
    { id: "2", title: "Blue Jeans", price: 899, images: ["/placeholder-product.png"], brandName: "Alexandria Fashion" },
    { id: "3", title: "White Sneakers", price: 1299, images: ["/placeholder-product.png"], brandName: "Giza Style" },
    { id: "4", title: "Leather Jacket", price: 1999, images: ["/placeholder-product.png"], brandName: "Cairo Streetwear" },
  ];

  const aiSuggestions = [
    { id: "5", title: "Denim Shirt", price: 599, images: ["/placeholder-product.png"], brandName: "Alexandria Fashion" },
    { id: "6", title: "Canvas Bag", price: 399, images: ["/placeholder-product.png"], brandName: "Giza Style" },
  ];

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSaveOutfit = () => {
    console.log("Saving outfit:", { title: outfitTitle, notes: outfitNotes, products: selectedProducts });
    setShowSaveDialog(false);
    setLocation("/profile?tab=outfits");
  };

  const selectedProductsData = availableProducts.filter(p => selectedProducts.includes(p.id));

  return (
    <div className="min-h-screen pt-24 px-4 pb-16">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{t("buildOutfit")}</h1>
            <p className="text-muted-foreground">
              Select products to create your perfect outfit
            </p>
          </div>
          <GlowButton
            variant="primary"
            onClick={() => setShowSaveDialog(true)}
            disabled={selectedProducts.length === 0}
            data-testid="button-save-outfit"
          >
            <Save className="w-5 h-5 me-2" />
            {t("saveOutfit")}
          </GlowButton>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Selected Items */}
          <div className="lg:col-span-1">
            <GlassCard className="p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">{t("selectedItems")}</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {selectedProducts.length} items selected
              </p>
              
              {selectedProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No items selected yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedProductsData.map((product) => (
                    <div key={product.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.title}</p>
                        <p className="text-xs text-muted-foreground">{product.price} EGP</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleProduct(product.id)}
                        className="h-8 w-8 rounded-lg"
                        data-testid={`button-remove-${product.id}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-sm font-semibold flex justify-between">
                      <span>Total:</span>
                      <span className="text-primary">
                        {selectedProductsData.reduce((sum, p) => sum + p.price, 0)} EGP
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Available Products & AI Suggestions */}
          <div className="lg:col-span-2 space-y-8">
            {/* AI Suggestions */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">{t("aiSuggestions")}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {aiSuggestions.map((product) => (
                  <ProductTile
                    key={product.id}
                    {...product}
                    onClick={() => toggleProduct(product.id)}
                    isFavorite={selectedProducts.includes(product.id)}
                    onFavoriteToggle={() => toggleProduct(product.id)}
                  />
                ))}
              </div>
            </section>

            {/* All Products */}
            <section>
              <h2 className="text-2xl font-bold mb-6">Browse All Products</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableProducts.map((product) => (
                  <ProductTile
                    key={product.id}
                    {...product}
                    onClick={() => toggleProduct(product.id)}
                    isFavorite={selectedProducts.includes(product.id)}
                    onFavoriteToggle={() => toggleProduct(product.id)}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Save Outfit Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-card-border">
          <DialogHeader>
            <DialogTitle>{t("saveOutfit")}</DialogTitle>
            <DialogDescription>
              Give your outfit a name and add any notes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="outfit-title">{t("outfitTitle")}</Label>
              <Input
                id="outfit-title"
                value={outfitTitle}
                onChange={(e) => setOutfitTitle(e.target.value)}
                placeholder="e.g., Casual Weekend Look"
                data-testid="input-outfit-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outfit-notes">{t("outfitNotes")}</Label>
              <Textarea
                id="outfit-notes"
                value={outfitNotes}
                onChange={(e) => setOutfitNotes(e.target.value)}
                placeholder="Add any notes about this outfit..."
                rows={3}
                data-testid="input-outfit-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)} data-testid="button-cancel-save">
              {t("cancel")}
            </Button>
            <GlowButton
              variant="primary"
              onClick={handleSaveOutfit}
              disabled={!outfitTitle.trim()}
              data-testid="button-confirm-save"
            >
              {t("save")}
            </GlowButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
