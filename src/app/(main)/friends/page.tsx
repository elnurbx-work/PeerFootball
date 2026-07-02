import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getFriendsForUser,
  getIncomingFriendRequestsForUser,
  getOutgoingFriendRequestsForUser
} from "@/server/queries/friendship.queries";
import { FriendsList } from "@/components/friends/FriendsList";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/friends?tab=friends", key: "friends", label: "Friends" },
  { href: "/friends?tab=incoming", key: "incoming", label: "Incoming Requests" },
  { href: "/friends?tab=sent", key: "sent", label: "Sent Requests" }
];

type FriendsPageProps = {
  searchParams: Promise<{
    tab?: string;
  }>;
};

export default async function FriendsPage({ searchParams }: FriendsPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const params = await searchParams;
  const activeTab = tabs.some((tab) => tab.key === params.tab) ? params.tab : "friends";
  const [friends, incoming, outgoing] = await Promise.all([
    getFriendsForUser(currentUser.id),
    getIncomingFriendRequestsForUser(currentUser.id),
    getOutgoingFriendRequestsForUser(currentUser.id)
  ]);

  return (
    <section className="mx-auto grid max-w-4xl gap-5 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold">Friends</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage friendships before direct messaging arrives.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2 border-b">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {activeTab === "friends" ? (
        <FriendsList items={friends} mode="friend" emptyMessage="No friends yet." />
      ) : null}
      {activeTab === "incoming" ? (
        <FriendsList items={incoming} mode="incoming" emptyMessage="No incoming friend requests." />
      ) : null}
      {activeTab === "sent" ? (
        <FriendsList items={outgoing} mode="outgoing" emptyMessage="No sent friend requests." />
      ) : null}
    </section>
  );
}
