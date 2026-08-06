import { MatchCommentForm } from "@/components/matches/match-comment-form";
import { MatchCommentList } from "@/components/matches/match-comment-list";
import type { MatchCommentDto } from "@/types/match.types";
import type { ExtractedTimestamp } from "@/lib/videos/time";
export function MatchCommentsTab({ matchId, comments, onTimestampClick, isAuthenticated = true }: { matchId: string; comments: MatchCommentDto[]; onTimestampClick?: (timestamp: ExtractedTimestamp) => void; isAuthenticated?: boolean }) { return <div className="grid gap-5"><MatchCommentForm matchId={matchId} isAuthenticated={isAuthenticated} /><MatchCommentList matchId={matchId} comments={comments} onTimestampClick={onTimestampClick} isAuthenticated={isAuthenticated} /></div>; }
