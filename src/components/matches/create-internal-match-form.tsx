"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInternalMatchAction } from "@/actions/match.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateInternalMatchForm({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    startTransition(async () => {
      const result = await createInternalMatchAction({ ...values, clubId });
      setMessage(result.message);
      if (result.ok && result.data) router.push(`/matches/${result.data.matchId}`);
    });
  }
  return (
    <form className="grid gap-4" onSubmit={submit}>
      <Input name="title" placeholder="Match title (optional)" />
      <div className="grid gap-3 sm:grid-cols-2"><Input name="teamAName" defaultValue="Team A" required /><Input name="teamBName" defaultValue="Team B" required /></div>
      <div className="grid gap-3 sm:grid-cols-2"><Input name="venue" placeholder="Venue" /><Input name="startTime" type="datetime-local" required /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="category" defaultValue="TRAINING" className={selectClass}><option value="TRAINING">Training</option><option value="FRIENDLY">Friendly</option><option value="OFFICIAL">Official</option></select>
        <select name="initialStatus" defaultValue="SCHEDULED" className={selectClass}><option value="SCHEDULED">Schedule now</option><option value="DRAFT">Save draft</option></select>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button className="w-fit" disabled={pending}>{pending ? "Creating..." : "Create internal match"}</Button>
    </form>
  );
}
const selectClass = "h-10 rounded-md border bg-background px-3 text-sm";
