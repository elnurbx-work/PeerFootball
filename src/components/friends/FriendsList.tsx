import { FriendRequestCard } from "@/components/friends/FriendRequestCard";
import type { FriendshipWithUser } from "@/types/friendship.types";

type FriendsListProps = {
  items: FriendshipWithUser[];
  mode: "incoming" | "outgoing" | "friend";
  emptyMessage: string;
};

export function FriendsList({ items, mode, emptyMessage }: FriendsListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <FriendRequestCard key={item.id} friendship={item} mode={mode} />
      ))}
    </div>
  );
}
