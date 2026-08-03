"use client";

import { useState } from "react";
import { BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import {
  isPushSupported,
  subscribeToPush,
  webPushFeatureEnabled
} from "@/lib/push-notifications";
import type { PushTestResponseData } from "@/types/push.types";

type TestPhase = "idle" | "permission" | "subscribing" | "sending" | "success" | "error";

type TestResult = PushTestResponseData & {
  permission: NotificationPermission;
  subscription: "active";
  testedAt: string;
};

const PHASE_LABELS: Record<TestPhase, string> = {
  idle: "Test push bildirişi göndər",
  permission: "Bildiriş icazəsi gözlənilir...",
  subscribing: "Cihaz qoşulur...",
  sending: "Test bildirişi göndərilir...",
  success: "Test push göndərildi",
  error: "Push göndərilmədi"
};

// TEMPORARY: Remove after Web Push production verification.
export function FeedPushTestButton() {
  const [phase, setPhase] = useState<TestPhase>("idle");
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState("");
  const loading = phase === "permission" || phase === "subscribing" || phase === "sending";

  async function sendTestPush() {
    if (loading) return;
    setError("");
    setResult(null);

    try {
      if (!webPushFeatureEnabled) throw new Error("Web Push aktiv deyil.");
      if (!isPushSupported()) throw new Error("Bu browser Web Push bildirişlərini dəstəkləmir.");
      if (Notification.permission === "denied") {
        throw new Error("Bildiriş icazəsi bloklanıb. Browser ayarlarından icazəni açın.");
      }

      await subscribeToPush({
        onPermissionRequest: () => setPhase("permission"),
        onSubscribing: () => setPhase("subscribing")
      });

      setPhase("sending");
      const response = await fetch("/api/push/test", {
        method: "POST",
        credentials: "same-origin"
      });
      const payload = await readTestResponse(response);
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.message || "Push göndərilmədi");
      }

      setResult({
        ...payload.data,
        permission: Notification.permission,
        subscription: "active",
        testedAt: new Date().toISOString()
      });
      setPhase("success");
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : "Push göndərilmədi");
      setPhase("error");
    }
  }

  const providerStatuses = result
    ? [...new Set(result.results.map((item) => item.statusCode).filter((code): code is number => typeof code === "number"))]
    : [];

  return (
    <div className="mt-4 rounded-lg border border-dashed bg-surface/60 p-3">
      <Toast
        message={phase === "success" ? "Test push göndərildi" : error}
        open={phase === "success" || Boolean(error)}
        variant={phase === "success" ? "success" : "error"}
        onOpenChange={(open) => {
          if (!open) {
            setError("");
            if (phase === "success") setPhase("idle");
          }
        }}
      />
      <Button
        className="w-full sm:w-auto"
        disabled={loading}
        onClick={sendTestPush}
        type="button"
        variant="outline"
      >
        {loading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <BellRing aria-hidden="true" className="h-4 w-4" />}
        {PHASE_LABELS[phase]}
      </Button>

      {error ? <p className="mt-2 text-sm text-destructive" role="alert">{error}</p> : null}
      {result ? (
        <dl className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 text-xs" aria-live="polite">
          <dt className="text-muted-foreground">Permission</dt><dd>{result.permission}</dd>
          <dt className="text-muted-foreground">Subscription</dt><dd>{result.subscription}</dd>
          <dt className="text-muted-foreground">Backend subscriptions</dt><dd>{result.subscriptionCount}</dd>
          <dt className="text-muted-foreground">Attempted</dt><dd>{result.attempted}</dd>
          <dt className="text-muted-foreground">Sent</dt><dd>{result.sent}</dd>
          <dt className="text-muted-foreground">Failed</dt><dd>{result.failed}</dd>
          <dt className="text-muted-foreground">Expired removed</dt><dd>{result.expiredRemoved}</dd>
          <dt className="text-muted-foreground">Provider status</dt><dd>{providerStatuses.join(", ") || "—"}</dd>
          <dt className="text-muted-foreground">Test vaxtı</dt><dd>{new Date(result.testedAt).toLocaleString("az-AZ")}</dd>
        </dl>
      ) : null}
    </div>
  );
}

async function readTestResponse(response: Response): Promise<{
  success: boolean;
  message?: string;
  data?: PushTestResponseData;
}> {
  try {
    return await response.json() as {
      success: boolean;
      message?: string;
      data?: PushTestResponseData;
    };
  } catch {
    return { success: false, message: "Server düzgün cavab qaytarmadı." };
  }
}
