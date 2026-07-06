"use client";

import { useEffect } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastProps = {
  message: string;
  open: boolean;
  variant?: "success" | "error";
  onOpenChange: (open: boolean) => void;
};

export function Toast({ message, open, variant = "success", onOpenChange }: ToastProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(() => onOpenChange(false), 3500);

    return () => window.clearTimeout(timeoutId);
  }, [onOpenChange, open]);

  if (!open) {
    return null;
  }

  const Icon = variant === "success" ? CheckCircle2 : XCircle;

  return (
    <div className="fixed right-4 top-4 z-50 w-[calc(100vw-2rem)] max-w-sm">
      <div
        className={cn(
          "flex items-start gap-3 rounded-md border bg-card p-3 text-sm shadow-lg",
          variant === "success" ? "border-primary/30" : "border-destructive/30"
        )}
        role="status"
      >
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", variant === "success" ? "text-primary" : "text-destructive")} />
        <p className="min-w-0 flex-1 font-medium">{message}</p>
        <button
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
          type="button"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
