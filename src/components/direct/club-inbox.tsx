"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Realtime, type InboundMessage, type PresenceMessage } from "ably";
import { ArrowLeft, Bell, BellOff, ExternalLink, Pin, PinOff, Send, Users } from "lucide-react";
import {
  getConversationMessagesAction,
  markConversationReadAction,
  openClubConversationAction,
  pinClubMessageAction,
  sendMessageAction,
  toggleClubConversationMuteAction
} from "@/actions/message.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getRoomChannelName, getUserInboxChannelName, INBOX_EVENTS, ROOM_EVENTS } from "@/lib/ably-channels";
import { closeRealtimeClient } from "@/lib/ably-client";
import { MESSAGE_CONTENT_MAX_LENGTH } from "@/lib/validations/message";
import { cn } from "@/lib/utils";
import { clubMessagingHref } from "@/lib/messaging/navigation";
import type {
  ChatMessage,
  ClubChatSummary,
  ConversationUpdatePayload,
  MessageSender,
  RealtimeChatMessage
} from "@/types/message.types";
import { RelativeTime } from "@/components/i18n/relative-time";
import { useI18n } from "@/components/i18n/i18n-provider";

type ClubInboxProps = {
  currentUser: MessageSender;
  clubs: ClubChatSummary[];
  initialClubId?: string | null;
  messagesByConversationId: Record<string, ChatMessage[]>;
};

