"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OfflineRetryButton() {
  return (
    <Button type="button" size="lg" variant="secondary" onClick={() => window.location.reload()}>
      <RefreshCw className="h-4 w-4" aria-hidden="true" />
      Yenidən yoxla
    </Button>
  );
}
