"use client";

import { LogOut } from "lucide-react";
import { signOutAction } from "@/actions/auth.actions";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AccountSettings() {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle>{t("settings.signOutTitle")}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t("settings.signOutDescription")}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form action={signOutAction}>
          <Button type="submit" variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 sm:w-auto">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {t("settings.signOutButton")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
