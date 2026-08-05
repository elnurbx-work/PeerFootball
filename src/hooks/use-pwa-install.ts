"use client";

import { useCallback, useEffect, useState } from "react";
import { detectDevice, type Browser, type Platform } from "@/lib/pwa/device-detection";
import { isPwaInstalled } from "@/lib/pwa/install-status";
import {
  requestPwaInstall,
  type BeforeInstallPromptEvent
} from "@/lib/pwa/install-prompt";

export type PwaInstallResult = "accepted" | "dismissed" | "unavailable";

export type PwaInstallState = {
  isReady: boolean;
  isInstalled: boolean;
  isInstallable: boolean;
  isInstalling: boolean;
  platform: Platform;
  browser: Browser;
  installError: boolean;
  install: () => Promise<PwaInstallResult>;
};

export function usePwaInstall(): PwaInstallState {
  const [isReady, setIsReady] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installError, setInstallError] = useState(false);
  const [device, setDevice] = useState<{ platform: Platform; browser: Browser }>({
    platform: "unknown",
    browser: "unknown"
  });
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setDevice(detectDevice());
    setIsInstalled(isPwaInstalled());
    setIsReady(true);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      setInstallError(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<PwaInstallResult> => {
    setInstallError(false);
    if (!deferredPrompt) return "unavailable";

    setIsInstalling(true);
    try {
      const outcome = await requestPwaInstall(deferredPrompt);
      setDeferredPrompt(null);
      return outcome;
    } catch {
      setDeferredPrompt(null);
      setInstallError(true);
      return "unavailable";
    } finally {
      setIsInstalling(false);
    }
  }, [deferredPrompt]);

  return {
    isReady,
    isInstalled,
    isInstallable: deferredPrompt !== null,
    isInstalling,
    platform: device.platform,
    browser: device.browser,
    installError,
    install
  };
}
