import { NextResponse } from "next/server";
import {
  getUserInboxChannelName,
  parseRoomChannelName,
  parseUserInboxChannelName
} from "@/lib/ably-channels";
import { getCurrentUser } from "@/lib/auth";
import { isConversationMember } from "@/server/queries/message.queries";
import { getAblyRestClient } from "@/server/services/ably.service";

const ONE_HOUR_MS = 60 * 60 * 1000;

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ ok: false, message: "You need to sign in first." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const channel = searchParams.get("channel");
  const conversationId = searchParams.get("conversationId");
  const channelName = channel ?? (conversationId ? `private:room:${conversationId}` : null);

  if (!channelName) {
    return NextResponse.json({ ok: false, message: "Missing Ably channel." }, { status: 400 });
  }

  const roomConversationId = parseRoomChannelName(channelName);
  const inboxUserId = parseUserInboxChannelName(channelName);

  if (roomConversationId) {
    if (!(await isConversationMember(roomConversationId, currentUser.id))) {
      return NextResponse.json({ ok: false, message: "Conversation was not found." }, { status: 403 });
    }

    return createTokenRequest(currentUser.id, channelName, ["subscribe", "presence"]);
  }

  if (inboxUserId) {
    if (channelName !== getUserInboxChannelName(currentUser.id)) {
      return NextResponse.json({ ok: false, message: "You cannot subscribe to this inbox." }, { status: 403 });
    }

    return createTokenRequest(currentUser.id, channelName, ["subscribe"]);
  }

  return NextResponse.json({ ok: false, message: "Invalid Ably channel." }, { status: 400 });
}

async function createTokenRequest(clientId: string, channelName: string, operations: string[]) {
  try {
    const tokenRequest = await getAblyRestClient().auth.createTokenRequest({
      capability: JSON.stringify({
        [channelName]: operations
      }),
      clientId,
      ttl: ONE_HOUR_MS
    });

    return NextResponse.json(tokenRequest);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ably] token request failed", error);
    }

    return NextResponse.json({ ok: false, message: "Realtime auth is unavailable." }, { status: 503 });
  }
}
