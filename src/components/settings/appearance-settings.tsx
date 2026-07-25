"use client";

import { useEffect, useState } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import {
  useTheme,
  type ThemeMode
} from "@/components/providers/theme-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MessageKey } from "@/i18n/config";
import { cn } from "@/lib/utils";

const options: Array<{
  value: ThemeMode;
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  icon: typeof Sun;
}> = [
  {
    value: "light",
    titleKey: "settings.themeLight",
    descriptionKey: "settings.themeLightDescription",
    icon: Sun
  },
  {
    value: "dark",
    titleKey: "settings.themeDark",
    descriptionKey: "settings.themeDarkDescription",
    icon: Moon
  },
  {
    value: "system",
    titleKey: "settings.themeSystem",
    descriptionKey: "settings.themeSystemDescription",
    icon: Monitor
  }
];

export function AppearanceSettings() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Monitor aria-hidden="true" className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>{t("settings.theme")}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("settings.themeDescription")}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <fieldset disabled={!mounted}>
          <legend className="sr-only">{t("settings.theme")}</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {options.map(({ value, titleKey, descriptionKey, icon: Icon }) => {
              const selected = mounted && theme === value;
              return (
                <label
                  className={cn(
                    "relative flex cursor-pointer gap-3 rounded-lg border bg-surface p-4 transition-colors hover:bg-surface-hover focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
                    selected && "border-primary bg-primary/10"
                  )}
                  key={value}
                >
                  <input
                    checked={selected}
                    className="sr-only"
                    name="theme"
                    onChange={() => setTheme(value)}
                    type="radio"
                    value={value}
                  />
                  <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-semibold">
                      {t(titleKey)}
                      {selected ? (
                        <Check aria-label={t("settings.themeSelected")} className="h-4 w-4 text-primary" />
                      ) : null}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {t(descriptionKey)}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("settings.themeHint")}
        </p>
      </CardContent>
    </Card>
  );
}
