"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { cursorSchema } from "@/lib/pagination";
import {
  getCommentRepliesPage,
  getFeedPostsPage,
  getPostCommentsPage,
  getProfilePostsPage
} from "@/server/queries/post.queries";
import { canViewProfile } from "@/server/services/privacy.service";
import type { CursorPage } from "@/lib/pagination";
import type { PostComment, PostPageItem } from "@/types/post.types";
import type { ApiResponse } from "@/types/api.types";

const idSchema = z.string().trim().min(1).max(191);
const pageInputSchema = z.object({ cursor: cursorSchema });

export async function loadFeedPostsAction(
  cursor: string
): Promise<ApiResponse<CursorPage<PostPageItem>>> {
  const parsed = pageInputSchema.safeParse({ cursor });
  if (!parsed.success) return invalidPage();

  const currentUser = await getCurrentUser();
  const page = await getFeedPostsPage(currentUser?.id, parsed.data.cursor);
  return { ok: true, message: "", data: page };
}

export async function loadProfilePostsAction(
  profileUserId: string,
  cursor: string
): Promise<ApiResponse<CursorPage<PostPageItem>>> {
  const parsed = z.object({ profileUserId: idSchema, cursor: cursorSchema }).safeParse({
    profileUserId,
    cursor
  });
  if (!parsed.success) return invalidPage();

  const currentUser = await getCurrentUser();
  if (!currentUser || !(await canViewProfile(currentUser.id, parsed.data.profileUserId))) {
    return { ok: false, message: "Bu profili görmək mümkün deyil." };
  }

  const page = await getProfilePostsPage(
    parsed.data.profileUserId,
    currentUser.id,
    parsed.data.cursor
  );
  return { ok: true, message: "", data: page };
}

export async function loadPostCommentsAction(
  postId: string,
  cursor: string | null
): Promise<ApiResponse<CursorPage<PostComment>>> {
  const parsed = z.object({ postId: idSchema, cursor: cursorSchema }).safeParse({ postId, cursor });
  if (!parsed.success) return invalidPage();

  const currentUser = await getCurrentUser();
  const page = await getPostCommentsPage(parsed.data.postId, currentUser?.id, parsed.data.cursor);
  return { ok: true, message: "", data: page };
}

export async function loadCommentRepliesAction(
  commentId: string,
  cursor: string | null
): Promise<ApiResponse<CursorPage<PostComment>>> {
  const parsed = z.object({ commentId: idSchema, cursor: cursorSchema }).safeParse({
    commentId,
    cursor
  });
  if (!parsed.success) return invalidPage();

  const currentUser = await getCurrentUser();
  const page = await getCommentRepliesPage(parsed.data.commentId, currentUser?.id, parsed.data.cursor);
  return { ok: true, message: "", data: page };
}

function invalidPage<T>(): ApiResponse<T> {
  return { ok: false, message: "Səhifələmə məlumatı yanlışdır." };
}
