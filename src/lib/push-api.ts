import type { PushSubscriptionInput } from "@/types/push.types";

export function getPushRequestAuthError(userId: string | null | undefined, request: Request) {
  if (!userId) return 401 as const;
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return 403 as const;
  const origin = request.headers.get("origin");
  if (!origin) return null;
  try {
    return new URL(origin).origin === new URL(request.url).origin ? null : 403 as const;
  } catch {
    return 403 as const;
  }
}

export function buildPushSubscriptionUpsert(input: {
  userId: string;
  subscription: PushSubscriptionInput;
  userAgent: string | null;
  platform: string;
  now: Date;
}) {
  const values = {
    userId: input.userId,
    p256dh: input.subscription.keys.p256dh,
    auth: input.subscription.keys.auth,
    userAgent: input.userAgent?.slice(0, 512) ?? null,
    platform: input.platform.slice(0, 100),
    lastUsedAt: input.now
  };
  return {
    where: { endpoint: input.subscription.endpoint },
    update: values,
    create: { ...values, endpoint: input.subscription.endpoint }
  };
}

export function buildOwnedSubscriptionWhere(userId: string, endpoint: string) {
  return { endpoint, userId };
}
