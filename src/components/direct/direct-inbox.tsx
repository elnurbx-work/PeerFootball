"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Send, Trash2, Users } from "lucide-react";
import { deleteMessageAction, sendMessageAction } from "@/actions/message.actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Toast } from "@/components/ui/toast";
import { MESSAGE_CONTENT_MAX_LENGTH } from "@/lib/validations/message";
import { cn } from "@/lib/utils";
import type { ChatMessage, DirectFriend } from "@/types/message.types";

type DirectInboxProps = {
  currentUserId: string;
  friends: DirectFriend[];
  messagesByConversationId: Record<string, ChatMessage[]>;
};

export function DirectInbox({ currentUserId, friends, messagesByConversationId }: DirectInboxProps) {
  const router = useRouter();
  const [selectedFriendId, setSelectedFriendId] = useState(friends[0]?.id ?? "");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const selectedFriend = friends.find((friend) => friend.id === selectedFriendId) ?? friends[0] ?? null;
  const messages = selectedFriend?.conversationId ? messagesByConversationId[selectedFriend.conversationId] ?? [] : [];
  const trimmedLength = content.trim().length;

  const friendRows = useMemo(
    () =>
      friends.map((friend) => ({
        ...friend,
        displayName: friend.name ?? "FanPitch Player",
        preview: friend.lastMessage?.content ?? "Start a conversation"
      })),
    [friends]
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFriend || !trimmedLength) {
      return;
    }

    setError(null);
    setToastMessage(null);

    startTransition(async () => {
      const result = await sendMessageAction({
        conversationId: selectedFriend.conversationId ?? undefined,
        recipientId: selectedFriend.conversationId ? undefined : selectedFriend.id,
        content
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setContent("");
      router.refresh();
    });
  }

  function handleDeleteMessage(messageId: string) {
    setError(null);
    setToastMessage(null);

    startTransition(async () => {
      const result = await deleteMessageAction(messageId);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setToastMessage(result.message);
      router.refresh();
    });
  }

  if (!friends.length) {
    return (
      <div className="rounded-md border bg-card p-8 text-center">
        <Users className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-3 text-lg font-semibold">No friends yet</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Accepted friends will appear here so you can start a direct message.
        </p>
      </div>
    );
  }

  return (
    <>
      <Toast message={toastMessage ?? ""} open={Boolean(toastMessage)} onOpenChange={(open) => !open && setToastMessage(null)} />
      <div className="grid min-h-[calc(100vh-12rem)] overflow-hidden border-y bg-card md:min-h-0 md:h-full md:grid-cols-[300px_1fr] md:border">
        <aside className="border-b md:border-b-0 md:border-r">
          <div className="border-b p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MessageCircle className="h-4 w-4 text-primary" />
              Friends
            </div>
            <p className="mt-1 text-xs text-muted-foreground">All accepted friends are available for direct messages.</p>
          </div>
          <div className="max-h-[300px] overflow-y-auto md:max-h-none">
            {friendRows.map((friend) => (
              <button
                key={friend.id}
                className={cn(
                  "flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-secondary",
                  selectedFriend?.id === friend.id && "bg-secondary"
                )}
                type="button"
                onClick={() => {
                  setSelectedFriendId(friend.id);
                  setError(null);
                }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {friend.image ? <img src={friend.image} alt="" className="h-full w-full object-cover" /> : friend.displayName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{friend.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">@{friend.username ?? "profile"}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{friend.preview}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-[520px] flex-col md:min-h-0">
          {selectedFriend ? (
            <>
              <div className="flex items-center gap-3 border-b p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-semibold">
                  {selectedFriend.image ? (
                    <img src={selectedFriend.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (selectedFriend.name ?? "FanPitch Player").charAt(0)
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{selectedFriend.name ?? "FanPitch Player"}</h2>
                  <p className="truncate text-sm text-muted-foreground">@{selectedFriend.username ?? "profile"}</p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-background/50 p-4">
                {messages.length ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn("flex", message.isOwnMessage ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "group max-w-[82%] rounded-md border px-3 py-2",
                          message.isOwnMessage ? "bg-primary text-primary-foreground" : "bg-card"
                        )}
                      >
                        <p className={cn("whitespace-pre-wrap break-words text-sm leading-6", message.deletedAt && "italic opacity-75")}>
                          {message.content}
                        </p>
                        <div className={cn("mt-1 flex items-center gap-2 text-[11px]", message.isOwnMessage ? "text-primary-foreground/75" : "text-muted-foreground")}>
                          <span>{formatRelativeTime(message.createdAt)}</span>
                          {message.senderId === currentUserId && !message.deletedAt ? (
                            <button
                              className="inline-flex items-center gap-1 opacity-80 hover:opacity-100 disabled:opacity-50"
                              type="button"
                              disabled={pending}
                              onClick={() => handleDeleteMessage(message.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                    <MessageCircle className="h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-3 font-semibold">No messages yet</h3>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Send the first message to start this conversation.
                    </p>
                  </div>
                )}
              </div>

              <form className="grid gap-2 border-t p-4" onSubmit={handleSubmit}>
                <Textarea
                  className="min-h-20"
                  maxLength={MESSAGE_CONTENT_MAX_LENGTH}
                  placeholder={`Message ${selectedFriend.name ?? "your friend"}`}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                />
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {trimmedLength}/{MESSAGE_CONTENT_MAX_LENGTH}
                    </p>
                    {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
                  </div>
                  <Button type="submit" disabled={pending || !trimmedLength}>
                    <Send className="h-4 w-4" />
                    {pending ? "Sending..." : "Send"}
                  </Button>
                </div>
              </form>
            </>
          ) : null}
        </section>
      </div>
    </>
  );
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  const diffSeconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));

  if (diffSeconds < 60) {
    return "just now";
  }

  const diffMinutes = Math.floor(diffSeconds / 60);

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays}d`;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}
