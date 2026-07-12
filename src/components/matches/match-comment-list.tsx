"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MatchCommentForm } from "@/components/matches/match-comment-form";
import { extractTimestampsFromText, type ExtractedTimestamp } from "@/lib/videos/time";
import type { MatchCommentDto } from "@/types/match.types";

export function MatchCommentList({ matchId, comments, onTimestampClick }: { matchId: string; comments: MatchCommentDto[]; onTimestampClick?: (timestamp: ExtractedTimestamp) => void }) {
  const [replyingId, setReplyingId] = useState<string | null>(null);
  return <div className="grid gap-4">{comments.map((comment) => <div key={comment.id} className="rounded-lg border p-4"><div className="flex items-center justify-between gap-3"><p className="font-medium">{comment.author.name ?? `@${comment.author.username ?? "profile"}`}</p><time className="text-xs text-muted-foreground">{formatTime(comment.createdAt)}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6"><TimestampText text={comment.content} onTimestampClick={onTimestampClick} /></p><Button type="button" size="sm" variant="ghost" className="mt-1 px-0" onClick={() => setReplyingId(replyingId === comment.id ? null : comment.id)}>Cavabla</Button>{comment.replies.length ? <div className="ml-4 mt-3 grid gap-3 border-l pl-4">{comment.replies.map((reply) => <div key={reply.id}><div className="flex justify-between gap-3"><p className="text-sm font-medium">{reply.author.name ?? reply.author.username}</p><time className="text-xs text-muted-foreground">{formatTime(reply.createdAt)}</time></div><p className="mt-1 text-sm"><TimestampText text={reply.content} onTimestampClick={onTimestampClick} /></p></div>)}</div> : null}{replyingId === comment.id ? <div className="mt-3"><MatchCommentForm matchId={matchId} parentId={comment.id} onDone={() => setReplyingId(null)} /></div> : null}</div>)}{!comments.length ? <p className="py-8 text-center text-sm text-muted-foreground">Hələ şərh yoxdur.</p> : null}</div>;
}

function TimestampText({ text, onTimestampClick }: { text: string; onTimestampClick?: (timestamp: ExtractedTimestamp) => void }) {
  const timestamps = extractTimestampsFromText(text);
  if (!timestamps.length) return text;
  const content: React.ReactNode[] = []; let cursor = 0;
  timestamps.forEach((timestamp, index) => {
    content.push(text.slice(cursor, timestamp.start));
    content.push(<button key={`${timestamp.start}-${index}`} type="button" className="font-semibold text-primary hover:underline" title="Dəqiqəyə keç" onClick={() => onTimestampClick?.(timestamp)}>{timestamp.raw}</button>);
    cursor = timestamp.end;
  });
  content.push(text.slice(cursor));
  return content;
}

function formatTime(value: string) { return new Intl.DateTimeFormat("az-AZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
