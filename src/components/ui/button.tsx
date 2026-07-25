import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "success";
  size?: "sm" | "md" | "lg";
};

export function Button({
  asChild = false,
  className,
  variant = "default",
  size = "md",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variant === "default" && "bg-primary text-primary-foreground hover:bg-primary-hover",
        variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        variant === "outline" && "border bg-transparent hover:bg-surface-hover",
        variant === "ghost" && "hover:bg-surface-hover",
        variant === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/85",
        variant === "success" && "bg-success text-success-foreground hover:bg-success/85",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-11 px-5",
        className
      )}
      {...props}
    />
  );
}
