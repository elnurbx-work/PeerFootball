"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import {
  useTheme,
  type ThemeMode
} from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light", labelKey: "settings.themeLight", icon: Sun },
  { value: "dark", labelKey: "settings.themeDark", icon: Moon },
  { value: "system", labelKey: "settings.themeSystem", icon: Monitor }
] as const;

export function CompactThemeControl({
  className,
  showLabel = false
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      {showLabel ? (
        <span className="text-sm font-semibold text-brand-foreground/70">
          {t("settings.theme")}
        </span>
      ) : null}
      <div
        aria-label={t("settings.theme")}
        className="inline-flex rounded-xl border border-white/15 bg-brand-foreground/[0.06] p-1"
        role="radiogroup"
      >
        {themeOptions.map(({ value, labelKey, icon: Icon }) => {
          const selected = mounted && theme === value;
          return (
            <button
              aria-checked={selected}
              aria-label={t(labelKey)}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-lg text-brand-foreground/60 transition-colors hover:bg-brand-foreground/10 hover:text-brand-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected && "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              disabled={!mounted}
              key={value}
              onClick={() => setTheme(value as ThemeMode)}
              role="radio"
              title={t(labelKey)}
              type="button"
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