export function ClubInbox({ currentUser, clubs, initialClubId, messagesByConversationId }: ClubInboxProps) {
  const { locale } = useI18n();
  const router = useRouter();
  const [clubState, setClubState] = useState(clubs);
  const [selectedClubId, setSelectedClubId] = useState(
    clubs.some((club) => club.clubId === initialClubId) ? initialClubId! : clubs[0]?.clubId ?? ""
  );
  const [messagesState, setMessagesState] = useState(messagesByConversationId);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(Boolean(initialClubId));
  const [search, setSearch] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  const [pending, startTransition] = useTransition();
  const loadingIds = useRef(new Set<string>());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedClub = clubState.find((club) => club.clubId === selectedClubId) ?? clubState[0] ?? null;
  const selectedConversationId = selectedClub?.conversationId ?? null;
  const messages = selectedConversationId ? messagesState[selectedConversationId] ?? [] : [];
  const filteredClubs = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return query ? clubState.filter((club) => club.clubName.toLocaleLowerCase().includes(query)) : clubState;
  }, [clubState, search]);

  useEffect(() => setClubState(clubs), [clubs]);
  useEffect(() => setMessagesState(messagesByConversationId), [messagesByConversationId]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId || messagesState[selectedConversationId] || loadingIds.current.has(selectedConversationId)) return;
    loadingIds.current.add(selectedConversationId);
    getConversationMessagesAction(selectedConversationId)
      .then((result) => {
        if (result.ok && result.data) {
          setMessagesState((current) => ({ ...current, [selectedConversationId]: result.data!.messages }));
        } else {
          setError(result.message);
        }
      })
      .finally(() => loadingIds.current.delete(selectedConversationId));
  }, [messagesState, selectedConversationId]);

  useEffect(() => {
    const channelName = getUserInboxChannelName(currentUser.id);
    const ably = createRealtimeClient(channelName);
    const channel = ably.channels.get(channelName);
    const onUpdate = (event: InboundMessage) => {
      const update = event.data as ConversationUpdatePayload;
      setClubState((current) => current.map((club) => {
        if (club.conversationId !== update.conversationId) return club;
        const isOpen = club.clubId === selectedClubId;
        return {
          ...club,
          lastMessage: update.lastMessage
            ? { ...update.lastMessage, isOwnMessage: update.lastMessage.senderId === currentUser.id }
            : club.lastMessage,
          unreadCount: typeof update.unreadCount === "number"
            ? update.unreadCount
            : update.lastMessage?.senderId !== currentUser.id && !isOpen
              ? club.unreadCount + 1
              : club.unreadCount
        };
      }));
    };
    channel.subscribe(INBOX_EVENTS.conversationUpdate, onUpdate).catch(() => undefined);
    return () => {
      channel.unsubscribe(INBOX_EVENTS.conversationUpdate, onUpdate);
      closeRealtimeClient(ably);
    };
  }, [currentUser.id, selectedClubId]);

  useEffect(() => {
    if (!selectedConversationId) return;
    markConversationReadAction(selectedConversationId);
    setClubState((current) => current.map((club) =>
      club.conversationId === selectedConversationId ? { ...club, unreadCount: 0 } : club
    ));

    const channelName = getRoomChannelName(selectedConversationId);
    const ably = createRealtimeClient(channelName);
    const channel = ably.channels.get(channelName);
    const upsert = (message: RealtimeChatMessage) => {
      const chatMessage = { ...message, isOwnMessage: message.senderId === currentUser.id };
      setMessagesState((current) => {
        const existing = current[selectedConversationId] ?? [];
        return {
          ...current,
          [selectedConversationId]: existing.some((item) => item.id === chatMessage.id)
            ? existing.map((item) => item.id === chatMessage.id ? chatMessage : item)
            : [...existing, chatMessage]
        };
      });
    };
    const onMessage = (event: InboundMessage) => {
      const message = event.data as RealtimeChatMessage;
      upsert(message);
      if (message.senderId !== currentUser.id) markConversationReadAction(selectedConversationId);
    };
    const refreshPresence = async (_event?: PresenceMessage) => {
      const members = await channel.presence.get();
      setOnlineCount(new Set(members.map((member) => member.clientId)).size);
    };
    Promise.all([
      channel.subscribe(ROOM_EVENTS.messageNew, onMessage),
      channel.presence.subscribe(["enter", "leave", "update", "present"], refreshPresence)
    ]).then(async () => {
      await channel.presence.enter({ userId: currentUser.id, status: "online" });
      await refreshPresence();
    }).catch(() => setOnlineCount(0));

    return () => {
      channel.unsubscribe(ROOM_EVENTS.messageNew, onMessage);
      channel.presence.unsubscribe(["enter", "leave", "update", "present"], refreshPresence);
      channel.presence.leave().catch(() => undefined);
      closeRealtimeClient(ably);
    };
  }, [currentUser.id, selectedConversationId]);

  function openClub(club: ClubChatSummary) {
    setError("");
    const finish = (conversationId: string) => {
      setSelectedClubId(club.clubId);
      setClubState((current) => current.map((item) =>
        item.clubId === club.clubId ? { ...item, conversationId, unreadCount: 0 } : item
      ));
      setIsMobileChatOpen(true);
      router.push(clubMessagingHref(club.clubId));
    };
    startTransition(async () => {
      const result = await openClubConversationAction(club.clubId);
      if (!result.ok || !result.data) {
        setError(result.message);
        return;
      }
      finish(result.data.conversationId);
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedConversationId || !content.trim()) return;
    const sentContent = content;
    setContent("");
    startTransition(async () => {
      const result = await sendMessageAction({ conversationId: selectedConversationId, content: sentContent });
      if (!result.ok || !result.data) {
        setContent(sentContent);
        setError(result.message);
        return;
      }
      setMessagesState((current) => {
        const existing = current[selectedConversationId] ?? [];
        return existing.some((message) => message.id === result.data!.message.id)
          ? current
          : { ...current, [selectedConversationId]: [...existing, result.data!.message] };
      });
    });
  }

  function toggleMute() {
    if (!selectedConversationId || !selectedClub) return;
    startTransition(async () => {
      const result = await toggleClubConversationMuteAction(selectedConversationId);
      if (!result.ok || !result.data) {
        setError(result.message);
        return;
      }
      setClubState((current) => current.map((club) =>
        club.clubId === selectedClub.clubId ? { ...club, isMuted: result.data!.isMuted } : club
      ));
    });
  }

  function setPinnedMessage(messageId: string | null) {
    if (!selectedConversationId || !selectedClub) return;
    startTransition(async () => {
      const result = await pinClubMessageAction(selectedConversationId, messageId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      const pinnedMessage = messageId ? messages.find((message) => message.id === messageId) ?? null : null;
      setClubState((current) => current.map((club) =>
        club.clubId === selectedClub.clubId
          ? { ...club, pinnedMessage, hasPinnedMessage: Boolean(pinnedMessage) }
          : club
      ));
    });
  }

  function composerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  if (!clubState.length) {
    return (
      <div className="grid h-full place-items-center rounded-md border bg-card p-8 text-center">
        <div>
          <Users className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 font-semibold">Aktiv klub söhbəti yoxdur</h2>
          <p className="mt-1 text-sm text-muted-foreground">Yalnız aktiv üzv olduğunuz klublar burada görünür.</p>
          <Button asChild className="mt-4">
            <Link href="/clubs">Klublara keç</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 overflow-hidden bg-card md:grid-cols-[320px_1fr] md:border-r">
      <aside className={cn("min-h-0 flex-col border-r", isMobileChatOpen ? "hidden md:flex" : "flex")}>
        <div className="grid gap-2 border-b p-4">
          <div className="flex items-center gap-2 font-semibold"><Users className="h-4 w-4 text-primary" />Klublar</div>
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Klublarımda axtar..." />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {filteredClubs.map((club) => (
            <button
              key={club.clubId}
              type="button"
              disabled={pending}
              onClick={() => openClub(club)}
              className={cn(
                "flex w-full items-center gap-3 border-b px-4 py-3 text-left hover:bg-secondary",
                selectedClub?.clubId === club.clubId && "bg-secondary"
              )}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-bold text-primary-foreground">
                {club.clubLogoUrl ? <img src={club.clubLogoUrl} alt="" className="h-full w-full object-cover" /> : club.clubName.charAt(0)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <strong className="min-w-0 flex-1 truncate text-sm">{club.clubName}</strong>
                  {club.unreadCount ? <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold">{club.unreadCount}</span> : null}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {club.lastMessage ? `${club.lastMessage.sender.name ?? "Üzv"}: ${club.lastMessage.content}` : "Söhbəti aç"}
                </span>
                <span className="mt-1 block text-[11px] text-muted-foreground">{club.activeMemberCount} aktiv üzv</span>
                <span className="mt-1 flex gap-2 text-[11px] text-muted-foreground">
                  {club.hasPinnedMessage ? <span className="inline-flex items-center gap-1"><Pin className="h-3 w-3" />Sabitlənib</span> : null}
                  {club.isMuted ? <span className="inline-flex items-center gap-1"><BellOff className="h-3 w-3" />Səssiz</span> : null}
                </span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      <section className={cn(
        "min-h-0 flex-col bg-card",
        isMobileChatOpen ? "fixed inset-0 z-50 flex h-dvh md:relative md:z-auto md:h-auto" : "hidden md:flex"
      )}>
        {selectedClub ? (
          <>
            <header className="flex items-center gap-3 border-b p-3 sm:p-4">
              <Button
                type="button"
                variant="outline"
                className="shrink-0 md:hidden"
                onClick={() => {
                  setIsMobileChatOpen(false);
                  router.push(clubMessagingHref());
                }}
              >
                <ArrowLeft className="h-4 w-4" />Klublar
              </Button>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-bold text-primary-foreground">
                {selectedClub.clubLogoUrl ? <img src={selectedClub.clubLogoUrl} alt="" className="h-full w-full object-cover" /> : selectedClub.clubName.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold">{selectedClub.clubName}</h2>
                <p className="text-xs text-muted-foreground">
                  Klub söhbəti · {selectedClub.activeMemberCount} üzv{onlineCount ? ` · ${onlineCount} onlayn` : ""}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={toggleMute} disabled={pending} title={selectedClub.isMuted ? "Bildirişləri aç" : "Səssizə al"}>
                {selectedClub.isMuted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/clubs/${selectedClub.clubSlug}`}><ExternalLink className="h-4 w-4" /><span className="hidden sm:inline">Kluba keç</span></Link>
              </Button>
            </header>
            {selectedClub.pinnedMessage ? (
              <div className="flex items-start gap-2 border-b bg-accent/20 px-4 py-2 text-xs">
                <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <strong>{selectedClub.pinnedMessage.sender.name ?? "Üzv"}</strong>
                  <p className="truncate text-muted-foreground">{selectedClub.pinnedMessage.content}</p>
                </div>
                {selectedClub.canModerate ? (
                  <button type="button" onClick={() => setPinnedMessage(null)} title="Sabitləməni götür">
                    <PinOff className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            ) : null}
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-background/50 p-3 sm:p-4">
              {messages.map((message) => (
                <div key={message.id} className={cn("flex", message.isOwnMessage ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[85%] rounded-md border px-3 py-2", message.isOwnMessage ? "bg-primary text-primary-foreground" : "bg-card")}>
                    {!message.isOwnMessage ? <p className="mb-1 text-xs font-semibold">{message.sender.name ?? message.sender.username ?? "Üzv"}</p> : null}
                    <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] opacity-75">
                      <RelativeTime value={message.createdAt} locale={locale} />
                      {selectedClub.canModerate && !message.deletedAt ? (
                        <button type="button" onClick={() => setPinnedMessage(message.id)} className="inline-flex items-center gap-1">
                          <Pin className="h-3 w-3" />Sabitlə
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
              {!messages.length ? <div className="grid h-full min-h-48 place-items-center text-sm text-muted-foreground">Klub söhbətində hələ mesaj yoxdur.</div> : null}
              <div ref={messagesEndRef} />
            </div>
            <form className="grid shrink-0 gap-2 border-t p-3 sm:p-4" onSubmit={submit}>
              <Textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                onKeyDown={composerKeyDown}
                maxLength={MESSAGE_CONTENT_MAX_LENGTH}
                placeholder={`${selectedClub.clubName} söhbətinə mesaj`}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-destructive">{error}</p>
                <Button type="submit" disabled={pending || !content.trim()}><Send className="h-4 w-4" />Göndər</Button>
              </div>
            </form>
          </>
        ) : null}
      </section>
    </div>
  );
}

function createRealtimeClient(channelName: string) {
  return new Realtime({
    authUrl: `/api/ably/token?channel=${encodeURIComponent(channelName)}`,
    closeOnUnload: true
  });
}
