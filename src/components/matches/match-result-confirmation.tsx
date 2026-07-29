"use client";
import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewMatchResultAction } from "@/actions/match.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n/i18n-provider";
export function MatchResultConfirmation({ matchId, homeScore, awayScore }: { matchId: string; homeScore: number; awayScore: number }) {
  const { t } = useI18n();
  const router = useRouter(); const [message, setMessage] = useState(""); const [pending, startTransition] = useTransition();
  function confirm() { startTransition(async () => { const result = await reviewMatchResultAction({ matchId, response: "CONFIRM" }); setMessage(result.message); if (result.ok) router.refresh(); }); }
  function dispute(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); startTransition(async () => { const result = await reviewMatchResultAction({ ...values, matchId, response: "DISPUTE" }); setMessage(result.message); if (result.ok) router.refresh(); }); }
  return <div className="grid gap-3 rounded-md border p-4"><div><p className="font-medium">{t("matches.resultConfirmation.title")}</p><p className="text-xs text-muted-foreground">{t("matches.resultConfirmation.description")}</p><p className="mt-2 text-2xl font-bold">{homeScore} : {awayScore}</p></div><Button className="w-fit" disabled={pending} onClick={confirm}>{t("matches.resultConfirmation.confirm")}</Button><form className="grid gap-2" onSubmit={dispute}><div className="grid grid-cols-2 gap-2"><Input name="alternativeHomeScore" type="number" min={0} max={99} defaultValue={homeScore} required /><Input name="alternativeAwayScore" type="number" min={0} max={99} defaultValue={awayScore} required /></div><Textarea name="disputeReason" placeholder={t("matches.resultConfirmation.reasonPlaceholder")} maxLength={1000} /><Button className="w-fit" variant="outline" disabled={pending}>{t("matches.resultConfirmation.dispute")}</Button></form>{message ? <p className="text-sm text-muted-foreground">{message}</p> : null}</div>;
}
