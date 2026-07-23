export type MediaType = "IMAGE" | "VIDEO";
export type PostVisibility = "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE";

export type PostAuthor = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
};

export type PostMedia = {
  id: string;
  type: MediaType;
  url: string;
  publicId: string;
  width: number | null;
  height: number | null;
  duration: number | null;
  format: string | null;
  size: number | null;
  order: number;
  createdAt: string;
};

export type OriginalPostPreview = {
  id: string;
  content: string | null;
  createdAt: string;
  author: PostAuthor;
  media: PostMedia[];
  isDeleted?: boolean;
};

export type FeedPost = {
  id: string;
  content: string | null;
  repostNote: string | null;
  visibility: PostVisibility;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  media: PostMedia[];
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  likedByMe: boolean;
  isOwner: boolean;
  originalPost: OriginalPostPreview | null;
};

export type PostPageItem = {
  id: string;
  post: FeedPost;
  comments: PostComment[];
};

export type PostComment = {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  replies: PostComment[];
  isOwner: boolean;
  canDelete: boolean;
};

export type CreatePostInput = {
  content?: string;
  visibility?: PostVisibility;
  media?: File[];
};

export type CreateCommentInput = {
  postId: string;
  parentId?: string;
  content: string;
};

export type RepostInput = {
  originalPostId: string;
  repostNote?: string;
};
