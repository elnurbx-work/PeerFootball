"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelClubMatchAction } from "@/actions/match.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n/i18n-provider";

export function MatchCancelForm({ matchId }: { matchId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    startTransition(async () => {
      const result = await cancelClubMatchAction({ ...values, matchId });
      setMessage(result.message);
      if (result.ok) router.refresh();
    });
  }

  return <form className="grid gap-2 rounded-md border p-3" onSubmit={submit}>
    <select name="reason" defaultValue="MUTUAL_AGREEMENT" className="h-10 rounded-md border bg-background px-3 text-sm">
      {cancellationReasons.map((reason) => <option key={reason} value={reason}>{humanize(reason)}</option>)}
    </select>
    <Input name="note" maxLength={500} placeholder={t("matches.resultForm.notePlaceholder")} />
    <Button variant="outline" disabled={pending}>{t("matches.summary.statusCancelled")}</Button>
    {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
  </form>;
}

const cancellationReasons = ["PLAYER_SHORTAGE", "VENUE_PROBLEM", "DATE_UNAVAILABLE", "WEATHER", "MUTUAL_AGREEMENT", "OTHER"] as const;
function humanize(value: string) {
  return value.replaceAll("_", " ");
}
