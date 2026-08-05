"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Languages } from "lucide-react";
import { updateLocaleAction } from "@/actions/settings.actions";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { locales, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const flags: Record<Locale, string> = { az: "🇦🇿", en: "🇬🇧", ru: "🇷🇺" };

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
          <fieldset disabled={pending}>
            <legend className="sr-only">{t("settings.language")}</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {locales.map((item) => {
                const active = selected === item;
                return (
                  <label
                    key={item}
                    className={cn(
                      "relative flex cursor-pointer items-center gap-3 rounded-lg border bg-surface p-4 transition-colors hover:bg-surface-hover focus-within:ring-2 focus-within:ring-ring",
                      active && "border-primary bg-primary/10"
                    )}
                  >
                    <input
                      type="radio"
                      name="locale"
                      value={item}
                      checked={active}
                      className="sr-only"
                      onChange={() => change(item)}
                    />
                    <span className="text-2xl" aria-hidden="true">{flags[item]}</span>
                    <span className="min-w-0 flex-1 font-semibold">{names[item]}</span>
                    {active ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <p className="text-xs text-muted-foreground">{t("settings.languageHint")}</p>
        </CardContent>
      </Card>
      <Toast message={message} open={toastOpen} variant={success ? "success" : "error"} onOpenChange={setToastOpen} />
    </>
  );
}
