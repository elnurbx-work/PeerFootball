import type { PostMedia } from "@/types/post.types";
import { cn } from "@/lib/utils";

type PostMediaGridProps = {
  media: PostMedia[];
  compact?: boolean;
};

export function PostMediaGrid({ media, compact = false }: PostMediaGridProps) {
  if (!media.length) {
    return null;
  }

  const visibleMedia = media.slice(0, 4);

  return (
    <div
      className={cn(
        "grid overflow-hidden rounded-md border bg-secondary",
        visibleMedia.length === 1 && "grid-cols-1",
        visibleMedia.length === 2 && "grid-cols-2",
        visibleMedia.length >= 3 && "grid-cols-2",
        compact ? "max-h-72" : "max-h-[520px]"
      )}
    >
      {visibleMedia.map((item, index) => (
        <div
          key={item.id}
          className={cn(
            "relative min-h-44 overflow-hidden bg-black",
            compact && "min-h-32",
            visibleMedia.length === 1 && (compact ? "aspect-video" : "aspect-[4/3]"),
            visibleMedia.length === 3 && index === 0 && "row-span-2"
          )}
        >
          {item.type === "IMAGE" ? (
            <img
              src={item.url}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <video
              className="h-full w-full object-cover"
              autoPlay
              controls
              loop
              muted
              playsInline
              preload="auto"
              src={item.url}
            />
          )}
        </div>
      ))}
    </div>
  );
}
