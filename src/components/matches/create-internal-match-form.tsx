"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInternalMatchAction } from "@/actions/match.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n/i18n-provider";

export function CreateInternalMatchForm({ clubId }: { clubId: string }) {
  const { t } = useI18n();
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
      <Input name="title" placeholder={t("matches.createInternal.titlePlaceholder")} />
      <div className="grid gap-3 sm:grid-cols-2"><Input name="teamAName" defaultValue={t("matches.common.teamA")} required /><Input name="teamBName" defaultValue={t("matches.common.teamB")} required /></div>
      <div className="grid gap-3 sm:grid-cols-2"><Input name="venue" placeholder={t("matches.common.venue")} /><Input name="startTime" type="datetime-local" required /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="category" defaultValue="TRAINING" className={selectClass}><option value="TRAINING">{t("matches.common.training")}</option><option value="FRIENDLY">{t("matches.common.friendly")}</option><option value="OFFICIAL">{t("matches.common.official")}</option></select>
        <select name="initialStatus" defaultValue="SCHEDULED" className={selectClass}><option value="SCHEDULED">{t("matches.createInternal.scheduleNow")}</option><option value="DRAFT">{t("matches.createInternal.saveDraft")}</option></select>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button className="w-fit" disabled={pending}>{pending ? t("matches.createInternal.creating") : t("matches.createInternal.submit")}</Button>
    </form>
  );
}
const selectClass = "h-10 rounded-md border bg-background px-3 text-sm";
