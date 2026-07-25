import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "info" | "outline";
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex min-h-7 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold",
        variant === "default" && "bg-primary text-primary-foreground",
        variant === "secondary" && "bg-secondary text-secondary-foreground",
        variant === "success" && "bg-success/15 text-success",
        variant === "warning" && "bg-warning/15 text-warning",
        variant === "destructive" && "bg-destructive/15 text-destructive",
        variant === "info" && "bg-info/15 text-info",
        variant === "outline" && "border bg-transparent text-foreground",
        className
      )}
      {...props}
    />
  );
}
