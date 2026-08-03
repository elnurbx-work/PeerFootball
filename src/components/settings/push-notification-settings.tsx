"use client";

import { useEffect, useState } from "react";
import { BellOff, BellRing, Loader2, Send, Smartphone } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { usePushNotifications } from "@/lib/use-push-notifications";

export function PushNotificationSettings() {
  const { t } = useI18n();
  const push = usePushNotifications();
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [toast, setToast] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setIsIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && navigator.standalone === true));
  }, []);

  async function enable() {
    if (await push.enableNotifications()) setToast(t("settings.pushEnabledSuccess"));
  }

  async function disable() {
    if (await push.disableNotifications()) setToast(t("settings.pushDisabledSuccess"));
  }

  async function sendTest() {
    setTesting(true);
    try {
      const response = await fetch("/api/push/test", { method: "POST", credentials: "same-origin" });
      const result = await response.json() as { ok: boolean; message?: string };
      setToast(result.message || (result.ok ? t("settings.pushTestSent") : t("settings.pushError")));
    } catch {
      setToast(t("settings.pushError"));
    } finally {
      setTesting(false);
    }
  }

  const status = getStatusText(push, t);

  return (
    <>
      <Toast message={toast} open={Boolean(toast)} onOpenChange={(open) => !open && setToast("")} />
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              {push.subscribed ? <BellRing aria-hidden="true" className="h-5 w-5" /> : <BellOff aria-hidden="true" className="h-5 w-5" />}
            </div>
            <div>
              <CardTitle>{t("settings.pushTitle")}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{t("settings.pushDescription")}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-surface p-4" role="status" aria-live="polite">
            <p className="font-semibold">{status.title}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{status.description}</p>
          </div>

          {isIos && !isStandalone ? (
            <div className="flex gap-3 rounded-lg border border-accent/40 bg-accent/10 p-4 text-sm leading-6">
              <Smartphone aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-accent-foreground" />
              <p>{t("settings.pushIosHelp")}</p>
            </div>
          ) : null}

          {push.error ? <p className="text-sm text-destructive" role="alert">{friendlyError(push.error, t)}</p> : null}

          <div className="flex flex-wrap gap-2">
            {push.subscribed ? (
              <Button disabled={push.loading} onClick={disable} type="button" variant="outline">
                {push.loading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <BellOff aria-hidden="true" className="h-4 w-4" />}
                {t("settings.pushDisable")}
              </Button>
            ) : (
              <Button disabled={push.loading || !push.enabled || !push.supported || push.permission === "denied"} onClick={enable} type="button">
                {push.loading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <BellRing aria-hidden="true" className="h-4 w-4" />}
                {t("settings.pushEnable")}
              </Button>
            )}
            {process.env.NODE_ENV !== "production" && push.subscribed ? (
              <Button disabled={testing} onClick={sendTest} type="button" variant="outline">
                {testing ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Send aria-hidden="true" className="h-4 w-4" />}
                {t("settings.pushTest")}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

type Translator = ReturnType<typeof useI18n>["t"];

function getStatusText(push: ReturnType<typeof usePushNotifications>, t: Translator) {
  if (push.loading) return { title: t("settings.pushChecking"), description: t("settings.pushCheckingDescription") };
  if (!push.enabled) return { title: t("settings.pushUnavailable"), description: t("settings.pushUnavailableDescription") };
  if (!push.supported) return { title: t("settings.pushUnsupported"), description: t("settings.pushUnsupportedDescription") };
  if (push.permission === "denied") return { title: t("settings.pushBlocked"), description: t("settings.pushBlockedDescription") };
  if (push.subscribed) return { title: t("settings.pushActive"), description: t("settings.pushActiveDescription") };
  return { title: t("settings.pushInactive"), description: t("settings.pushInactiveDescription") };
}

function friendlyError(error: string, t: Translator) {
  if (error === "permission-denied") return t("settings.pushBlockedDescription");
  if (error === "unsupported") return t("settings.pushUnsupportedDescription");
  if (error === "vapid-public-key-missing" || error === "disabled") return t("settings.pushUnavailableDescription");
  return error.includes(" ") ? error : t("settings.pushError");
}
