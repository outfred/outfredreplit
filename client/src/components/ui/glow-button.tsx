import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "glass";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "relative inline-flex items-center justify-center",
          "font-medium transition-all duration-200",
          "hover-elevate active-elevate-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          
          // Variants
          variant === "primary" && [
            "bg-primary text-primary-foreground",
            "border border-primary-border",
            "shadow-lg shadow-primary/20",
          ],
          variant === "accent" && [
            "bg-accent text-accent-foreground",
            "border border-accent-border",
            "shadow-lg shadow-accent/20",
          ],
          variant === "glass" && [
            "bg-white/10 dark:bg-white/5",
            "backdrop-blur-xl",
            "border border-white/20 dark:border-white/10",
            "text-foreground",
          ],
          
          // Sizes
          size === "sm" && "min-h-8 px-3 text-sm rounded-xl",
          size === "md" && "min-h-10 px-6 text-base rounded-2xl",
          size === "lg" && "min-h-12 px-8 text-lg rounded-2xl",
          
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
        {children}
      </button>
    );
  }
);

GlowButton.displayName = "GlowButton";

export { GlowButton };
