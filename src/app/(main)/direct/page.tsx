import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DirectInbox } from "@/components/direct/direct-inbox";
import { ClubInbox } from "@/components/direct/club-inbox";
import { getFriendsForUser } from "@/server/queries/friendship.queries";
import {
  getClubChatSummaries,
  getConversationMessages,
  getConversationSummaries,
  getMessagingUnreadCounts
} from "@/server/queries/message.queries";
import type { DirectFriend } from "@/types/message.types";
import { cn } from "@/lib/utils";
import { resolveMessagingTab, sortConversationsByLatestMessage, sumUnreadCounts } from "@/lib/messaging/navigation";

type DirectPageProps = {
  searchParams: Promise<{
    tab?: string;
    conversationId?: string;
    clubId?: string;
  }>;
};

export default async function DirectPage({ searchParams }: DirectPageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");

  const params = await searchParams;
  const activeTab = resolveMessagingTab(params.tab);
  const unreadCountsPromise = getMessagingUnreadCounts(currentUser.id);
  const currentMessageUser = {
    id: currentUser.id,
    name: currentUser.name,
    username: currentUser.username ?? null,
    image: currentUser.image ?? null
  };

  let content;
  if (activeTab === "clubs") {
    const clubs = await getClubChatSummaries(currentUser.id);
    const initialClub = clubs.find((club) =>
      params.clubId ? club.clubId === params.clubId : club.conversationId === params.conversationId
    ) ?? null;
    const initialConversationId = initialClub?.conversationId ?? null;
    const messagesByConversationId = initialConversationId
      ? { [initialConversationId]: await getConversationMessages(initialConversationId, currentUser.id) }
      : {};
    content = (
      <ClubInbox
        currentUser={currentMessageUser}
        clubs={clubs}
        initialClubId={initialClub?.clubId ?? null}
        messagesByConversationId={messagesByConversationId}
      />
    );
  } else {
    const [friends, conversations] = await Promise.all([
      getFriendsForUser(currentUser.id),
      getConversationSummaries(currentUser.id)
    ]);
    const directFriends = sortConversationsByLatestMessage(friends.map((friendship): DirectFriend => {
      const conversation = conversations.find(
        (item) => item.members.some((member) => member.id === friendship.user.id)
      );
      return {
        ...friendship.user,
        conversationId: conversation?.id ?? null,
        lastMessage: conversation?.lastMessage ?? null,
        unreadCount: conversation?.unreadCount ?? 0
      };
    }));
    const initialFriend = params.conversationId
      ? directFriends.find((friend) => friend.conversationId === params.conversationId)
      : undefined;
    const initialConversationId = initialFriend?.conversationId ?? null;
    const messagesByConversationId = initialConversationId
      ? { [initialConversationId]: await getConversationMessages(initialConversationId, currentUser.id) }
      : {};
    content = (
      <DirectInbox
        currentUser={currentMessageUser}
        friends={directFriends}
        initialConversationId={initialConversationId}
        messagesByConversationId={messagesByConversationId}
      />
    );
  }

  const unreadCounts = await unreadCountsPromise;
  const directUnreadCount = sumUnreadCounts(unreadCounts.direct);
  const clubUnreadCount = sumUnreadCounts(unreadCounts.clubs);

  return (
    <section className="grid h-[calc(100dvh-5rem)] min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden md:h-screen">
      <nav className="flex min-w-0 items-center gap-2 border-b bg-card px-2 py-2 min-[360px]:px-3 sm:px-4" aria-label="Mesaj növü">
        <MessagingTab href="/direct?tab=messages" active={activeTab === "messages"} label="Şəxsi mesajlar" count={directUnreadCount} />
        <MessagingTab href="/direct?tab=clubs" active={activeTab === "clubs"} label="Klublar" count={clubUnreadCount} />
      </nav>
      <div className="min-h-0">{content}</div>
    </section>
  );
}

function MessagingTab({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition sm:flex-none",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-secondary"
      )}
    >
      <span className="truncate">{label}</span>
      {count ? (
        <span className={cn(
          "rounded-full px-1.5 py-0.5 text-[11px]",
          active ? "bg-primary-foreground/20" : "bg-accent text-accent-foreground"
        )}>
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
