export const PAGINATION_LIMITS = {
  feedPosts: 10,
  profilePosts: 10,
  commentPreview: 3,
  comments: 10,
  replyPreview: 2,
  replies: 10,
  friends: 20,
  search: 12,
  conversations: 20,
  messages: 30,
  notifications: 20,
  notificationDropdown: 10,
  matches: 20,
  clubMembers: 20,
  clubMatches: 20,
  clubs: 20,
  admin: 25
} as const;

export type CursorPage<T> = { items: T[]; nextCursor: string | null; hasMore: boolean };
export type NumberedPage<T> = { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number };

export const cursorSchema = z.string().trim().min(1).max(191).nullable().optional();
export const pageSizeSchema = z.number().int().min(1).max(100);

export function toCursorPage<T extends { id: string }>(items: T[], pageSize: number): CursorPage<T> {
  const hasMore = items.length > pageSize;
  const pageItems = hasMore ? items.slice(0, pageSize) : items;

  return {
    items: pageItems,
    hasMore,
    nextCursor: hasMore ? pageItems.at(-1)?.id ?? null : null
  };
}

export function normalizePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function toNumberedPage<T>(items: T[], page: number, pageSize: number, totalItems: number): NumberedPage<T> {
  return { items, page, pageSize, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pageSize)) };
}
import { z } from "zod";
