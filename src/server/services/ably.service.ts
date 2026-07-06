import "server-only";

type AblyEventPayload = {
  name: string;
  data: Record<string, unknown>;
};

export async function publishAblyEvent(channelName: string, event: AblyEventPayload) {
  const apiKey = process.env.ABLY_API_KEY;

  if (!apiKey) {
    return { ok: true, skipped: true };
  }

  try {
    const response = await fetch(`https://rest.ably.io/channels/${encodeURIComponent(channelName)}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(apiKey).toString("base64")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(event)
    });

    return {
      ok: response.ok,
      skipped: false
    };
  } catch {
    return {
      ok: false,
      skipped: false
    };
  }
}

export async function publishMessageCreatedEvent({
  conversationId,
  createdAt,
  messageId,
  senderId
}: {
  conversationId: string;
  createdAt: string;
  messageId: string;
  senderId: string;
}) {
  return publishAblyEvent(`conversation:${conversationId}`, {
    name: "message.created",
    data: {
      conversationId,
      messageId,
      senderId,
      createdAt
    }
  });
}

export async function publishMessageDeletedEvent({
  conversationId,
  deletedAt,
  messageId
}: {
  conversationId: string;
  deletedAt: string;
  messageId: string;
}) {
  return publishAblyEvent(`conversation:${conversationId}`, {
    name: "message.deleted",
    data: {
      conversationId,
      messageId,
      deletedAt
    }
  });
}
