import { useState, forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Search, Image as ImageIcon, X } from "lucide-react";
import { Button } from "./button";

export interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  onSearch?: (query: string) => void;
  onImageUpload?: (file: File) => void;
  showImageUpload?: boolean;
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, onSearch, onImageUpload, showImageUpload = true, placeholder, defaultValue, ...props }, ref) => {
    const [query, setQuery] = useState((defaultValue as string) || "");
    const [showImage, setShowImage] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim() && onSearch) {
        onSearch(query.trim());
      }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onImageUpload) {
        onImageUpload(file);
      }
    };

    const clearQuery = () => {
      setQuery("");
      if (onSearch) {
        onSearch("");
      }
    };

    return (
      <form onSubmit={handleSubmit} className={cn("relative w-full", className)}>
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              ref={ref}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className={cn(
                "w-full h-12 ps-12 pe-12",
                "bg-white/10 dark:bg-white/5",
                "backdrop-blur-xl",
                "border border-white/20 dark:border-white/10",
                "rounded-2xl",
                "text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                "transition-all duration-200"
              )}
              {...props}
            />
            {query && (
              <button
                type="button"
                onClick={clearQuery}
                className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                data-testid="button-clear-search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {showImageUpload && (
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="sr-only"
                id="image-search-upload"
                data-testid="input-image-upload"
              />
              <label htmlFor="image-search-upload">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-12 w-12 rounded-2xl",
                    "bg-white/10 dark:bg-white/5",
                    "backdrop-blur-xl",
                    "border border-white/20 dark:border-white/10",
                    showImage && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => document.getElementById("image-search-upload")?.click()}
                  data-testid="button-image-search"
                >
                  <ImageIcon className="w-5 h-5" />
                </Button>
              </label>
            </div>
          )}
        </div>
      </form>
    );
  }
);

SearchBar.displayName = "SearchBar";

export { SearchBar };
