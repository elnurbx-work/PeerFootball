export type MatchVideoProvider = "GOOGLE_DRIVE" | "YOUTUBE" | "EXTERNAL";
export type MatchVideoSeekMode = "GOOGLE_DRIVE_RELOAD" | "YOUTUBE_START_PARAM" | "NONE";

export type NormalizedMatchVideoUrl = {
  provider: MatchVideoProvider;
  originalUrl: string;
  embedUrl: string;
  videoId?: string;
  supportsTimestampSeek: boolean;
  seekMode: MatchVideoSeekMode;
};

export function normalizeMatchVideoUrl(url: string): NormalizedMatchVideoUrl {
  const originalUrl = url.trim();
  try {
    const parsed = new URL(originalUrl);
    if (parsed.hostname === "drive.google.com") {
      const match = parsed.pathname.match(/^\/file\/d\/([^/]+)\/(?:view|preview)\/?$/i);
      if (match?.[1]) {
        const videoId = decodeURIComponent(match[1]);
        return { provider: "GOOGLE_DRIVE", originalUrl, embedUrl: `https://drive.google.com/file/d/${encodeURIComponent(videoId)}/preview`, videoId, supportsTimestampSeek: true, seekMode: "GOOGLE_DRIVE_RELOAD" };
      }
    }
    const videoId = getYoutubeVideoId(parsed);
    if (videoId) {
      return { provider: "YOUTUBE", originalUrl, embedUrl: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`, videoId, supportsTimestampSeek: true, seekMode: "YOUTUBE_START_PARAM" };
    }
  } catch {
    // Validation reports malformed URLs; normalization stays side-effect free.
  }
  return { provider: "EXTERNAL", originalUrl, embedUrl: originalUrl, supportsTimestampSeek: false, seekMode: "NONE" };
}

export function getMatchVideoSeekUrl(video: Pick<NormalizedMatchVideoUrl, "embedUrl" | "seekMode">, seconds: number) {
  if (video.seekMode === "NONE") return video.embedUrl;
  const url = new URL(video.embedUrl);
  url.searchParams.set(video.seekMode === "YOUTUBE_START_PARAM" ? "start" : "t", String(Math.max(0, Math.floor(seconds))));
  return url.toString();
}

function getYoutubeVideoId(url: URL) {
  const hostname = url.hostname.replace(/^www\./, "");
  if (hostname === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] ?? null;
  if (hostname !== "youtube.com") return null;
  if (url.pathname === "/watch") return url.searchParams.get("v");
  const embedMatch = url.pathname.match(/^\/embed\/([^/]+)\/?$/);
  return embedMatch?.[1] ?? null;
}
