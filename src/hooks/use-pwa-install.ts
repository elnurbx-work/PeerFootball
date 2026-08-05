"use client";

import {
  usePwaInstallContext,
  type PwaInstallContextValue,
  type PwaInstallResult
} from "@/components/pwa/pwa-install-provider";

export type PwaInstallState = PwaInstallContextValue;
export type { PwaInstallResult };

export function usePwaInstall(): PwaInstallState {
  return usePwaInstallContext();
}
