import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DirectInbox } from "@/components/direct/direct-inbox";
import { getFriendsForUser } from "@/server/queries/friendship.queries";
import { getConversationMessages, getConversationSummaries } from "@/server/queries/message.queries";
import type { DirectFriend } from "@/types/message.types";

type DirectPageProps = {
  searchParams: Promise<{
    conversationId?: string;
  }>;
};

export default async function DirectPage({ searchParams }: DirectPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const params = await searchParams;
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
  const initialFriend = directFriends.find((friend) => friend.conversationId === params.conversationId) ?? directFriends[0];
  const initialConversationId = initialFriend?.conversationId ?? null;
  const messagesByConversationId = initialConversationId
    ? { [initialConversationId]: await getConversationMessages(initialConversationId, currentUser.id) }
    : {};
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
