import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground hover:border-input-hover focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-70",
        className
      )}
      {...props}
    />
  );
}
