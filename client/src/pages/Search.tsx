import { useState, useEffect, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { SearchBar } from "@/components/ui/search-bar";
import { ProductTile } from "@/components/ui/product-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Search as SearchIcon, SlidersHorizontal, X, Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ProductSummary } from "@shared/schema";

interface SearchFilters {
  sizes?: string[];
  colors?: string[];
  priceMin?: number;
  priceMax?: number;
  cities?: string[];
  brands?: string[];
}

interface SearchResponse {
  results: ProductSummary[];
  count: number;
}

export default function Search() {
  const { t } = useLanguage();
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedFits, setSelectedFits] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<ProductSummary[]>([]);

  const initialQuery = useMemo(() => new URLSearchParams(search).get("q") ?? "", [search]);
  const [query, setQuery] = useState(initialQuery);

  // Sync query with URL parameter when search string changes
  useEffect(() => {
    const urlQuery = new URLSearchParams(search).get("q") || "";
    setQuery(urlQuery);
  }, [search]);

  // Text search mutation
  const textSearch = useMutation<SearchResponse, Error, { q: string; filters?: SearchFilters }>({
    mutationFn: async ({ q, filters }) => {
      const res = await apiRequest("POST", "/api/search/text", { q, filters });
      return await res.json();
    },
    onSuccess: (data) => {
      setSearchResults(data.results);
    },
  });

  // Image search mutation
  const imageSearch = useMutation<SearchResponse, Error, File>({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/search/image", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Image search failed");
      return await res.json();
    },
    onSuccess: (data) => {
      setSearchResults(data.results);
    },
  });

  // Execute text search when query or filters change
  useEffect(() => {
    console.log("[Search] useEffect triggered", { query, priceRange, selectedSizes, selectedColors });
    if (query) {
      const filters: SearchFilters = {
        priceMin: priceRange[0],
        priceMax: priceRange[1],
        sizes: selectedSizes.length > 0 ? selectedSizes : undefined,
        colors: selectedColors.length > 0 ? selectedColors : undefined,
      };
      console.log("[Search] Executing search with", { q: query, filters });
      textSearch.mutate({ q: query, filters });
    } else {
      setSearchResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, priceRange[0], priceRange[1], selectedSizes.length, selectedColors.length]);

  const products = searchResults;
  const isLoading = textSearch.isPending || imageSearch.isPending;

  console.log("[Search] Render - products:", products.length, "isLoading:", isLoading);

  const filterOptions = {
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["Black", "White", "Navy", "Gray", "Beige", "Brown", "Red", "Green"],
    fits: ["Slim", "Regular", "Relaxed", "Oversized"],
  };

  const handleSizeToggle = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleColorToggle = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      imageSearch.mutate(file);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="shadow-2xl rounded-2xl">
            <SearchBar
              key={query}
              placeholder={t("searchPlaceholder")}
              defaultValue={query}
              onSearch={(q) => setLocation(`/search?q=${encodeURIComponent(q)}`)}
              data-testid="search-bar-page"
            />
          </div>
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

              {/* Image Search */}
              <div className="space-y-3">
                <Label>{t("imageSearch") || "Search by Image"}</Label>
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-4 hover:border-primary/50 transition-colors text-center shadow-lg hover:shadow-xl bg-background/50 backdrop-blur-sm">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground font-medium">Upload image</p>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      data-testid="input-image-upload"
                    />
                  </div>
                </label>
              </div>

              {/* Size Filter */}
              <div className="space-y-3">
                <Label>{t("size")}</Label>
                <div className="space-y-2">
                  {filterOptions.sizes.map((size) => (
                    <div key={size} className="flex items-center space-x-2">
                      <Checkbox
                        id={`size-${size}`}
                        checked={selectedSizes.includes(size)}
                        onCheckedChange={() => handleSizeToggle(size)}
                        data-testid={`checkbox-size-${size}`}
                      />
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
                  {filterOptions.colors.map((color) => (
                    <div key={color} className="flex items-center space-x-2">
                      <Checkbox
                        id={`color-${color}`}
                        checked={selectedColors.includes(color)}
                        onCheckedChange={() => handleColorToggle(color)}
                        data-testid={`checkbox-color-${color}`}
                      />
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

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSelectedSizes([]);
                  setSelectedColors([]);
                  setPriceRange([0, 5000]);
                }}
                data-testid="button-clear-filters"
              >
                {t("clearFilters") || "Clear Filters"}
              </Button>
            </GlassCard>
          </aside>

          {/* Results */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{t("searchResults") || "Search Results"}</h2>
                {query && (
                  <p className="text-muted-foreground">
                    Showing {isLoading ? "..." : products.length} results for "{query}"
                  </p>
                )}
                {imageSearch.isSuccess && !textSearch.isSuccess && (
                  <p className="text-muted-foreground">
                    Showing {products.length} results from image search
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
                {t("filters") || "Filters"}
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-square rounded-2xl" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                icon={SearchIcon}
                title={t("noResults") || "No results found"}
                description="Try adjusting your filters or search terms"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductTile
                    key={product.id}
                    id={product.id}
                    title={product.title}
                    price={product.price}
                    brandName={product.brandName || undefined}
                    images={product.images}
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
