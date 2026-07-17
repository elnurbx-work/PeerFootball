"use client";
import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmMatchResultAction, disputeMatchResultAction } from "@/actions/match.actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n/i18n-provider";
export function MatchResultConfirmation({ matchId }: { matchId: string }) {
  const { t } = useI18n();
  const router = useRouter(); const [message, setMessage] = useState(""); const [pending, startTransition] = useTransition();
  function confirm() { startTransition(async () => { const result = await confirmMatchResultAction(matchId); setMessage(result.message); if (result.ok) router.refresh(); }); }
  function dispute(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const disputeReason = String(new FormData(event.currentTarget).get("disputeReason") ?? ""); startTransition(async () => { const result = await disputeMatchResultAction({ matchId, disputeReason }); setMessage(result.message); if (result.ok) router.refresh(); }); }
  return <div className="grid gap-3 rounded-md border p-4"><div><p className="font-medium">{t("matches.resultConfirmation.title")}</p><p className="text-xs text-muted-foreground">{t("matches.resultConfirmation.description")}</p></div><Button className="w-fit" disabled={pending} onClick={confirm}>{t("matches.resultConfirmation.confirm")}</Button><form className="grid gap-2" onSubmit={dispute}><Textarea name="disputeReason" placeholder={t("matches.resultConfirmation.reasonPlaceholder")} minLength={5} maxLength={1000} required /><Button className="w-fit" variant="outline" disabled={pending}>{t("matches.resultConfirmation.dispute")}</Button></form>{message ? <p className="text-sm text-muted-foreground">{message}</p> : null}</div>;
}
