import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { SearchBar } from "@/components/ui/search-bar";
import { ProductTile } from "@/components/ui/product-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";

export default function Search() {
  const { t } = useLanguage();
  const [location, setLocation] = useLocation();
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 5000]);

  const query = new URLSearchParams(location.split("?")[1]).get("q") || "";

  // Mock data
  const products = query ? [] : []; // Empty for now

  const filters = {
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["Black", "White", "Blue", "Red", "Green"],
    fits: ["Slim", "Regular", "Relaxed", "Oversized"],
    cities: ["Cairo", "Alexandria", "Giza", "Aswan"],
  };

  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar
            placeholder={t("searchPlaceholder")}
            defaultValue={query}
            onSearch={(q) => setLocation(`/search?q=${encodeURIComponent(q)}`)}
            data-testid="search-bar-page"
          />
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <aside className={`${showFilters ? "block" : "hidden"} lg:block w-full lg:w-64 flex-shrink-0`}>
            <GlassCard className="p-6 space-y-6 sticky top-24">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{t("filters")}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setShowFilters(false)}
                  data-testid="button-close-filters"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <Label>{t("priceRange")}</Label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={5000}
                  step={100}
                  className="w-full"
                  data-testid="slider-price"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{priceRange[0]} EGP</span>
                  <span>{priceRange[1]} EGP</span>
                </div>
              </div>

              {/* Size Filter */}
              <div className="space-y-3">
                <Label>{t("size")}</Label>
                <div className="space-y-2">
                  {filters.sizes.map((size) => (
                    <div key={size} className="flex items-center space-x-2">
                      <Checkbox id={`size-${size}`} data-testid={`checkbox-size-${size}`} />
                      <label
                        htmlFor={`size-${size}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {size}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Filter */}
              <div className="space-y-3">
                <Label>{t("color")}</Label>
                <div className="space-y-2">
                  {filters.colors.map((color) => (
                    <div key={color} className="flex items-center space-x-2">
                      <Checkbox id={`color-${color}`} data-testid={`checkbox-color-${color}`} />
                      <label
                        htmlFor={`color-${color}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {color}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fit Filter */}
              <div className="space-y-3">
                <Label>{t("fit")}</Label>
                <div className="space-y-2">
                  {filters.fits.map((fit) => (
                    <div key={fit} className="flex items-center space-x-2">
                      <Checkbox id={`fit-${fit}`} data-testid={`checkbox-fit-${fit}`} />
                      <label
                        htmlFor={`fit-${fit}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {fit}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                data-testid="button-clear-filters"
              >
                {t("clearFilters")}
              </Button>
            </GlassCard>
          </aside>

          {/* Results */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{t("searchResults")}</h2>
                {query && (
                  <p className="text-muted-foreground">
                    Showing results for "{query}"
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                className="lg:hidden"
                onClick={() => setShowFilters(true)}
                data-testid="button-show-filters"
              >
                <SlidersHorizontal className="w-4 h-4 me-2" />
                {t("filters")}
              </Button>
            </div>

            {products.length === 0 ? (
              <EmptyState
                icon={SearchIcon}
                title={t("noResults")}
                description="Try adjusting your filters or search terms"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product: any) => (
                  <ProductTile
                    key={product.id}
                    {...product}
                    onClick={() => setLocation(`/product/${product.id}`)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
