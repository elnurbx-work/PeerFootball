import Link from "next/link";
import { Button } from "@/components/ui/button";

export function NumberedPagination({
  page,
  totalPages,
  pathname,
  pageParam = "page",
  searchParams = {}
}: {
  page: number;
  totalPages: number;
  pathname: string;
  pageParam?: string;
  searchParams?: Record<string, string | undefined>;
}) {
  const href = (nextPage: number) => {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter((entry): entry is [string, string] => Boolean(entry[1]))
    );
    params.set(pageParam, String(nextPage));
    return `${pathname}?${params.toString()}`;
  };

  return (
    <nav aria-label="Səhifələmə" className="flex flex-wrap items-center justify-center gap-3">
      <Button
        asChild
        variant="outline"
        aria-disabled={page <= 1}
        className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
      >
        <Link href={href(Math.max(1, page - 1))}>Əvvəlki</Link>
      </Button>
      <span className="text-sm text-muted-foreground" aria-current="page">
        Səhifə {page} / {totalPages}
      </span>
      <Button
        asChild
        variant="outline"
        aria-disabled={page >= totalPages}
        className={page >= totalPages ? "pointer-events-none opacity-50" : undefined}
      >
        <Link href={href(Math.min(totalPages, page + 1))}>Növbəti</Link>
      </Button>
    </nav>
  );
}
