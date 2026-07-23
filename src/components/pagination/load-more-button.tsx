"use client";

import { Button } from "@/components/ui/button";

export function LoadMoreButton({
  pending,
  hasMore,
  onClick
}: {
  pending: boolean;
  hasMore: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending || !hasMore}
      aria-disabled={pending || !hasMore}
      aria-busy={pending}
      onClick={onClick}
    >
      {pending ? "Yüklənir..." : hasMore ? "Daha çox göstər" : "Daha çox məlumat yoxdur"}
    </Button>
  );
}
