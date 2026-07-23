import "server-only";

import type { Prisma, PostVisibility } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { FeedPost, OriginalPostPreview, PostComment, PostMedia, PostPageItem } from "@/types/post.types";
import { measureAsync } from "@/lib/performance";
import {
  cursorSchema,
  pageSizeSchema,
  PAGINATION_LIMITS,
  toCursorPage,
  type CursorPage
} from "@/lib/pagination";

const anonymousUserId = "__anonymous__";

const postAuthorSelect = {
  id: true,
  name: true,
  username: true,
  image: true
} as const;

const postMediaSelect = {
  id: true,
  type: true,
  url: true,
  publicId: true,
  width: true,
  height: true,
  duration: true,
  format: true,
  size: true,
  order: true,
  createdAt: true
} as const;

const originalPostSelect = {
  id: true,
  authorId: true,
  content: true,
  visibility: true,
  isHidden: true,
  createdAt: true,
  author: {
    select: postAuthorSelect
  },
  media: {
    orderBy: {
      order: "asc"
    },
    select: postMediaSelect
  }
} as const;

function postInclude(currentUserId?: string) {
  return {
    author: {
      select: postAuthorSelect
    },
    media: {
      orderBy: {
        order: "asc"
      },
      select: postMediaSelect
    },
    likes: {
      where: {
        userId: currentUserId ?? anonymousUserId
      },
      select: {
        id: true
      }
    },
    originalPost: {
      select: originalPostSelect
    },
    _count: {
      select: {
        likes: true,
        comments: true,
        reposts: true
      }
    }
  } satisfies Prisma.PostInclude;
}

type FeedPostRecord = Prisma.PostGetPayload<{
  include: ReturnType<typeof postInclude>;
}>;

type OriginalPostRecord = NonNullable<FeedPostRecord["originalPost"]>;

function postWithCommentsInclude(currentUserId?: string) {
  return {
    ...postInclude(currentUserId),
    comments: {
      where: { parentId: null },
      include: {
        author: { select: postAuthorSelect },
        replies: {
          orderBy: { createdAt: "asc" as const },
          include: {
            author: { select: postAuthorSelect },
            replies: false
          }
        }
      },
      orderBy: { createdAt: "asc" as const }
    }
  } satisfies Prisma.PostInclude;
}

function postWithCommentPreviewInclude(currentUserId?: string) {
  return {
    ...postInclude(currentUserId),
    comments: {
      where: { parentId: null },
      take: PAGINATION_LIMITS.commentPreview,
      orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
      include: {
        author: { select: postAuthorSelect },
        replies: {
          take: PAGINATION_LIMITS.replyPreview,
          orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
          include: {
            author: { select: postAuthorSelect },
            replies: false
          }
        }
      }
    }
  } satisfies Prisma.PostInclude;
}

type FeedPostWithPreviewRecord = Prisma.PostGetPayload<{
  include: ReturnType<typeof postWithCommentPreviewInclude>;
}>;

type CommentRecord = Prisma.CommentGetPayload<{
  include: {
    author: {
      select: typeof postAuthorSelect;
    };
    replies: {
      include: {
        author: {
          select: typeof postAuthorSelect;
        };
      };
    };
  };
}>;

export async function getPostVisibilityById(postId: string) {
  return prisma.post.findUnique({
    where: { id: postId },
    select: {
      authorId: true,
      visibility: true
    }
  });
}

export async function getFeedPosts(currentUserId?: string): Promise<FeedPost[]> {
  const [friendIds, posts] = await Promise.all([
    getAcceptedFriendIds(currentUserId),
    prisma.post.findMany({
      where: { isHidden: false, AND: [visibilityWhere(currentUserId)] },
      relationLoadStrategy: "join",
      include: postInclude(currentUserId),
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    })
  ]);

  return posts.map((post) => toFeedPost(post, currentUserId, friendIds));
}

export async function getFeedPostsPage(
  currentUserId?: string,
  cursor?: string | null
): Promise<CursorPage<PostPageItem>> {
  const parsedCursor = cursorSchema.parse(cursor) ?? undefined;
  const pageSize = pageSizeSchema.parse(PAGINATION_LIMITS.feedPosts);
  const metadata = { route: "/feed", itemCount: 0, hasMore: false };

  return measureAsync("feed.page", async () => {
    const [friendIds, records] = await Promise.all([
      getAcceptedFriendIds(currentUserId),
      prisma.post.findMany({
        where: { isHidden: false, AND: [visibilityWhere(currentUserId)] },
        relationLoadStrategy: "join",
        include: postWithCommentPreviewInclude(currentUserId),
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        cursor: parsedCursor ? { id: parsedCursor } : undefined,
        skip: parsedCursor ? 1 : 0,
        take: pageSize + 1
      })
    ]);
    const page = toPostPage(records, currentUserId, friendIds, pageSize);
    metadata.itemCount = page.items.length;
    metadata.hasMore = page.hasMore;
    return page;
  }, metadata);
}

