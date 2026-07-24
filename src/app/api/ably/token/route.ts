import {
  getUserInboxChannelName,
  parseRoomChannelName,
  parseUserInboxChannelName
} from "@/lib/ably-channels";
import { getCurrentUser } from "@/lib/auth";
import { isConversationMember } from "@/server/queries/message.queries";
import { getAblyRestClient } from "@/server/services/ably.service";
import { getServerTranslator } from "@/i18n/server";
import type { Translate } from "@/i18n/dictionary";
import { measureAsync } from "@/lib/performance";
import { privateJson } from "@/lib/http/no-store";

const ONE_HOUR_MS = 60 * 60 * 1000;

export async function GET(request: Request) {
  return measureAsync("ably.tokenRoute", async () => {
    const t = await getServerTranslator();
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return privateJson({ ok: false, message: t("responses.signInRequired") }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel");
    const conversationId = searchParams.get("conversationId");
    const channelName = channel ?? (conversationId ? `private:room:${conversationId}` : null);

    if (!channelName) {
      return privateJson({ ok: false, message: t("responses.api.channelMissing") }, { status: 400 });
    }

    const roomConversationId = parseRoomChannelName(channelName);
    const inboxUserId = parseUserInboxChannelName(channelName);

    if (roomConversationId) {
      if (!(await isConversationMember(roomConversationId, currentUser.id))) {
        return privateJson({ ok: false, message: t("responses.message.conversationNotFound") }, { status: 403 });
      }

      return createTokenRequest(currentUser.id, channelName, ["subscribe", "presence"], t);
    }

    if (inboxUserId) {
      if (channelName !== getUserInboxChannelName(currentUser.id)) {
        return privateJson({ ok: false, message: t("responses.api.inboxForbidden") }, { status: 403 });
      }

      return createTokenRequest(currentUser.id, channelName, ["subscribe"], t);
    }

    return privateJson({ ok: false, message: t("responses.api.channelInvalid") }, { status: 400 });
  }, { route: "/api/ably/token", requestType: "api" });
}

async function createTokenRequest(clientId: string, channelName: string, operations: string[], t: Translate) {
  try {
    const tokenRequest = await getAblyRestClient().auth.createTokenRequest({
      capability: JSON.stringify({
        [channelName]: operations
      }),
      clientId,
      ttl: ONE_HOUR_MS
    });

    return privateJson(tokenRequest);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ably] token request failed", error);
    }

    return privateJson({ ok: false, message: t("responses.api.realtimeUnavailable") }, { status: 503 });
  }
}
