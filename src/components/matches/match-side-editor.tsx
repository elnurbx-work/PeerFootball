"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateInternalMatchSidesAction } from "@/actions/match.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MatchSideDto } from "@/types/match.types";

export function MatchSideEditor({ matchId, sides }: { matchId: string; sides: MatchSideDto[] }) {
  const router = useRouter(); const [message, setMessage] = useState(""); const [pending, startTransition] = useTransition();
  const teamA = sides.find((side) => side.side === "TEAM_A"); const teamB = sides.find((side) => side.side === "TEAM_B");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget));
    startTransition(async () => { const result = await updateInternalMatchSidesAction({ ...values, matchId }); setMessage(result.message); if (result.ok) router.refresh(); });
  }
  return <form className="grid gap-3 rounded-md border p-4" onSubmit={submit}><p className="font-medium">Rename sides</p><div className="grid gap-3 sm:grid-cols-2"><Input name="teamAName" defaultValue={teamA?.name} required /><Input name="teamBName" defaultValue={teamB?.name} required /></div>{message ? <p className="text-sm text-muted-foreground">{message}</p> : null}<Button className="w-fit" size="sm" disabled={pending}>Save side names</Button></form>;
}
