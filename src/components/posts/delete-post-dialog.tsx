"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";

type DeletePostDialogProps = {
  error?: string | null;
  open: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export function DeletePostDialog({ error, open, pending = false, onConfirm, onOpenChange }: DeletePostDialogProps) {
  const { t } = useI18n();
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center">
      <div className="grid w-full max-w-md gap-4 rounded-md bg-card p-4 shadow-xl" role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{t("posts.deleteDialog.title")}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t("posts.deleteDialog.description")}
              </p>
            </div>
          </div>
          <Button size="sm" variant="ghost" type="button" disabled={pending} onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" type="button" disabled={pending} onClick={() => onOpenChange(false)}>
            {t("posts.deleteDialog.cancel")}
          </Button>
          <Button type="button" disabled={pending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>
            <Trash2 className="h-4 w-4" />
            {pending ? t("posts.deleteDialog.deleting") : t("posts.deleteDialog.delete")}
          </Button>
        </div>
      </div>
    </div>
  );
}
