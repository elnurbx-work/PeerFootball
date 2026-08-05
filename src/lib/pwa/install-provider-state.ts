import type { BeforeInstallPromptEvent, PwaInstallResult } from "./install-prompt";

export type PwaProviderState = {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  lastResult: PwaInstallResult | null;
};

export type PwaProviderAction =
  | { type: "prompt-available"; prompt: BeforeInstallPromptEvent }
  | { type: "installed" }
  | { type: "install-result"; result: PwaInstallResult };

export const initialPwaProviderState: PwaProviderState = {
  deferredPrompt: null,
  isInstalled: false,
  lastResult: null
};

export function pwaProviderReducer(
  state: PwaProviderState,
  action: PwaProviderAction
): PwaProviderState {
  if (action.type === "prompt-available") {
    return { ...state, deferredPrompt: action.prompt, lastResult: null };
  }
  if (action.type === "installed") {
    return { deferredPrompt: null, isInstalled: true, lastResult: "accepted" };
  }
  return { ...state, deferredPrompt: null, lastResult: action.result };
}
