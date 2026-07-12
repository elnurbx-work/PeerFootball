import type { MatchVideoType } from "@prisma/client";

export type ExtractedTimestamp = {
  raw: string;
  start: number;
  end: number;
  kind: "VIDEO_TIMESTAMP" | "MATCH_MINUTE";
  seconds?: number;
  minute?: number;
  extraMinute?: number;
};

export function parseTimestampToSeconds(input: string): number | null {
  const value = input.trim();
  if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(value)) {
    const parts = value.split(":").map(Number);
    if (parts.some(Number.isNaN) || parts.slice(1).some((part) => part > 59)) return null;
    return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
  }
  const extra = value.match(/^(\d{1,3})\+(\d{1,2})$/);
  if (extra) return (Number(extra[1]) + Number(extra[2])) * 60;
  const minute = value.match(/^(\d{1,3})\s*(?:['’]|-ci\s+d[əe]qiq[əe])$/iu);
  return minute ? Number(minute[1]) * 60 : null;
}

export function extractTimestampsFromText(text: string): ExtractedTimestamp[] {
  const pattern = /\b\d{1,2}:\d{2}(?::\d{2})?\b|\b(?:45|90)\+\d{1,2}\b|\b\d{1,3}\s*(?:['’]|-ci\s+d[əe]qiq[əe])/giu;
  const timestamps: ExtractedTimestamp[] = [];
  for (const match of text.matchAll(pattern)) {
    const raw = match[0]; const start = match.index ?? 0;
    if (raw.includes(":")) {
      const seconds = parseTimestampToSeconds(raw);
      if (seconds !== null) timestamps.push({ raw, start, end: start + raw.length, kind: "VIDEO_TIMESTAMP", seconds });
      continue;
    }
    const extra = raw.match(/^(\d+)\+(\d+)$/);
    const minuteMatch = raw.match(/^(\d+)/);
    if (minuteMatch) timestamps.push({ raw, start, end: start + raw.length, kind: "MATCH_MINUTE", minute: Number(minuteMatch[1]), extraMinute: extra ? Number(extra[2]) : 0 });
  }
  return timestamps;
}

export function getVideoSecondForMatchMinute({ minute, extraMinute = 0, videoType, matchStartSecond }: { minute: number; extraMinute?: number; videoType: MatchVideoType; matchStartSecond: number }) {
  const absoluteMinute = minute + extraMinute;
  if (videoType === "OTHER") return null;
  const relativeMinute = videoType === "SECOND_HALF" ? Math.max(0, absoluteMinute - 45) : absoluteMinute;
  return matchStartSecond + relativeMinute * 60;
}
