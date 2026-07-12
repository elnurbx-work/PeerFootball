import { MatchCommentForm } from "@/components/matches/match-comment-form";
import { MatchCommentList } from "@/components/matches/match-comment-list";
import type { MatchCommentDto } from "@/types/match.types";
import type { ExtractedTimestamp } from "@/lib/videos/time";
export function MatchCommentsTab({ matchId, comments, onTimestampClick }: { matchId: string; comments: MatchCommentDto[]; onTimestampClick?: (timestamp: ExtractedTimestamp) => void }) { return <div className="grid gap-5"><MatchCommentForm matchId={matchId} /><MatchCommentList matchId={matchId} comments={comments} onTimestampClick={onTimestampClick} /></div>; }