export async function getProfilePosts(profileUserId: string, currentUserId?: string): Promise<FeedPost[]> {
  const friendIds = profileUserId === currentUserId
    ? new Set<string>()
    : await getAcceptedFriendIds(currentUserId);
  const posts = await prisma.post.findMany({
    where: {
      authorId: profileUserId,
      isHidden: false,
      ...profileVisibilityWhere(profileUserId, currentUserId, friendIds)
    },
    relationLoadStrategy: "join",
    include: postInclude(currentUserId),
    orderBy: {
      createdAt: "desc"
    }
  });

  return posts.map((post) => toFeedPost(post, currentUserId, friendIds));
}

export async function getProfilePostsPage(
  profileUserId: string,
  currentUserId?: string,
  cursor?: string | null
): Promise<CursorPage<PostPageItem>> {
  const parsedCursor = cursorSchema.parse(cursor) ?? undefined;
  const pageSize = pageSizeSchema.parse(PAGINATION_LIMITS.profilePosts);
  const metadata = {
    route: profileUserId === currentUserId ? "/profile" : "/profile/[username]",
    itemCount: 0,
    hasMore: false,
    isOwnProfile: profileUserId === currentUserId
  };

  return measureAsync("profile.postsPage", async () => {
    const friendIds = profileUserId === currentUserId
      ? new Set<string>()
      : await getAcceptedFriendIds(currentUserId);
    const records = await prisma.post.findMany({
      where: {
        authorId: profileUserId,
        isHidden: false,
        ...profileVisibilityWhere(profileUserId, currentUserId, friendIds)
      },
      relationLoadStrategy: "join",
      include: postWithCommentPreviewInclude(currentUserId),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      cursor: parsedCursor ? { id: parsedCursor } : undefined,
      skip: parsedCursor ? 1 : 0,
      take: pageSize + 1
    });
    const page = toPostPage(records, currentUserId, friendIds, pageSize);
    metadata.itemCount = page.items.length;
    metadata.hasMore = page.hasMore;
    return page;
  }, metadata);
}

export async function getPostCommentsPage(
  postId: string,
  currentUserId?: string,
  cursor?: string | null
): Promise<CursorPage<PostComment>> {
  const parsedCursor = cursorSchema.parse(cursor) ?? undefined;
  const pageSize = pageSizeSchema.parse(PAGINATION_LIMITS.comments);
  const metadata = { route: "/feed", itemCount: 0, hasMore: false };

  return measureAsync("comments.page", async () => {
    const [post, friendIds] = await Promise.all([
      prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true, visibility: true, isHidden: true }
      }),
      getAcceptedFriendIds(currentUserId)
    ]);

    if (!post || post.isHidden || !canViewerSeePost(post, currentUserId, friendIds)) {
      return { items: [], nextCursor: null, hasMore: false };
    }

    const records = await prisma.comment.findMany({
      where: { postId, parentId: null },
      relationLoadStrategy: "join",
      include: {
        author: { select: postAuthorSelect },
        replies: {
          take: PAGINATION_LIMITS.replyPreview,
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          include: {
            author: { select: postAuthorSelect },
            replies: false
          }
        }
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      cursor: parsedCursor ? { id: parsedCursor } : undefined,
      skip: parsedCursor ? 1 : 0,
      take: pageSize + 1
    });
    const serialized = records.map((comment) => toPostComment(comment, currentUserId, post.authorId));
    const page = toCursorPage(serialized, pageSize);
    metadata.itemCount = page.items.length;
    metadata.hasMore = page.hasMore;
    return page;
  }, metadata);
}

