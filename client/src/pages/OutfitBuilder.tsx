import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { ProductTile } from "@/components/ui/product-tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, X, Save, User, Scale, MessageSquare, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type Product = {
  id: string;
  nameEn: string;
  nameAr?: string;
  priceCents: number;
  images: string[];
  brandId?: string;
};

type OutfitSuggestion = {
  topProduct: Product;
  bottomProduct: Product;
  shoeRecommendation: {
    brandName: string;
    model: string;
    reason: string;
  };
  reasoning: string;
};

export default function OutfitBuilder() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [outfitTitle, setOutfitTitle] = useState("");
  const [outfitNotes, setOutfitNotes] = useState("");
  
  // AI Form State
  const [userHeight, setUserHeight] = useState<string>("170");
  const [userWeight, setUserWeight] = useState<string>("70");
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [aiSuggestion, setAiSuggestion] = useState<OutfitSuggestion | null>(null);

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/products/summary"],
    select: (data: any[]) => data.filter(p => p.published)
  });

  // Generate outfit mutation
  const generateOutfit = useMutation({
    mutationFn: async (data: { userHeight: number; userWeight: number; aiPrompt: string }) => {
      const response = await fetch("/api/outfit/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate outfit");
      }
      
      return await response.json();
    },
    onSuccess: (data: OutfitSuggestion) => {
      setAiSuggestion(data);
      setSelectedProducts([data.topProduct.id, data.bottomProduct.id]);
      toast({
        title: "Outfit Generated! ✨",
        description: data.reasoning,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to generate outfit",
        description: error.message || "Please try again",
      });
    },
  });

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleGenerateOutfit = () => {
    const height = parseInt(userHeight);
    const weight = parseInt(userWeight);
    
    if (!height || !weight || !aiPrompt.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in your height, weight, and style preferences",
      });
      return;
    }
    
    generateOutfit.mutate({ userHeight: height, userWeight: weight, aiPrompt });
  };

  const handleSaveOutfit = () => {
    console.log("Saving outfit:", { title: outfitTitle, notes: outfitNotes, products: selectedProducts });
    setShowSaveDialog(false);
    setLocation("/profile?tab=outfits");
  };

  const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));

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
          {/* AI Form & Selected Items */}
          <div className="lg:col-span-1 space-y-6">
            {/* AI Outfit Generator */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">AI Outfit Generator</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="height" className="flex items-center gap-2 text-xs">
                      <User className="w-3 h-3" />
                      Height (cm)
                    </Label>
                    <Input
                      id="height"
                      type="number"
                      value={userHeight}
                      onChange={(e) => setUserHeight(e.target.value)}
                      placeholder="170"
                      data-testid="input-height"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="flex items-center gap-2 text-xs">
                      <Scale className="w-3 h-3" />
                      Weight (kg)
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      value={userWeight}
                      onChange={(e) => setUserWeight(e.target.value)}
                      placeholder="70"
                      data-testid="input-weight"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-prompt" className="flex items-center gap-2 text-xs">
                    <MessageSquare className="w-3 h-3" />
                    Style Preferences
                  </Label>
                  <Textarea
                    id="ai-prompt"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., Casual streetwear for a weekend outing, comfortable and stylish..."
                    rows={4}
                    data-testid="input-ai-prompt"
                  />
                </div>
                <GlowButton
                  variant="primary"
                  className="w-full"
                  onClick={handleGenerateOutfit}
                  disabled={generateOutfit.isPending}
                  data-testid="button-generate-outfit"
                >
                  {generateOutfit.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 me-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 me-2" />
                      Generate Outfit
                    </>
                  )}
                </GlowButton>
              </div>
            </GlassCard>
            
            {/* Selected Items */}
            <GlassCard className="p-6">
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
                        src={product.images[0] || "/placeholder-product.png"}
                        alt={product.nameEn}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.nameEn}</p>
                        <p className="text-xs text-muted-foreground">{product.priceCents / 100} EGP</p>
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
                        {selectedProductsData.reduce((sum, p) => sum + (p.priceCents / 100), 0)} EGP
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>

          {/* AI Suggestions & Products */}
          <div className="lg:col-span-2 space-y-8">
            {/* AI Generated Outfit */}
            {aiSuggestion && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold">AI Generated Outfit</h2>
                </div>
                <GlassCard className="p-6 mb-6">
                  <p className="text-sm text-muted-foreground mb-4">{aiSuggestion.reasoning}</p>
                  
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Top</h3>
                      <ProductTile
                        id={aiSuggestion.topProduct.id}
                        title={aiSuggestion.topProduct.nameEn}
                        price={aiSuggestion.topProduct.priceCents / 100}
                        images={aiSuggestion.topProduct.images}
                        brandName=""
                        onClick={() => toggleProduct(aiSuggestion.topProduct.id)}
                        isFavorite={selectedProducts.includes(aiSuggestion.topProduct.id)}
                        onFavoriteToggle={() => toggleProduct(aiSuggestion.topProduct.id)}
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Bottom</h3>
                      <ProductTile
                        id={aiSuggestion.bottomProduct.id}
                        title={aiSuggestion.bottomProduct.nameEn}
                        price={aiSuggestion.bottomProduct.priceCents / 100}
                        images={aiSuggestion.bottomProduct.images}
                        brandName=""
                        onClick={() => toggleProduct(aiSuggestion.bottomProduct.id)}
                        isFavorite={selectedProducts.includes(aiSuggestion.bottomProduct.id)}
                        onFavoriteToggle={() => toggleProduct(aiSuggestion.bottomProduct.id)}
                      />
                    </div>
                  </div>
                  
                  {/* Shoe Recommendation */}
                  <div className="border-t border-white/10 pt-4">
                    <h3 className="text-sm font-semibold mb-2">Recommended Shoes</h3>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                      <div className="flex-1">
                        <p className="font-medium">{aiSuggestion.shoeRecommendation.brandName} {aiSuggestion.shoeRecommendation.model}</p>
                        <p className="text-xs text-muted-foreground mt-1">{aiSuggestion.shoeRecommendation.reason}</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </section>
            )}

            {/* All Products */}
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground mt-4">Loading products...</p>
              </div>
            ) : (
              <section>
                <h2 className="text-2xl font-bold mb-6">Browse All Products</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {products.map((product) => (
                    <ProductTile
                      key={product.id}
                      id={product.id}
                      title={product.nameEn}
                      price={product.priceCents / 100}
                      images={product.images}
                      brandName=""
                      onClick={() => toggleProduct(product.id)}
                      isFavorite={selectedProducts.includes(product.id)}
                      onFavoriteToggle={() => toggleProduct(product.id)}
                    />
                  ))}
                </div>
              </section>
            )}
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
