"use client";

import { FormEvent, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchForm({ defaultValue, placeholder, submitLabel }: { defaultValue: string; placeholder: string; submitLabel: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    startTransition(() => router.push(query ? `/search?q=${encodeURIComponent(query)}&page=1` : "/search"));
  }
  return <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" defaultValue={defaultValue} name="q" placeholder={placeholder} type="search" /></div><Button type="submit" disabled={pending} aria-busy={pending}><Search className="h-4 w-4" />{submitLabel}</Button></form>;
}
