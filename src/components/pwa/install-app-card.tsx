"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneDisplay() {
  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function getPlatformHint() {
  const userAgent = window.navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return "Safari share menu";
  }

  if (/android/.test(userAgent)) {
    return "browser app menu";
  }

  return "browser address bar";
}

export function InstallAppCard() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [status, setStatus] = useState<"ready" | "idle" | "installed" | "dismissed">("idle");
  const [platformHint, setPlatformHint] = useState("browser menu");

  useEffect(() => {
    setIsInstalled(isStandaloneDisplay());
    setPlatformHint(getPlatformHint());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setStatus("ready");
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
      setStatus("installed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const statusText = useMemo(() => {
    if (isInstalled || status === "installed") {
      return "FanPitch is installed on this device.";
    }

    if (status === "ready") {
      return "FanPitch can be installed from this browser.";
    }

    if (status === "dismissed") {
      return "Install was dismissed. You can try again from the browser menu.";
    }

    return `Use the ${platformHint} to install FanPitch.`;
  }, [isInstalled, platformHint, status]);

  const installApp = async () => {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    setInstallPrompt(null);
    setStatus(choice.outcome === "accepted" ? "installed" : "dismissed");
  };

  return (
    <div className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          {isInstalled || status === "installed" ? (
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          ) : (
            <MonitorSmartphone className="h-6 w-6" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold leading-tight">Install FanPitch</h2>
            <p className="text-sm text-muted-foreground">{statusText}</p>
          </div>
          <Button
            type="button"
            size="lg"
            onClick={installApp}
            disabled={!installPrompt || isInstalled || status === "installed"}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Install app
          </Button>
        </div>
      </div>
    </div>
  );
}
