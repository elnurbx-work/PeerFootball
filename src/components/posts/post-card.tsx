import { MessageCircle, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type PostCardProps = {
  post: {
    authorName: string;
    username: string;
    content: string;
    createdAt: string;
    likes: number;
    comments: number;
  };
};

export function PostCard({ post }: PostCardProps) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-secondary font-semibold">
            {post.authorName.charAt(0)}
          </div>
          <div>
            <p className="font-semibold">{post.authorName}</p>
            <p className="text-sm text-muted-foreground">
              @{post.username} · {post.createdAt}
            </p>
          </div>
        </div>
        <p className="leading-7">{post.content}</p>
        <div className="flex gap-2 border-t pt-3">
          <Button variant="ghost" size="sm" type="button">
            <ThumbsUp className="h-4 w-4" />
            {post.likes}
          </Button>
          <Button variant="ghost" size="sm" type="button">
            <MessageCircle className="h-4 w-4" />
            {post.comments}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
