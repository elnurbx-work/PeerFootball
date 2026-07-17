"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { updateLocaleAction } from "@/actions/settings.actions";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { locales, type Locale } from "@/i18n/config";

export function LanguageSettings() {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [selected, setSelected] = useState(locale);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(true);
  const [toastOpen, setToastOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const names: Record<Locale, string> = {
    az: t("settings.azerbaijani"), en: t("settings.english"), ru: t("settings.russian")
  };

  function change(nextLocale: Locale) {
    setSelected(nextLocale);
    startTransition(async () => {
      const result = await updateLocaleAction(nextLocale);
      setMessage(result.message);
      setSuccess(result.ok);
      setToastOpen(true);
      if (result.ok) router.refresh();
      else setSelected(locale);
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary"><Languages className="h-5 w-5" /></div>
            <div><CardTitle>{t("settings.language")}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{t("settings.languageDescription")}</p></div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          <select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={selected} disabled={pending} onChange={(event) => change(event.target.value as Locale)}>
            {locales.map((item) => <option key={item} value={item}>{names[item]}</option>)}
          </select>
          <p className="text-xs text-muted-foreground">{t("settings.languageHint")}</p>
        </CardContent>
      </Card>
      <Toast message={message} open={toastOpen} variant={success ? "success" : "error"} onOpenChange={setToastOpen} />
    </>
  );
}
