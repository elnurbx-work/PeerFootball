import "server-only";

import type { Prisma, PostVisibility } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { FeedPost, OriginalPostPreview, PostComment, PostMedia } from "@/types/post.types";

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
  const friendIds = await getAcceptedFriendIds(currentUserId);
  const posts = await prisma.post.findMany({
    where: visibilityWhere(currentUserId, friendIds),
    include: postInclude(currentUserId),
    orderBy: {
      createdAt: "desc"
    },
    take: 20
  });

  return posts.map((post) => toFeedPost(post, currentUserId, friendIds));
}

export async function getProfilePosts(profileUserId: string, currentUserId?: string): Promise<FeedPost[]> {
  const friendIds = await getAcceptedFriendIds(currentUserId);
  const posts = await prisma.post.findMany({
    where: {
      authorId: profileUserId,
      ...profileVisibilityWhere(profileUserId, currentUserId, friendIds)
    },
    include: postInclude(currentUserId),
    orderBy: {
      createdAt: "desc"
    }
  });

  return posts.map((post) => toFeedPost(post, currentUserId, friendIds));
}

export async function getPostById(postId: string, currentUserId?: string): Promise<(FeedPost & { comments: PostComment[] }) | null> {
  const friendIds = await getAcceptedFriendIds(currentUserId);
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: postInclude(currentUserId)
  });

  if (!post || !canViewerSeePost(post, currentUserId, friendIds)) {
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

function visibilityWhere(currentUserId: string | undefined, friendIds: Set<string>): Prisma.PostWhereInput {
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
        authorId: {
          in: [...friendIds]
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
  if (!post || !canViewerSeePost(post, currentUserId, friendIds)) {
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
