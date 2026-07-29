"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClubVsClubMatchProposalAction } from "@/actions/match.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ClubSummary } from "@/types/club.types";
import { useI18n } from "@/components/i18n/i18n-provider";

export function CreateClubVsClubMatchForm({ proposerClubId, opponents, initialOpponentId }: { proposerClubId: string; opponents: ClubSummary[]; initialOpponentId?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    startTransition(async () => {
      const result = await createClubVsClubMatchProposalAction({ ...values, proposerClubId });
      setMessage(result.message);
      if (result.ok && result.data) router.push(`/matches/${result.data.matchId}`);
    });
  }
  return (
    <form className="grid gap-4" onSubmit={submit}>
      <select name="opponentClubId" required className={selectClass} defaultValue={initialOpponentId ?? ""}><option value="" disabled>{t("matches.createClubVsClub.selectOpponent")}</option>{opponents.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}</select>
      <Input name="title" placeholder={t("matches.createClubVsClub.titlePlaceholder")} />
      <div className="grid gap-3 sm:grid-cols-2"><Input name="venue" placeholder={t("matches.common.venue")} required /><Input name="startTime" type="datetime-local" min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)} required /></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <select name="format" defaultValue="FIVE_V_FIVE" className={selectClass}>{formatOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select name="category" defaultValue="FRIENDLY" className={selectClass}><option value="FRIENDLY">{t("matches.common.friendly")}</option><option value="TRAINING">{t("matches.common.training")}</option></select>
        <Input name="durationMinutes" type="number" min={10} max={300} defaultValue={60} aria-label={t("matches.resultForm.title")} required />
      </div>
      <textarea name="note" maxLength={1000} className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm" placeholder={t("matches.resultForm.notePlaceholder")} />
      <label className="flex items-center gap-2 text-sm"><input name="proposerIsHome" type="checkbox" defaultChecked />{t("matches.summary.typeClubVsClub")}</label>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button className="w-fit" disabled={pending || !opponents.length}>{pending ? t("matches.createClubVsClub.sending") : t("matches.createClubVsClub.submit")}</Button>
    </form>
  );
}
const selectClass = "h-10 rounded-md border bg-background px-3 text-sm";
const formatOptions = [
  ["FIVE_V_FIVE", "5v5"],
  ["SIX_V_SIX", "6v6"],
  ["SEVEN_V_SEVEN", "7v7"],
  ["EIGHT_V_EIGHT", "8v8"],
  ["NINE_V_NINE", "9v9"],
  ["ELEVEN_V_ELEVEN", "11v11"]
] as const;
