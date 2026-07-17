"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClubVsClubMatchProposalAction } from "@/actions/match.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ClubSummary } from "@/types/club.types";
import { useI18n } from "@/components/i18n/i18n-provider";

export function CreateClubVsClubMatchForm({ homeClubId, opponents }: { homeClubId: string; opponents: ClubSummary[] }) {
  const { t } = useI18n();
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
      <select name="awayClubId" required className={selectClass} defaultValue=""><option value="" disabled>{t("matches.createClubVsClub.selectOpponent")}</option>{opponents.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}</select>
      <Input name="title" placeholder={t("matches.createClubVsClub.titlePlaceholder")} />
      <div className="grid gap-3 sm:grid-cols-2"><Input name="venue" placeholder={t("matches.common.venue")} /><Input name="startTime" type="datetime-local" required /></div>
      <select name="category" defaultValue="FRIENDLY" className={selectClass}><option value="FRIENDLY">{t("matches.common.friendly")}</option><option value="OFFICIAL">{t("matches.common.official")}</option><option value="TRAINING">{t("matches.common.training")}</option></select>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button className="w-fit" disabled={pending || !opponents.length}>{pending ? t("matches.createClubVsClub.sending") : t("matches.createClubVsClub.submit")}</Button>
    </form>
  );
}
const selectClass = "h-10 rounded-md border bg-background px-3 text-sm";
