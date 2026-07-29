"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { respondToClubVsClubMatchProposalAction, respondToMatchAttendanceAction } from "@/actions/match.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n/i18n-provider";
export function MatchProposalActions({ matchId }: { matchId: string }) {
  const { t } = useI18n();
  const router = useRouter(); const [message, setMessage] = useState(""); const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  function respond(response: "ACCEPT" | "REJECT") { startTransition(async () => { const result = await respondToClubVsClubMatchProposalAction({ matchId, response, rejectionReason: reason }); setMessage(result.message); if (result.ok) router.refresh(); }); }
  return <div className="grid gap-2"><div className="flex flex-wrap items-center gap-2"><Button disabled={pending} onClick={() => respond("ACCEPT")}>{t("matches.proposalActions.acceptProposal")}</Button><Button variant="outline" disabled={pending} onClick={() => respond("REJECT")}>{t("matches.proposalActions.reject")}</Button></div><Input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder={t("matches.resultForm.notePlaceholder")} />{message ? <p className="w-full text-sm text-muted-foreground">{message}</p> : null}</div>;
}

export function MatchInviteActions({ matchPlayerId }: { matchPlayerId: string }) {
  const { t } = useI18n();
  const router = useRouter(); const [message, setMessage] = useState(""); const [pending, startTransition] = useTransition();
  function respond(status: "ACCEPTED" | "DECLINED" | "MAYBE") { startTransition(async () => { const result = await respondToMatchAttendanceAction({ matchPlayerId, status }); setMessage(result.message); if (result.ok) router.refresh(); }); }
  return <div className="flex flex-wrap gap-2"><Button size="sm" disabled={pending} onClick={() => respond("ACCEPTED")}>{t("matches.proposalActions.acceptInvite")}</Button><Button size="sm" variant="outline" disabled={pending} onClick={() => respond("MAYBE")}>{maybeLabel}</Button><Button size="sm" variant="outline" disabled={pending} onClick={() => respond("DECLINED")}>{t("matches.proposalActions.decline")}</Button>{message ? <p className="w-full text-sm text-muted-foreground">{message}</p> : null}</div>;
}

const maybeLabel = "MAYBE";
