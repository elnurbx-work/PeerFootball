"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptMatchInviteAction, declineMatchInviteAction, respondToClubVsClubMatchProposalAction } from "@/actions/match.actions";
import { Button } from "@/components/ui/button";
export function MatchProposalActions({ matchId }: { matchId: string }) {
  const router = useRouter(); const [message, setMessage] = useState(""); const [pending, startTransition] = useTransition();
  function respond(response: "ACCEPT" | "REJECT") { startTransition(async () => { const result = await respondToClubVsClubMatchProposalAction({ matchId, response }); setMessage(result.message); if (result.ok) router.refresh(); }); }
  return <div className="flex flex-wrap items-center gap-2"><Button disabled={pending} onClick={() => respond("ACCEPT")}>Accept proposal</Button><Button variant="outline" disabled={pending} onClick={() => respond("REJECT")}>Reject</Button>{message ? <p className="w-full text-sm text-muted-foreground">{message}</p> : null}</div>;
}

export function MatchInviteActions({ matchPlayerId }: { matchPlayerId: string }) {
  const router = useRouter(); const [message, setMessage] = useState(""); const [pending, startTransition] = useTransition();
  function respond(accept: boolean) { startTransition(async () => { const result = accept ? await acceptMatchInviteAction(matchPlayerId) : await declineMatchInviteAction(matchPlayerId); setMessage(result.message); if (result.ok) router.refresh(); }); }
  return <div className="flex flex-wrap gap-2"><Button size="sm" disabled={pending} onClick={() => respond(true)}>Accept match invite</Button><Button size="sm" variant="outline" disabled={pending} onClick={() => respond(false)}>Decline</Button>{message ? <p className="w-full text-sm text-muted-foreground">{message}</p> : null}</div>;
}
