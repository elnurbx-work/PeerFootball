"use client";

import { useState, useTransition } from "react";
import { Flag, X } from "lucide-react";
import { reportUserAction } from "@/actions/moderation.actions";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Toast } from "@/components/ui/toast";

export function ProfileReportButton({ reportedUserId }: { reportedUserId: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function close() {
    if (pending) return;
    setOpen(false);
    setError(null);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await reportUserAction(reportedUserId, note);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      setNote("");
      setOpen(false);
      setSuccess(result.message);
    });
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Flag className="h-4 w-4" />
        {t("profile.report.button")}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-overlay p-3 sm:items-center sm:p-4" role="presentation">
          <section
            aria-labelledby="profile-report-title"
            aria-modal="true"
            className="grid max-h-[calc(100dvh-1.5rem)] w-full max-w-md gap-4 overflow-y-auto rounded-lg border bg-card p-4 shadow-xl sm:p-5"
            role="dialog"
          >
            <header className="flex items-start justify-between gap-3">
              <div>
                <h2 id="profile-report-title" className="font-semibold">{t("profile.report.title")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("profile.report.description")}</p>
              </div>
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-secondary"
                aria-label={t("profile.report.close")}
                onClick={close}
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <Textarea
              autoFocus
              value={note}
              maxLength={500}
              rows={4}
              placeholder={t("profile.report.placeholder")}
              onChange={(event) => setNote(event.target.value)}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{note.trim().length}/500</p>
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="ghost" disabled={pending} onClick={close}>
                  {t("profile.report.cancel")}
                </Button>
                <Button type="button" variant="destructive" disabled={pending || note.trim().length < 5} onClick={submit}>
                  {pending ? t("profile.report.sending") : t("profile.report.send")}
                </Button>
              </div>
            </div>
            {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
          </section>
        </div>
      ) : null}

      <Toast message={success ?? ""} open={Boolean(success)} onOpenChange={(nextOpen) => !nextOpen && setSuccess(null)} />
    </>
  );
}
