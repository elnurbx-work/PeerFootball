import { getCurrentUser } from "@/lib/auth";
import { privateJson } from "@/lib/http/no-store";
import { isSameOriginMutation } from "@/lib/http/same-origin";
import { sendPushToUser } from "@/server/services/push-notification.service";
import { getServerTranslator } from "@/i18n/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const t = await getServerTranslator();
  if (process.env.NODE_ENV === "production") {
    return privateJson({ ok: false, message: t("responses.pushApi.notFound") }, { status: 404 });
  }
  const user = await getCurrentUser();
  if (!user) return privateJson({ ok: false, message: t("responses.signInRequired") }, { status: 401 });
  if (!isSameOriginMutation(request)) return privateJson({ ok: false, message: t("responses.pushApi.originInvalid") }, { status: 403 });

  const result = await sendPushToUser({
    userId: user.id,
    payload: {
      title: t("responses.pushApi.testTitle"),
      body: t("responses.pushApi.testBody"),
      icon: "/icons/icon-192",
      badge: "/icons/icon-192",
      tag: "peerfootball-push-test",
      url: "/settings?tab=notifications",
      type: "TEST"
    }
  });

  return privateJson({
    ok: result.sent > 0,
    message: result.sent > 0 ? t("responses.pushApi.testSent") : t("responses.pushApi.testFailed"),
    data: result
  }, { status: result.sent > 0 ? 200 : 503 });
}
