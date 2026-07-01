import { ImagePlus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function PostComposer() {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <Textarea placeholder="Share a football update..." rows={4} />
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" type="button">
            <ImagePlus className="h-4 w-4" />
            Add Media
          </Button>
          <Button type="button">
            <Send className="h-4 w-4" />
            Post
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
