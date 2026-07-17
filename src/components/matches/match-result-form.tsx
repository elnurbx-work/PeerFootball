"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitMatchResultAction } from "@/actions/match.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n/i18n-provider";

type MatchResultFormProps = {
  matchId: string;
  initialHomeScore: number;
  initialAwayScore: number;
};

export function MatchResultForm({
  matchId,
  initialHomeScore,
  initialAwayScore
}: MatchResultFormProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    startTransition(async () => {
      const result = await submitMatchResultAction({ ...values, matchId });
      setMessage(result.message);
      if (result.ok) router.refresh();
    });
  }

  return (
    <form className="grid min-w-0 gap-3 rounded-md border p-3 sm:p-4" onSubmit={submit}>
      <div>
        <p className="font-medium">{t("matches.resultForm.title")}</p>
        <p className="text-xs text-muted-foreground">
          {t("matches.resultForm.description")}
        </p>
      </div>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 sm:gap-3">
        <Input className="min-w-0" name="homeScore" type="number" aria-label={t("matches.resultForm.homeScore")} value={initialHomeScore} readOnly required />
        <Input className="min-w-0" name="awayScore" type="number" aria-label={t("matches.resultForm.awayScore")} value={initialAwayScore} readOnly required />
      </div>
      <Textarea name="resultNote" maxLength={500} placeholder={t("matches.resultForm.notePlaceholder")} />
      {message ? <p className="break-words text-sm text-muted-foreground">{message}</p> : null}
      <Button className="w-full sm:w-fit" disabled={pending}>{t("matches.resultForm.submit")}</Button>
    </form>
  );
}
