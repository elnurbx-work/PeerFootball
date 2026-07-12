"use client";
import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createMatchCommentAction } from "@/actions/match.actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
export function MatchCommentForm({ matchId, parentId, onDone }: { matchId: string; parentId?: string; onDone?: () => void }) {
  const router = useRouter(); const [message, setMessage] = useState(""); const [pending, startTransition] = useTransition();
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const content = String(new FormData(form).get("content") ?? ""); startTransition(async () => { const result = await createMatchCommentAction({ matchId, parentId, content }); setMessage(result.message); if (result.ok) { form.reset(); onDone?.(); router.refresh(); } }); }
  return <form className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end" onSubmit={submit}><Textarea name="content" className="min-h-20" maxLength={1000} placeholder={parentId ? "Cavab yazın..." : "Şərh yazın..."} required /><Button disabled={pending}>{pending ? "Göndərilir..." : "Göndər"}</Button>{message ? <p className="text-xs text-muted-foreground sm:col-span-2">{message}</p> : null}</form>;
}
