export function PaginationStatus({ itemCount, hasMore }: { itemCount: number; hasMore: boolean }) {
  return (
    <p className="text-center text-sm text-muted-foreground" aria-live="polite">
      {hasMore
        ? `${itemCount} nəticə göstərilir`
        : itemCount
          ? "Daha çox məlumat yoxdur"
          : "Məlumat tapılmadı"}
    </p>
  );
}
