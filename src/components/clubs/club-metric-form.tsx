"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { createClubMetricDefinitionAction, updateClubMetricDefinitionAction } from "@/actions/club.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ClubMetricDefinitionDto } from "@/types/club.types";
import { useI18n } from "@/components/i18n/i18n-provider";

type ClubMetricFormProps = {
  clubId: string;
  metric?: ClubMetricDefinitionDto;
  onDone?: () => void;
};

export function ClubMetricForm({ clubId, metric, onDone }: ClubMetricFormProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form));

    setMessage("");
    startTransition(async () => {
      const result = metric
        ? await updateClubMetricDefinitionAction({ metricId: metric.id, ...payload })
        : await createClubMetricDefinitionAction({ clubId, ...payload });
      setMessage(result.message);

      if (result.ok) {
        form.reset();
        onDone?.();
        router.refresh();
      }
    });
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <div className="grid gap-3 md:grid-cols-[1fr_120px]">
        <Input name="name" placeholder={t("clubs.metricForm.name")} defaultValue={metric?.name ?? ""} required maxLength={50} />
        <Input name="order" type="number" min={1} max={6} defaultValue={metric?.order ?? ""} />
      </div>
      <Textarea name="description" placeholder={t("clubs.form.description")} defaultValue={metric?.description ?? ""} rows={3} />
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button type="submit" disabled={pending} className="w-fit">
        <Save className="h-4 w-4" />
        {pending ? t("common.saving") : metric ? t("clubs.metricForm.save") : t("clubs.metricForm.create")}
      </Button>
    </form>
  );
}
