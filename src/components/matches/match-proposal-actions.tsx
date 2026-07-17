"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptMatchInviteAction, declineMatchInviteAction, respondToClubVsClubMatchProposalAction } from "@/actions/match.actions";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";
export function MatchProposalActions({ matchId }: { matchId: string }) {
  const { t } = useI18n();
  const router = useRouter(); const [message, setMessage] = useState(""); const [pending, startTransition] = useTransition();
  function respond(response: "ACCEPT" | "REJECT") { startTransition(async () => { const result = await respondToClubVsClubMatchProposalAction({ matchId, response }); setMessage(result.message); if (result.ok) router.refresh(); }); }
  return <div className="flex flex-wrap items-center gap-2"><Button disabled={pending} onClick={() => respond("ACCEPT")}>{t("matches.proposalActions.acceptProposal")}</Button><Button variant="outline" disabled={pending} onClick={() => respond("REJECT")}>{t("matches.proposalActions.reject")}</Button>{message ? <p className="w-full text-sm text-muted-foreground">{message}</p> : null}</div>;
}

export function MatchInviteActions({ matchPlayerId }: { matchPlayerId: string }) {
  const { t } = useI18n();
  const router = useRouter(); const [message, setMessage] = useState(""); const [pending, startTransition] = useTransition();
  function respond(accept: boolean) { startTransition(async () => { const result = accept ? await acceptMatchInviteAction(matchPlayerId) : await declineMatchInviteAction(matchPlayerId); setMessage(result.message); if (result.ok) router.refresh(); }); }
  return <div className="flex flex-wrap gap-2"><Button size="sm" disabled={pending} onClick={() => respond(true)}>{t("matches.proposalActions.acceptInvite")}</Button><Button size="sm" variant="outline" disabled={pending} onClick={() => respond(false)}>{t("matches.proposalActions.decline")}</Button>{message ? <p className="w-full text-sm text-muted-foreground">{message}</p> : null}</div>;
}