export async function getCommentRepliesPage(
  commentId: string,
  currentUserId?: string,
  cursor?: string | null
): Promise<CursorPage<PostComment>> {
  const parsedCursor = cursorSchema.parse(cursor) ?? undefined;
  const pageSize = pageSizeSchema.parse(PAGINATION_LIMITS.replies);
  const metadata = { route: "/feed", itemCount: 0, hasMore: false };

  return measureAsync("replies.page", async () => {
    const parent = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        post: { select: { authorId: true, visibility: true, isHidden: true } }
      }
    });
    const friendIds = await getAcceptedFriendIds(currentUserId);
    if (!parent || parent.post.isHidden || !canViewerSeePost(parent.post, currentUserId, friendIds)) {
      return { items: [], nextCursor: null, hasMore: false };
    }

    const records = await prisma.comment.findMany({
      where: { parentId: parent.id },
      relationLoadStrategy: "join",
      include: {
        author: { select: postAuthorSelect },
        replies: false
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      cursor: parsedCursor ? { id: parsedCursor } : undefined,
      skip: parsedCursor ? 1 : 0,
      take: pageSize + 1
    });
    const serialized = records.map((reply) => ({
      id: reply.id,
      postId: reply.postId,
      authorId: reply.authorId,
      parentId: reply.parentId,
      content: reply.content,
      createdAt: reply.createdAt.toISOString(),
      updatedAt: reply.updatedAt.toISOString(),
      author: reply.author,
      replies: [],
      isOwner: reply.authorId === currentUserId,
      canDelete: reply.authorId === currentUserId || parent.post.authorId === currentUserId
    }));
    const page = toCursorPage(serialized, pageSize);
    metadata.itemCount = page.items.length;
    metadata.hasMore = page.hasMore;
    return page;
  }, metadata);
}

export async function getProfilePostsWithComments(profileUserId: string, currentUserId?: string) {
  const metadata = {
    route: profileUserId === currentUserId ? "/profile" : "/profile/[username]",
    postCount: 0,
    rootCommentCount: 0,
    replyCount: 0,
    isOwnProfile: profileUserId === currentUserId
  };

  return measureAsync("profile.postsWithComments", async () => {
    const friendIds = profileUserId === currentUserId
      ? new Set<string>()
      : await getAcceptedFriendIds(currentUserId);
    const records = await prisma.post.findMany({
      where: {
        authorId: profileUserId,
        isHidden: false,
        ...profileVisibilityWhere(profileUserId, currentUserId, friendIds)
      },
      relationLoadStrategy: "join",
      include: postWithCommentsInclude(currentUserId),
      orderBy: { createdAt: "desc" }
    });

    metadata.postCount = records.length;
    metadata.rootCommentCount = records.reduce((count, post) => count + post.comments.length, 0);
    metadata.replyCount = records.reduce(
      (count, post) => count + post.comments.reduce((sum, comment) => sum + comment.replies.length, 0),
      0
    );

    return {
      posts: records.map((post) => toFeedPost(post, currentUserId, friendIds)),
      commentsByPostId: new Map(
        records.map((post) => [
          post.id,
          post.comments.map((comment) => toPostComment(comment, currentUserId, post.authorId))
        ])
      )
    };
  }, metadata);
}

export async function getPostById(postId: string, currentUserId?: string): Promise<(FeedPost & { comments: PostComment[] }) | null> {
  const friendIds = await getAcceptedFriendIds(currentUserId);
  const post = await prisma.post.findUnique({
    where: { id: postId },
    relationLoadStrategy: "join",
    include: postInclude(currentUserId)
  });

  if (!post || post.isHidden || !canViewerSeePost(post, currentUserId, friendIds)) {
    return null;
  }

  const comments = await getPostComments(postId, currentUserId);

  return {
    ...toFeedPost(post, currentUserId, friendIds),
    comments
  };
}

export async function getPostComments(postId: string, currentUserId?: string): Promise<PostComment[]> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      authorId: true
    }
  });

  if (!post) {
    return [];
  }

  const comments = await prisma.comment.findMany({
    where: {
      postId,
      parentId: null
    },
    relationLoadStrategy: "join",
    include: {
      author: {
        select: postAuthorSelect
      },
      replies: {
        orderBy: {
          createdAt: "asc"
        },
        include: {
          author: {
            select: postAuthorSelect
          },
          replies: false
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  return comments.map((comment) => toPostComment(comment, currentUserId, post.authorId));
}

export async function getCommentsForPosts(
  posts: ReadonlyArray<{ id: string; author: { id: string } }>,
  currentUserId?: string
): Promise<Map<string, PostComment[]>> {
  if (posts.length === 0) {
    return new Map();
  }

  const comments = await prisma.comment.findMany({
    where: {
      postId: { in: posts.map((post) => post.id) },
      parentId: null
    },
    relationLoadStrategy: "join",
    include: {
      author: { select: postAuthorSelect },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: postAuthorSelect },
          replies: false
        }
      }
    },
    orderBy: { createdAt: "asc" }
  });
  const postAuthorIds = new Map(posts.map((post) => [post.id, post.author.id]));
  const commentsByPostId = new Map<string, PostComment[]>(
    posts.map((post) => [post.id, []])
  );

  for (const comment of comments) {
    const postAuthorId = postAuthorIds.get(comment.postId);
    if (!postAuthorId) continue;
    commentsByPostId.get(comment.postId)?.push(
      toPostComment(comment, currentUserId, postAuthorId)
    );
  }

  return commentsByPostId;
}

async function getAcceptedFriendIds(currentUserId?: string) {
  if (!currentUserId) {
    return new Set<string>();
  }

  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: currentUserId }, { addresseeId: currentUserId }]
    },
    select: {
      requesterId: true,
      addresseeId: true
    }
  });

  return new Set(
    friendships.map((friendship) =>
      friendship.requesterId === currentUserId ? friendship.addresseeId : friendship.requesterId
    )
  );
}

