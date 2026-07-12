"use client";
import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitMatchResultAction } from "@/actions/match.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
export function MatchResultForm({ matchId }: { matchId: string }) {
  const router = useRouter(); const [message, setMessage] = useState(""); const [pending, startTransition] = useTransition();
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); startTransition(async () => { const result = await submitMatchResultAction({ ...values, matchId }); setMessage(result.message); if (result.ok) router.refresh(); }); }
  return <form className="grid gap-3 rounded-md border p-4" onSubmit={submit}><div><p className="font-medium">Nəticə əlavə et</p><p className="text-xs text-muted-foreground">Ev sahibi nəticəni əlavə edir.</p></div><div className="grid grid-cols-2 gap-3"><Input name="homeScore" type="number" min={0} max={99} placeholder="Ev / Team A" required /><Input name="awayScore" type="number" min={0} max={99} placeholder="Qonaq / Team B" required /></div><Textarea name="resultNote" maxLength={500} placeholder="Nəticə qeydi (istəyə bağlı)" />{message ? <p className="text-sm text-muted-foreground">{message}</p> : null}<Button className="w-fit" disabled={pending}>Nəticə əlavə et</Button></form>;
}
