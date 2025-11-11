import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlowButton } from "./glow-button";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      {Icon && (
        <div className="mb-4 rounded-full bg-muted p-6">
          <Icon className="w-12 h-12 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <GlowButton variant="primary" onClick={onAction} data-testid="button-empty-action">
          {actionLabel}
        </GlowButton>
      )}
    </div>
  );
}
