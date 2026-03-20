import { cn } from "./utils";

function Skeleton({ 
  className, 
  variant = "default",
  ...props 
}: React.ComponentProps<"div"> & { variant?: "default" | "shimmer" }) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-lg",
        variant === "default" && "bg-muted/70 animate-pulse",
        variant === "shimmer" && "relative overflow-hidden bg-muted/50 before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-muted-foreground/10 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };

