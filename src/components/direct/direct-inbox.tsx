"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Realtime, type InboundMessage, type PresenceMessage } from "ably";
import { ArrowLeft, MessageCircle, Send, Trash2, Users } from "lucide-react";
import { deleteMessageAction, markConversationReadAction, sendMessageAction } from "@/actions/message.actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Toast } from "@/components/ui/toast";
import { getRoomChannelName, getUserInboxChannelName, INBOX_EVENTS, ROOM_EVENTS } from "@/lib/ably-channels";
import { MESSAGE_CONTENT_MAX_LENGTH } from "@/lib/validations/message";
import { cn } from "@/lib/utils";
import type {
  ChatMessage,
  ConversationUpdatePayload,
  DirectFriend,
  MessageSender,
  RealtimeChatMessage
} from "@/types/message.types";

type DirectInboxProps = {
  currentUser: MessageSender;
  friends: DirectFriend[];
  initialConversationId?: string | null;
  messagesByConversationId: Record<string, ChatMessage[]>;
};

type PresenceData = {
  image: string | null;
  name: string | null;
  status: "online";
  userId: string;
};

export function DirectInbox({
  currentUser,
  friends,
  initialConversationId,
  messagesByConversationId
}: DirectInboxProps) {
  const [friendsState, setFriendsState] = useState(friends);
  const [messagesByConversationIdState, setMessagesByConversationIdState] = useState(messagesByConversationId);
  const initialFriend = friends.find((friend) => friend.conversationId === initialConversationId) ?? friends[0];
  const [selectedFriendId, setSelectedFriendId] = useState(initialFriend?.id ?? "");
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [pending, startTransition] = useTransition();
  const currentUserId = currentUser.id;
  const selectedFriend = friendsState.find((friend) => friend.id === selectedFriendId) ?? friendsState[0] ?? null;
  const selectedConversationId = selectedFriend?.conversationId ?? null;
  const selectedConversationIdRef = useRef<string | null>(selectedConversationId);
  const mobileChatRef = useRef<HTMLElement>(null);
  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const messages = selectedFriend?.conversationId ? messagesByConversationIdState[selectedFriend.conversationId] ?? [] : [];
  const trimmedLength = content.trim().length;

  useEffect(() => {
    setFriendsState(friends);
  }, [friends]);

  useEffect(() => {
    setMessagesByConversationIdState(messagesByConversationId);
  }, [messagesByConversationId]);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    const chat = mobileChatRef.current;
    const visualViewport = window.visualViewport;

    if (!isMobileChatOpen || !chat || !visualViewport) {
      return;
    }

    let frame = 0;

    const syncChatToVisibleViewport = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (window.matchMedia("(min-width: 768px)").matches) {
          chat.style.removeProperty("height");
          chat.style.removeProperty("top");
          return;
        }

        // On mobile browsers the keyboard may cover `100dvh` instead of resizing it.
        // visualViewport represents the portion that is actually visible above it.
        chat.style.height = `${visualViewport.height}px`;
        chat.style.top = `${visualViewport.offsetTop}px`;
      });
    };

    syncChatToVisibleViewport();
    visualViewport.addEventListener("resize", syncChatToVisibleViewport);
    visualViewport.addEventListener("scroll", syncChatToVisibleViewport);
    window.addEventListener("orientationchange", syncChatToVisibleViewport);

    return () => {
      window.cancelAnimationFrame(frame);
      visualViewport.removeEventListener("resize", syncChatToVisibleViewport);
      visualViewport.removeEventListener("scroll", syncChatToVisibleViewport);
      window.removeEventListener("orientationchange", syncChatToVisibleViewport);
      chat.style.removeProperty("height");
      chat.style.removeProperty("top");
    };
  }, [isMobileChatOpen]);

  useEffect(() => {
    if (selectedConversationId) {
      shouldStickToBottomRef.current = true;
      markConversationRead(selectedConversationId);
    }
  }, [selectedConversationId]);

  useEffect(() => {
    if (!shouldStickToBottomRef.current) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [messages.length, selectedConversationId]);

  const friendRows = useMemo(
    () =>
      friendsState.map((friend) => ({
        ...friend,
        displayName: friend.name ?? "FanPitch Player",
        preview: friend.lastMessage?.content ?? "Start a conversation"
      })),
    [friendsState]
  );

  useEffect(() => {
    const channelName = getUserInboxChannelName(currentUserId);
    const ably = createRealtimeClient(channelName);
    const channel = ably.channels.get(channelName);

    const handleConversationUpdate = (message: InboundMessage) => {
      const payload = message.data as ConversationUpdatePayload;

      debugRealtime("received event", {
        event: INBOX_EVENTS.conversationUpdate,
        id: payload.conversationId
      });
      applyConversationUpdate(payload);
    };

    ably.connection.on("connected", () => debugRealtime("connected to Ably", { channelName }));
    ably.connection.on("failed", (stateChange) => debugRealtime("connection failed", stateChange.reason));
    channel.subscribe(INBOX_EVENTS.conversationUpdate, handleConversationUpdate).catch((subscribeError) => {
      debugRealtime("subscription error", subscribeError);
    });

    debugRealtime("subscribed channel", { channelName });

    return () => {
      channel.unsubscribe(INBOX_EVENTS.conversationUpdate, handleConversationUpdate);
      ably.close();
    };
  }, [currentUserId]);

  useEffect(() => {
    const conversationId = selectedFriend?.conversationId;

    setIsOtherUserOnline(false);

    if (!conversationId) {
      return;
    }

    let active = true;
    const channelName = getRoomChannelName(conversationId);
    const ably = createRealtimeClient(channelName);
    const channel = ably.channels.get(channelName);

    const handleNewMessage = (message: InboundMessage) => {
      const payload = message.data as RealtimeChatMessage;

      debugRealtime("received event", {
        event: ROOM_EVENTS.messageNew,
        id: payload.id
      });
      upsertMessage(toChatMessage(payload, currentUserId));
      applyConversationUpdate({
        conversationId: payload.conversationId,
        lastMessage: payload,
        updatedAt: payload.createdAt
      });

      if (payload.senderId !== currentUserId) {
        markConversationRead(payload.conversationId);
      }
    };

    const handleDeletedMessage = (message: InboundMessage) => {
      const payload = message.data as { conversationId: string; messageId: string };

      debugRealtime("received event", {
        event: ROOM_EVENTS.messageDelete,
        id: payload.messageId
      });
      markMessageDeleted(payload.conversationId, payload.messageId);
    };

    const handlePresenceChange = (_message: PresenceMessage) => {
      refreshPresence();
    };

    async function refreshPresence() {
      try {
        const members = await channel.presence.get();

        if (active) {
          setIsOtherUserOnline(members.some((member) => member.clientId !== currentUserId));
        }
      } catch (presenceError) {
        debugRealtime("presence error", presenceError);
      }
    }

    ably.connection.on("connected", () => debugRealtime("connected to Ably", { channelName }));
    ably.connection.on("failed", (stateChange) => debugRealtime("connection failed", stateChange.reason));

    Promise.all([
      channel.subscribe(ROOM_EVENTS.messageNew, handleNewMessage),
      channel.subscribe(ROOM_EVENTS.messageDelete, handleDeletedMessage),
      channel.subscribe(ROOM_EVENTS.conversationRead, () => undefined),
      channel.subscribe(ROOM_EVENTS.typingStart, () => undefined),
      channel.subscribe(ROOM_EVENTS.typingStop, () => undefined),
      channel.presence.subscribe(["enter", "update", "leave", "present"], handlePresenceChange)
    ])
      .then(async () => {
        debugRealtime("subscribed channel", { channelName });
        await channel.presence.enter({
          image: currentUser.image ?? null,
          name: currentUser.name ?? null,
          status: "online",
          userId: currentUserId
        } satisfies PresenceData);
        await refreshPresence();
      })
      .catch((subscribeError) => {
        debugRealtime("subscription error", subscribeError);
      });

    return () => {
      active = false;
      channel.unsubscribe(ROOM_EVENTS.messageNew, handleNewMessage);
      channel.unsubscribe(ROOM_EVENTS.messageDelete, handleDeletedMessage);
      channel.unsubscribe(ROOM_EVENTS.conversationRead);
      channel.unsubscribe(ROOM_EVENTS.typingStart);
      channel.unsubscribe(ROOM_EVENTS.typingStop);
      channel.presence.unsubscribe(["enter", "update", "leave", "present"], handlePresenceChange);
      channel.presence.leave().catch((leaveError) => debugRealtime("presence leave error", leaveError));
      ably.close();
    };
  }, [currentUser.image, currentUser.name, currentUserId, selectedFriend?.conversationId]);

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

      if (!result.data) {
        setError("Message was saved, but the response was incomplete.");
        return;
      }

      const data = result.data;

      setContent("");
      shouldStickToBottomRef.current = true;
      upsertMessage(data.message);
      setFriendsState((currentFriends) =>
        sortFriendsByLastMessage(
          currentFriends.map((friend) =>
            friend.id === selectedFriend.id
              ? {
                  ...friend,
                  conversationId: data.conversationId,
                  lastMessage: data.message,
                  unreadCount: 0
                }
              : friend
          )
        )
      );
    });
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();

    if (pending || !selectedFriend || !trimmedLength) {
      return;
    }

    event.currentTarget.form?.requestSubmit();
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

      if (selectedFriend?.conversationId) {
        markMessageDeleted(selectedFriend.conversationId, messageId);
      }

      setToastMessage(result.message);
    });
  }

  function applyConversationUpdate(payload: ConversationUpdatePayload) {
    if (payload.lastMessage) {
      upsertMessage(toChatMessage(payload.lastMessage, currentUserId));
    }

    const shouldIncrementUnread =
      Boolean(payload.lastMessage) &&
      payload.lastMessage?.senderId !== currentUserId &&
      payload.conversationId !== selectedConversationIdRef.current;

    setFriendsState((currentFriends) =>
      sortFriendsByLastMessage(
        currentFriends.map((friend) => {
          const isExistingConversation = friend.conversationId === payload.conversationId;
          const isNewConversationFromFriend = !friend.conversationId && payload.lastMessage?.senderId === friend.id;

          if (!isExistingConversation && !isNewConversationFromFriend) {
            return friend;
          }

          return {
            ...friend,
            conversationId: payload.conversationId,
            lastMessage: payload.lastMessage ? toChatMessage(payload.lastMessage, currentUserId) : friend.lastMessage,
            unreadCount:
              typeof payload.unreadCount === "number"
                ? payload.unreadCount
                : payload.conversationId === selectedConversationIdRef.current
                ? 0
                : shouldIncrementUnread
                  ? friend.unreadCount + 1
                  : friend.unreadCount
          };
        })
      )
    );
  }

  function upsertMessage(message: ChatMessage) {
    setMessagesByConversationIdState((currentMessages) => {
      const conversationMessages = currentMessages[message.conversationId] ?? [];
      const existingIndex = conversationMessages.findIndex((item) => item.id === message.id);
      const nextMessages =
        existingIndex === -1
          ? [...conversationMessages, message]
          : conversationMessages.map((item) => (item.id === message.id ? { ...item, ...message } : item));

      return {
        ...currentMessages,
        [message.conversationId]: sortMessages(nextMessages)
      };
    });
  }

  function markMessageDeleted(conversationId: string, messageId: string) {
    const deletedAt = new Date().toISOString();

    setMessagesByConversationIdState((currentMessages) => {
      const conversationMessages = currentMessages[conversationId] ?? [];

      return {
        ...currentMessages,
        [conversationId]: conversationMessages.map((message) =>
          message.id === messageId
            ? {
                ...message,
                content: "Message deleted",
                deletedAt
              }
            : message
        )
      };
    });

    setFriendsState((currentFriends) =>
      currentFriends.map((friend) =>
        friend.conversationId === conversationId && friend.lastMessage?.id === messageId
          ? {
              ...friend,
              lastMessage: {
                ...friend.lastMessage,
                content: "Message deleted",
                deletedAt
              }
            }
          : friend
      )
    );
  }

  if (!friendsState.length) {
    return (
      <div className="rounded-md border bg-card p-8 text-center">
        <Users className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-3 text-lg font-semibold">No friends yet</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Accepted friends will appear here so you can start a direct message.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/search">Find players</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/friends?tab=incoming">Friend requests</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toast message={toastMessage ?? ""} open={Boolean(toastMessage)} onOpenChange={(open) => !open && setToastMessage(null)} />
      <div className="grid h-full overflow-hidden bg-card md:grid-cols-[320px_1fr] md:border-r">
        <aside className={cn("min-h-0 flex-col border-r", isMobileChatOpen ? "hidden md:flex" : "flex")}>
          <div className="flex items-start justify-between gap-3 border-b p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MessageCircle className="h-4 w-4 text-primary" />
                Friends
              </div>
              <p className="mt-1 text-xs text-muted-foreground">All accepted friends are available for direct messages.</p>
            </div>
            <Button asChild size="sm" variant="outline" className="shrink-0">
              <Link href="/friends?tab=incoming">Manage</Link>
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
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
                  setIsMobileChatOpen(true);
                  setError(null);
                  setFriendsState((currentFriends) =>
                    currentFriends.map((currentFriend) =>
                      currentFriend.id === friend.id ? { ...currentFriend, unreadCount: 0 } : currentFriend
                    )
                  );
                }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {friend.image ? <img src={friend.image} alt="" className="h-full w-full object-cover" /> : friend.displayName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold">{friend.displayName}</p>
                    {friend.unreadCount ? (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-foreground">
                        {friend.unreadCount > 9 ? "9+" : friend.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">@{friend.username ?? "profile"}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{friend.preview}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section
          ref={mobileChatRef}
          className={cn(
            "min-h-0 flex-col bg-card",
            isMobileChatOpen
              ? "fixed inset-x-0 top-0 z-50 flex h-dvh overflow-hidden md:relative md:inset-auto md:z-auto md:h-auto"
              : "hidden md:flex"
          )}
        >
          {selectedFriend ? (
            <>
              <div className="flex items-center gap-3 border-b p-3 sm:p-4">
                <Button
                  className="shrink-0 md:hidden"
                  variant="outline"
                  type="button"
                  aria-label="Back to messages"
                  onClick={() => setIsMobileChatOpen(false)}
                >
                  <ArrowLeft className="h-5 w-5" />
                  Chats
                </Button>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-semibold">
                  {selectedFriend.image ? (
                    <img src={selectedFriend.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (selectedFriend.name ?? "FanPitch Player").charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold">{selectedFriend.name ?? "FanPitch Player"}</h2>
                  <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className={cn("h-2 w-2 rounded-full", isOtherUserOnline ? "bg-primary" : "bg-muted-foreground")} />
                    <span>{isOtherUserOnline ? "Online" : "Offline"}</span>
                    <span className="truncate">@{selectedFriend.username ?? "profile"}</span>
                  </div>
                </div>
              </div>

              <div
                ref={messagesViewportRef}
                className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-background/50 p-3 sm:p-4"
                onScroll={() => {
                  const viewport = messagesViewportRef.current;

                  if (viewport) {
                    shouldStickToBottomRef.current = isNearBottom(viewport);
                  }
                }}
              >
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
                <div ref={messagesEndRef} />
              </div>

              <form className="grid shrink-0 gap-2 border-t p-3 pb-4 sm:p-4" onSubmit={handleSubmit}>
                <Textarea
                  className="min-h-20"
                  maxLength={MESSAGE_CONTENT_MAX_LENGTH}
                  placeholder={`Message ${selectedFriend.name ?? "your friend"}`}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
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

function markConversationRead(conversationId: string) {
  markConversationReadAction(conversationId).catch((error) => {
    debugRealtime("mark read error", error);
  });
}

function createRealtimeClient(channelName: string) {
  return new Realtime({
    authUrl: `/api/ably/token?channel=${encodeURIComponent(channelName)}`,
    closeOnUnload: true
  });
}

function toChatMessage(message: RealtimeChatMessage, currentUserId: string): ChatMessage {
  return {
    ...message,
    isOwnMessage: message.senderId === currentUserId
  };
}

function sortMessages(messages: ChatMessage[]) {
  return [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function sortFriendsByLastMessage(friends: DirectFriend[]) {
  return [...friends].sort((a, b) => getLastMessageTime(b) - getLastMessageTime(a));
}

function getLastMessageTime(friend: DirectFriend) {
  return friend.lastMessage ? new Date(friend.lastMessage.createdAt).getTime() : 0;
}

function isNearBottom(element: HTMLElement) {
  return element.scrollHeight - element.scrollTop - element.clientHeight < 160;
}

function debugRealtime(message: string, details?: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.debug(`[ably] ${message}`, details);
  }
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
