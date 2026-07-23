"use client";

import { FormEvent, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ClubSearchForm({
  initialQuery,
  placeholder,
  submitLabel
}: {
  initialQuery: string;
  placeholder: string;
  submitLabel: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    params.set("page", "1");
    startTransition(() => router.push(`/clubs?${params.toString()}`));
  }

  return (
    <form className="flex flex-col gap-2 sm:flex-row" onSubmit={submit}>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          type="search"
        />
      </div>
      <Button type="submit" disabled={pending} aria-busy={pending}>
        <Search className="h-4 w-4" />
        {submitLabel}
      </Button>
    </form>
  );
}
