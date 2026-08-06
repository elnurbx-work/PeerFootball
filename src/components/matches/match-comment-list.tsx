"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MatchCommentForm } from "@/components/matches/match-comment-form";
import { extractTimestampsFromText, type ExtractedTimestamp } from "@/lib/videos/time";
import type { MatchCommentDto } from "@/types/match.types";
import { useI18n } from "@/components/i18n/i18n-provider";
import { ClientDateTime } from "@/components/i18n/client-date-time";
import { useRouter } from "next/navigation";

export function MatchCommentList({ matchId, comments, onTimestampClick, isAuthenticated = true }: { matchId: string; comments: MatchCommentDto[]; onTimestampClick?: (timestamp: ExtractedTimestamp) => void; isAuthenticated?: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [replyingId, setReplyingId] = useState<string | null>(null);
  return <div className="grid gap-4">{comments.map((comment) => <div key={comment.id} className="rounded-lg border p-4"><div className="flex items-center justify-between gap-3"><p className="font-medium">{comment.author.name ?? `@${comment.author.username ?? t("matches.comments.profileFallback")}`}</p><ClientDateTime className="text-xs text-muted-foreground" value={comment.createdAt} /></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6"><TimestampText text={comment.content} timestampTitle={t("matches.comments.jumpToMinute")} onTimestampClick={onTimestampClick} /></p><Button type="button" size="sm" variant="ghost" className="mt-1 px-0" onClick={() => { if (!isAuthenticated) { router.push("/auth/login"); return; } setReplyingId(replyingId === comment.id ? null : comment.id); }}>{t("matches.comments.reply")}</Button>{comment.replies.length ? <div className="ml-4 mt-3 grid gap-3 border-l pl-4">{comment.replies.map((reply) => <div key={reply.id}><div className="flex justify-between gap-3"><p className="text-sm font-medium">{reply.author.name ?? reply.author.username}</p><ClientDateTime className="text-xs text-muted-foreground" value={reply.createdAt} /></div><p className="mt-1 text-sm"><TimestampText text={reply.content} timestampTitle={t("matches.comments.jumpToMinute")} onTimestampClick={onTimestampClick} /></p></div>)}</div> : null}{replyingId === comment.id ? <div className="mt-3"><MatchCommentForm matchId={matchId} parentId={comment.id} onDone={() => setReplyingId(null)} isAuthenticated={isAuthenticated} /></div> : null}</div>)}{!comments.length ? <p className="py-8 text-center text-sm text-muted-foreground">{t("matches.comments.empty")}</p> : null}</div>;
}

function TimestampText({ text, timestampTitle, onTimestampClick }: { text: string; timestampTitle: string; onTimestampClick?: (timestamp: ExtractedTimestamp) => void }) {
  const timestamps = extractTimestampsFromText(text);
  if (!timestamps.length) return text;
  const content: React.ReactNode[] = []; let cursor = 0;
  timestamps.forEach((timestamp, index) => {
    content.push(text.slice(cursor, timestamp.start));
    content.push(<button key={`${timestamp.start}-${index}`} type="button" className="font-semibold text-primary hover:underline" title={timestampTitle} onClick={() => onTimestampClick?.(timestamp)}>{timestamp.raw}</button>);
    cursor = timestamp.end;
  });
  content.push(text.slice(cursor));
  return content;
}
