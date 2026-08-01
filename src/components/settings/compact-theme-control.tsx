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
  showLabel = false,
  variant = "default"
}: {
  className?: string;
  showLabel?: boolean;
  variant?: "default" | "inverse";
}) {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      {showLabel ? (
        <span className={cn(
          "text-sm font-semibold",
          variant === "inverse" ? "text-white/75" : "text-muted-foreground"
        )}>
          {t("settings.theme")}
        </span>
      ) : null}
      <div
        aria-label={t("settings.theme")}
        className={cn(
          "inline-flex rounded-xl border p-1",
          variant === "inverse"
            ? "border-white/20 bg-white/10"
            : "border-border bg-secondary/70"
        )}
        role="radiogroup"
      >
        {themeOptions.map(({ value, labelKey, icon: Icon }) => {
          const selected = mounted && theme === value;
          return (
            <button
              aria-checked={selected}
              aria-label={t(labelKey)}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                variant === "inverse"
                  ? "text-white/75 hover:bg-white/15 hover:text-white"
                  : "text-foreground/70 hover:bg-background hover:text-foreground",
                selected && "bg-accent text-accent-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
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
