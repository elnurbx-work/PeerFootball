export type MediaType = "IMAGE" | "VIDEO";

export type Post = {
  id: string;
  authorId: string;
  content: string;
  mediaUrl?: string | null;
  mediaType?: MediaType | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: Date;
};

export type Like = {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
};
