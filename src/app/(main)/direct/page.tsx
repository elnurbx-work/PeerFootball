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
      lastMessage: conversation?.lastMessage ?? null
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

  return (
    <section className="grid min-h-[calc(100vh-5rem)] md:min-h-screen">
      <DirectInbox
        currentUserId={currentUser.id}
        friends={directFriends}
        messagesByConversationId={messagesByConversationId}
      />
    </section>
  );
}
