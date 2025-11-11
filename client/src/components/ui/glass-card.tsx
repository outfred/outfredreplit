import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "hover" | "border";
  blur?: "sm" | "md" | "lg" | "xl";
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", blur = "xl", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-2xl",
          "bg-white/8 dark:bg-white/5",
          "border border-white/10 dark:border-white/5",
          blur === "sm" && "backdrop-blur-sm",
          blur === "md" && "backdrop-blur-md",
          blur === "lg" && "backdrop-blur-lg",
          blur === "xl" && "backdrop-blur-xl",
          variant === "hover" && "hover-elevate transition-all duration-200",
          variant === "border" && "border-white/20 dark:border-white/10",
          "shadow-lg",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
