import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DirectInbox } from "@/components/direct/direct-inbox";
import { getFriendsForUser } from "@/server/queries/friendship.queries";
import { getConversationMessages, getConversationSummaries } from "@/server/queries/message.queries";
import type { DirectFriend } from "@/types/message.types";
import { logPerformance, measureAsync, performanceNow } from "@/lib/performance";

type DirectPageProps = {
  searchParams: Promise<{
    conversationId?: string;
  }>;
};

export default async function DirectPage({ searchParams }: DirectPageProps) {
  const totalStartedAt = performanceNow();
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const params = await searchParams;
  const friendsMetadata = { route: "/direct", friendCount: 0 };
  const conversationsMetadata = { route: "/direct", conversationCount: 0 };
  const [friends, conversations] = await Promise.all([
    measureAsync("direct.friends", async () => {
      const result = await getFriendsForUser(currentUser.id);
      friendsMetadata.friendCount = result.length;
      return result;
    }, friendsMetadata),
    measureAsync("direct.conversations", async () => {
      const result = await measureAsync(
        "direct.conversationsPage",
        () => getConversationSummaries(currentUser.id),
        { route: "/direct" }
      );
      conversationsMetadata.conversationCount = result.length;
      return result;
    }, conversationsMetadata)
  ]);
  const directFriends = friends.map((friendship): DirectFriend => {
    const conversation = conversations.find(
      (item) => item.type === "DIRECT" && item.members.some((member) => member.id === friendship.user.id)
    );

    return {
      ...friendship.user,
      conversationId: conversation?.id ?? null,
      lastMessage: conversation?.lastMessage ?? null,
      unreadCount: conversation?.unreadCount ?? 0
    };
  });
  const initialFriend = directFriends.find((friend) => friend.conversationId === params.conversationId) ?? directFriends[0];
  const initialConversationId = initialFriend?.conversationId ?? null;
  const initialMessagesMetadata = {
    route: "/direct",
    initialMessageCount: 0,
    hasInitialConversation: Boolean(initialConversationId)
  };
  const messagesByConversationId = initialConversationId
    ? { [initialConversationId]: await measureAsync("direct.initialMessages", async () => {
        const result = await measureAsync(
          "direct.messagesPage",
          () => getConversationMessages(initialConversationId, currentUser.id),
          { route: "/direct" }
        );
        initialMessagesMetadata.initialMessageCount = result.length;
        return result;
      }, initialMessagesMetadata) }
    : {};
  if (!initialConversationId) {
    logPerformance("direct.initialMessages", 0, "success", initialMessagesMetadata);
  }
  const initialMessageCount = initialConversationId ? messagesByConversationId[initialConversationId]?.length ?? 0 : 0;
  logPerformance("direct.totalData", performanceNow() - totalStartedAt, "success", {
    route: "/direct",
    friendCount: friends.length,
    conversationCount: conversations.length,
    initialMessageCount,
    hasInitialConversation: Boolean(initialConversationId)
  });
  const currentMessageUser = {
    id: currentUser.id,
    name: currentUser.name,
    username: currentUser.username ?? null,
    image: currentUser.image ?? null
  };

  return (
    <section className="grid h-[calc(100dvh-5rem)] overflow-hidden md:h-screen">
      <DirectInbox
        currentUser={currentMessageUser}
        friends={directFriends}
        initialConversationId={initialConversationId}
        messagesByConversationId={messagesByConversationId}
      />
    </section>
  );
}
