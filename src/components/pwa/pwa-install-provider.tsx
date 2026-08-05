"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode
} from "react";
import { detectDevice, type Browser, type Platform } from "@/lib/pwa/device-detection";
import { isPwaInstalled } from "@/lib/pwa/install-status";
import {
  requestPwaInstall,
  type BeforeInstallPromptEvent,
  type PwaInstallResult
} from "@/lib/pwa/install-prompt";
import {
  initialPwaProviderState,
  pwaProviderReducer
} from "@/lib/pwa/install-provider-state";

export type { PwaInstallResult } from "@/lib/pwa/install-prompt";

export type PwaInstallContextValue = {
  isReady: boolean;
  isInstalled: boolean;
  canInstall: boolean;
  isInstalling: boolean;
  platform: Platform;
  browser: Browser;
  installError: boolean;
  lastResult: PwaInstallResult | null;
  install: () => Promise<PwaInstallResult>;
};

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installState, dispatch] = useReducer(pwaProviderReducer, initialPwaProviderState);
  const [device, setDevice] = useState<{ platform: Platform; browser: Browser }>({
    platform: "unknown",
    browser: "unknown"
  });
  const installLock = useRef(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      dispatch({ type: "prompt-available", prompt: event as BeforeInstallPromptEvent });
    };
    const handleAppInstalled = () => {
      dispatch({ type: "installed" });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    setDevice(detectDevice());
    if (isPwaInstalled()) dispatch({ type: "installed" });
    setIsReady(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<PwaInstallResult> => {
    if (!installState.deferredPrompt) return "unavailable";
    if (installLock.current) return "unavailable";

    installLock.current = true;
    setIsInstalling(true);
    try {
      const result = await requestPwaInstall(installState.deferredPrompt);
      dispatch({ type: "install-result", result });
      return result;
    } catch {
      dispatch({ type: "install-result", result: "error" });
      return "error";
    } finally {
      installLock.current = false;
      setIsInstalling(false);
    }
  }, [installState.deferredPrompt]);

  const value = useMemo<PwaInstallContextValue>(() => ({
    isReady,
    isInstalled: installState.isInstalled,
    canInstall: installState.deferredPrompt !== null,
    isInstalling,
    platform: device.platform,
    browser: device.browser,
    installError: installState.lastResult === "error",
    lastResult: installState.lastResult,
    install
  }), [device.browser, device.platform, install, installState, isInstalling, isReady]);

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}

export function usePwaInstallContext() {
  const value = useContext(PwaInstallContext);
  if (!value) throw new Error("usePwaInstall must be used inside PwaInstallProvider.");
  return value;
}
