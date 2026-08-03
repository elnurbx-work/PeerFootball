"use client";

import { useEffect } from "react";
import { syncExistingPushSubscription } from "@/lib/push-notifications";

const RETRY_DELAYS_MS = [0, 2_000, 10_000];

export function PushSubscriptionSessionSync({ userId }: { userId: string }) {
  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;

    const sync = async (attempt: number) => {
      if (cancelled) return;
      try {
        await syncExistingPushSubscription();
      } catch {
        const nextDelay = RETRY_DELAYS_MS[attempt + 1];
        if (!cancelled && typeof nextDelay === "number") {
          timeoutId = window.setTimeout(() => void sync(attempt + 1), nextDelay);
        }
      }
    };

    void sync(0);
    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [userId]);

  return null;
}