function visibilityWhere(currentUserId: string | undefined): Prisma.PostWhereInput {
  const publicWhere: Prisma.PostWhereInput = { visibility: "PUBLIC" };

  if (!currentUserId) {
    return publicWhere;
  }

  return {
    OR: [
      publicWhere,
      { authorId: currentUserId },
      {
        visibility: "FRIENDS_ONLY",
        author: {
          OR: [
            {
              sentFriendRequests: {
                some: { status: "ACCEPTED", addresseeId: currentUserId }
              }
            },
            {
              receivedFriendRequests: {
                some: { status: "ACCEPTED", requesterId: currentUserId }
              }
            }
          ]
        }
      }
    ]
  };
}

function profileVisibilityWhere(
  profileUserId: string,
  currentUserId: string | undefined,
  friendIds: Set<string>
): Prisma.PostWhereInput {
  if (profileUserId === currentUserId) {
    return {};
  }

  if (friendIds.has(profileUserId)) {
    return {
      visibility: {
        in: ["PUBLIC", "FRIENDS_ONLY"]
      }
    };
  }

  return {
    visibility: "PUBLIC"
  };
}

function canViewerSeePost(
  post: { authorId: string; visibility: PostVisibility },
  currentUserId: string | undefined,
  friendIds: Set<string>
) {
  if (post.visibility === "PUBLIC" || post.authorId === currentUserId) {
    return true;
  }

  return post.visibility === "FRIENDS_ONLY" && friendIds.has(post.authorId);
}

function toPostPage(
  records: FeedPostWithPreviewRecord[],
  currentUserId: string | undefined,
  friendIds: Set<string>,
  pageSize: number
): CursorPage<PostPageItem> {
  const serialized = records.map((record) => ({
    id: record.id,
    post: toFeedPost(record, currentUserId, friendIds),
    comments: record.comments.map((comment) =>
      toPostComment(comment, currentUserId, record.authorId)
    )
  }));

  return toCursorPage(serialized, pageSize);
}

function toFeedPost(post: FeedPostRecord, currentUserId: string | undefined, friendIds: Set<string>): FeedPost {
  return {
    id: post.id,
    content: post.content,
    repostNote: post.repostNote,
    visibility: post.visibility,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    author: post.author,
    media: post.media.map(toPostMedia),
    likesCount: post._count.likes,
    commentsCount: post._count.comments,
    repostsCount: post._count.reposts,
    likedByMe: post.likes.length > 0,
    isOwner: post.authorId === currentUserId,
    originalPost: toOriginalPostPreview(post.originalPost, currentUserId, friendIds)
  };
}

function toOriginalPostPreview(
  post: OriginalPostRecord | null,
  currentUserId: string | undefined,
  friendIds: Set<string>
): OriginalPostPreview | null {
  if (!post || post.isHidden || !canViewerSeePost(post, currentUserId, friendIds)) {
    return null;
  }

  return {
    id: post.id,
    content: post.content,
    createdAt: post.createdAt.toISOString(),
    author: post.author,
    media: post.media.map(toPostMedia)
  };
}

function toPostMedia(media: {
  id: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  publicId: string;
  width: number | null;
  height: number | null;
  duration: number | null;
  format: string | null;
  size: number | null;
  order: number;
  createdAt: Date;
}): PostMedia {
  return {
    ...media,
    createdAt: media.createdAt.toISOString()
  };
}

function toPostComment(comment: CommentRecord, currentUserId: string | undefined, postAuthorId: string): PostComment {
  const isOwner = comment.authorId === currentUserId;
  const canDelete = isOwner || postAuthorId === currentUserId;

  return {
    id: comment.id,
    postId: comment.postId,
    authorId: comment.authorId,
    parentId: comment.parentId,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    author: comment.author,
    replies: comment.replies.map((reply) => ({
      id: reply.id,
      postId: reply.postId,
      authorId: reply.authorId,
      parentId: reply.parentId,
      content: reply.content,
      createdAt: reply.createdAt.toISOString(),
      updatedAt: reply.updatedAt.toISOString(),
      author: reply.author,
      replies: [],
      isOwner: reply.authorId === currentUserId,
      canDelete: reply.authorId === currentUserId || postAuthorId === currentUserId
    })),
    isOwner,
    canDelete
  };
}
