import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DirectInbox } from "@/components/direct/direct-inbox";
import { getFriendsForUser } from "@/server/queries/friendship.queries";
import { getConversationMessages, getConversationSummaries } from "@/server/queries/message.queries";
import type { DirectFriend } from "@/types/message.types";

export default async function DirectPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const [friends, conversations] = await Promise.all([
    getFriendsForUser(currentUser.id),
    getConversationSummaries(currentUser.id)
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
  const conversationIds = [...new Set(directFriends.map((friend) => friend.conversationId).filter(Boolean))] as string[];
  const messagesByConversationId = Object.fromEntries(
    await Promise.all(
      conversationIds.map(async (conversationId) => [
        conversationId,
        await getConversationMessages(conversationId, currentUser.id)
      ] as const)
    )
  );
  const currentMessageUser = {
    id: currentUser.id,
    name: currentUser.name,
    username: currentUser.username ?? null,
    image: currentUser.image ?? null
  };

  return (
    <section className="grid h-dvh overflow-hidden">
      <DirectInbox
        currentUser={currentMessageUser}
        friends={directFriends}
        messagesByConversationId={messagesByConversationId}
      />
    </section>
  );
}
