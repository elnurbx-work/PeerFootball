"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getPushStatus,
  subscribeToPush,
  unsubscribeFromPush,
  webPushFeatureEnabled
} from "@/lib/push-notifications";

export function usePushNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [enabled, setEnabled] = useState(webPushFeatureEnabled);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await getPushStatus();
      setSupported(status.supported);
      setPermission(status.permission);
      setSubscribed(status.subscribed);
      setEnabled(status.enabled);
    } catch (statusError) {
      setError(toErrorMessage(statusError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const enableNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await subscribeToPush();
      await refreshStatus();
      return true;
    } catch (subscribeError) {
      setError(toErrorMessage(subscribeError));
      setPermission(typeof Notification === "undefined" ? "default" : Notification.permission);
      setLoading(false);
      return false;
    }
  }, [refreshStatus]);

  const disableNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await unsubscribeFromPush();
      setSubscribed(false);
      return true;
    } catch (unsubscribeError) {
      setError(toErrorMessage(unsubscribeError));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    enabled,
    supported,
    permission,
    subscribed,
    loading,
    error,
    enableNotifications,
    disableNotifications,
    refreshStatus
  };
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "unknown-error";
}
