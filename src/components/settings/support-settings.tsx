"use client";

import Link from "next/link";
import { ArrowRight, CircleHelp, LifeBuoy, Mail, MessageSquareText, ShieldCheck } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const supportLinks = [
  { href: "/feedback", titleKey: "settings.supportFeedback", descriptionKey: "settings.supportFeedbackDescription", icon: MessageSquareText },
  { href: "/contact", titleKey: "settings.supportContact", descriptionKey: "settings.supportContactDescription", icon: Mail },
  { href: "/help", titleKey: "settings.supportHelp", descriptionKey: "settings.supportHelpDescription", icon: CircleHelp },
  { href: "/community-guidelines", titleKey: "settings.supportGuidelines", descriptionKey: "settings.supportGuidelinesDescription", icon: ShieldCheck }
] as const;

export function SupportSettings() {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>{t("settings.supportTitle")}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t("settings.supportDescription")}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {supportLinks.map(({ href, titleKey, descriptionKey, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-w-0 items-start gap-3 rounded-lg border bg-surface p-4 transition-colors hover:border-primary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{t(titleKey)}</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">{t(descriptionKey)}</span>
            </span>
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
