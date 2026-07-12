"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClubVsClubMatchProposalAction } from "@/actions/match.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ClubSummary } from "@/types/club.types";

export function CreateClubVsClubMatchForm({ homeClubId, opponents }: { homeClubId: string; opponents: ClubSummary[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    startTransition(async () => {
      const result = await createClubVsClubMatchProposalAction({ ...values, homeClubId });
      setMessage(result.message);
      if (result.ok && result.data) router.push(`/matches/${result.data.matchId}`);
    });
  }
  return (
    <form className="grid gap-4" onSubmit={submit}>
      <select name="awayClubId" required className={selectClass} defaultValue=""><option value="" disabled>Select opponent club</option>{opponents.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}</select>
      <Input name="title" placeholder="Proposal title (optional)" />
      <div className="grid gap-3 sm:grid-cols-2"><Input name="venue" placeholder="Venue" /><Input name="startTime" type="datetime-local" required /></div>
      <select name="category" defaultValue="FRIENDLY" className={selectClass}><option value="FRIENDLY">Friendly</option><option value="OFFICIAL">Official</option><option value="TRAINING">Training</option></select>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button className="w-fit" disabled={pending || !opponents.length}>{pending ? "Sending..." : "Send match proposal"}</Button>
    </form>
  );
}
const selectClass = "h-10 rounded-md border bg-background px-3 text-sm";
