-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "AppLocale" AS ENUM ('AZ', 'EN', 'RU');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'CAPTAIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "ClubVisibility" AS ENUM ('OPEN', 'REQUEST_ONLY', 'INVITE_ONLY');

-- CreateEnum
CREATE TYPE "ClubRole" AS ENUM ('OWNER', 'TD', 'YTD', 'PLAYER');

-- CreateEnum
CREATE TYPE "ClubMemberStatus" AS ENUM ('ACTIVE', 'INVITED', 'REQUESTED', 'LEFT', 'REMOVED');

-- CreateEnum
CREATE TYPE "ClubPermissionPolicy" AS ENUM ('OWNER_ONLY', 'OWNER_TD', 'OWNER_TD_YTD');

-- CreateEnum
CREATE TYPE "GuestInvitePolicy" AS ENUM ('CLOSED', 'ONLY_OWNER_TD_YTD', 'PLAYERS_CAN_INVITE_FRIENDS');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('DRAFT', 'PENDING', 'ACCEPTED', 'REJECTED', 'SCHEDULED', 'LIVE', 'RESULT_PENDING', 'COMPLETED', 'DISPUTED', 'CANCELLED', 'PENDING_OPPONENT_APPROVAL', 'RESULT_PENDING_CONFIRMATION', 'FINISHED');

-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('INTERNAL', 'CLUB_VS_CLUB');

-- CreateEnum
CREATE TYPE "MatchSource" AS ENUM ('MANUAL', 'TOURNAMENT', 'LEAGUE');

-- CreateEnum
CREATE TYPE "MatchFormat" AS ENUM ('FIVE_V_FIVE', 'SIX_V_SIX', 'SEVEN_V_SEVEN', 'EIGHT_V_EIGHT', 'NINE_V_NINE', 'ELEVEN_V_ELEVEN');

-- CreateEnum
CREATE TYPE "MatchCategory" AS ENUM ('FRIENDLY', 'TRAINING', 'OFFICIAL');

-- CreateEnum
CREATE TYPE "MatchSideType" AS ENUM ('HOME', 'AWAY', 'TEAM_A', 'TEAM_B');

-- CreateEnum
CREATE TYPE "MatchPlayerStatus" AS ENUM ('SELECTED', 'INVITED', 'ACCEPTED', 'DECLINED', 'MAYBE', 'REMOVED');

-- CreateEnum
CREATE TYPE "MatchLineupRole" AS ENUM ('STARTER', 'SUBSTITUTE');

-- CreateEnum
CREATE TYPE "MatchCancellationReason" AS ENUM ('PLAYER_SHORTAGE', 'VENUE_PROBLEM', 'DATE_UNAVAILABLE', 'WEATHER', 'MUTUAL_AGREEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "FootballPosition" AS ENUM ('GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'CF', 'ST', 'OTHER');

-- CreateEnum
CREATE TYPE "MatchVideoProvider" AS ENUM ('GOOGLE_DRIVE', 'YOUTUBE', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "MatchVideoType" AS ENUM ('FULL_MATCH', 'FIRST_HALF', 'SECOND_HALF', 'OTHER');

-- CreateEnum
CREATE TYPE "LineupPlanStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LineupPitchType" AS ENUM ('FULL', 'HALF', 'SMALL');

-- CreateEnum
CREATE TYPE "TacticCategory" AS ENUM ('ATTACK', 'DEFENCE', 'TRANSITION', 'PRESSING', 'BUILD_UP', 'SET_PIECE', 'TRAINING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TacticVisibility" AS ENUM ('PRIVATE', 'COACHING_STAFF', 'TEAM_MEMBERS', 'PUBLIC');

-- CreateEnum
CREATE TYPE "TacticStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TacticActionType" AS ENUM ('MOVE', 'RUN', 'SPRINT', 'DRIBBLE', 'PASS', 'CROSS', 'SHOT', 'PRESS', 'HOLD_POSITION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TacticEasing" AS ENUM ('LINEAR', 'EASE_IN', 'EASE_OUT', 'EASE_IN_OUT');

-- CreateEnum
CREATE TYPE "TacticBallActionType" AS ENUM ('MOVE', 'PASS', 'CROSS', 'DRIBBLE', 'SHOT', 'FREE');

-- CreateEnum
CREATE TYPE "TacticAnnotationType" AS ENUM ('ARROW', 'TEXT', 'ZONE', 'CIRCLE');

-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'FRIENDS_ONLY', 'PRIVATE');

-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('PUBLIC', 'FRIENDS_ONLY', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('DIRECT', 'TEAM', 'MATCH', 'CLUB');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('POST_LIKE', 'POST_COMMENT', 'COMMENT_REPLY', 'POST_REPOST', 'FRIEND_REQUEST', 'FRIEND_ACCEPTED', 'MESSAGE', 'MATCH_INVITATION_RECEIVED', 'MATCH_INVITATION_ACCEPTED', 'MATCH_INVITATION_REJECTED', 'MATCH_CANCELLED', 'MATCH_PLAYER_INVITED', 'MATCH_ATTENDANCE_UPDATED', 'MATCH_RESULT_SUBMITTED', 'MATCH_RESULT_CONFIRMED', 'MATCH_RESULT_DISPUTED', 'MATCH_COMPLETED');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('OPEN', 'REVIEWED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "image" TEXT,
    "coverImage" TEXT,
    "username" TEXT,
    "bio" TEXT,
    "favoriteClub" TEXT,
    "preferredPosition" TEXT,
    "avoidedPosition" TEXT,
    "location" TEXT,
    "locale" "AppLocale" NOT NULL DEFAULT 'AZ',
    "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "bannedAt" TIMESTAMP(3),
    "banReason" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFavoriteTeam" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "league" TEXT,
    "logoUrl" TEXT,
    "badgeUrl" TEXT,
    "source" TEXT NOT NULL DEFAULT 'thesportsdb',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFavoriteTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'OPEN',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEncryptedProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'AES-GCM',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEncryptedProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT,
    "visibility" "PostVisibility" NOT NULL DEFAULT 'PUBLIC',
    "originalPostId" TEXT,
    "repostNote" TEXT,
    "ciphertext" TEXT,
    "iv" TEXT,
    "algorithm" TEXT DEFAULT 'AES-GCM',
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "hiddenAt" TIMESTAMP(3),
    "moderationNote" TEXT,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostReport" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "postAuthorId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "PostReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostMedia" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "duration" DOUBLE PRECISION,
    "format" TEXT,
    "size" INTEGER,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "type" "ConversationType" NOT NULL,
    "clubId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationMember" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "encryptedConversationKey" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "ConversationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'aes-256-gcm',
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "NotificationType" NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "conversationId" TEXT,
    "messageId" TEXT,
    "friendshipId" TEXT,
    "matchId" TEXT,
    "title" TEXT,
    "body" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logoUrl" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "position" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "logoPublicId" TEXT,
    "coverUrl" TEXT,
    "coverPublicId" TEXT,
    "country" TEXT,
    "city" TEXT,
    "ownerId" TEXT NOT NULL,
    "visibility" "ClubVisibility" NOT NULL DEFAULT 'REQUEST_ONLY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deactivatedAt" TIMESTAMP(3),
    "deactivatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubSettings" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "joinApprovalPolicy" "ClubPermissionPolicy" NOT NULL DEFAULT 'OWNER_TD',
    "invitePermissionPolicy" "ClubPermissionPolicy" NOT NULL DEFAULT 'OWNER_TD',
    "matchCreatePermissionPolicy" "ClubPermissionPolicy" NOT NULL DEFAULT 'OWNER_TD',
    "guestInvitePolicy" "GuestInvitePolicy" NOT NULL DEFAULT 'ONLY_OWNER_TD_YTD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubMember" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ClubRole" NOT NULL DEFAULT 'PLAYER',
    "status" "ClubMemberStatus" NOT NULL DEFAULT 'REQUESTED',
    "invitedById" TEXT,
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubGuest" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "position" "FootballPosition",
    "phone" TEXT,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubGuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubMetricDefinition" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubMetricDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "type" "MatchType" NOT NULL,
    "source" "MatchSource" NOT NULL DEFAULT 'MANUAL',
    "format" "MatchFormat",
    "category" "MatchCategory" NOT NULL DEFAULT 'FRIENDLY',
    "status" "MatchStatus" NOT NULL DEFAULT 'DRAFT',
    "creatorClubId" TEXT NOT NULL,
    "homeClubId" TEXT,
    "awayClubId" TEXT,
    "title" TEXT,
    "venue" TEXT,
    "note" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "resultNote" TEXT,
    "resultSubmittedById" TEXT,
    "resultSubmittedByClubId" TEXT,
    "resultSubmittedAt" TIMESTAMP(3),
    "resultConfirmedById" TEXT,
    "resultReviewedByClubId" TEXT,
    "resultConfirmedAt" TIMESTAMP(3),
    "alternativeHomeScore" INTEGER,
    "alternativeAwayScore" INTEGER,
    "rejectionReason" TEXT,
    "cancellationReason" "MatchCancellationReason",
    "cancellationNote" TEXT,
    "disputeReason" TEXT,
    "adminDecisionNote" TEXT,
    "completedAt" TIMESTAMP(3),
    "statsAppliedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchSide" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "clubId" TEXT,
    "name" TEXT NOT NULL,
    "side" "MatchSideType" NOT NULL,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchSide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchPlayer" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "matchSideId" TEXT NOT NULL,
    "userId" TEXT,
    "clubGuestId" TEXT,
    "guestName" TEXT,
    "position" "FootballPosition",
    "shirtNumber" INTEGER,
    "status" "MatchPlayerStatus" NOT NULL DEFAULT 'SELECTED',
    "lineupRole" "MatchLineupRole" NOT NULL DEFAULT 'SUBSTITUTE',
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,
    "isGoalkeeper" BOOLEAN NOT NULL DEFAULT false,
    "invitedById" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubStats" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "goalsFor" INTEGER NOT NULL DEFAULT 0,
    "goalsAgainst" INTEGER NOT NULL DEFAULT 0,
    "goalDifference" INTEGER NOT NULL DEFAULT 0,
    "recentForm" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchVideo" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "embedUrl" TEXT NOT NULL,
    "provider" "MatchVideoProvider" NOT NULL,
    "videoType" "MatchVideoType" NOT NULL DEFAULT 'FULL_MATCH',
    "matchStartSecond" INTEGER NOT NULL DEFAULT 0,
    "publicId" TEXT,
    "title" TEXT,
    "description" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchGoal" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "matchSideId" TEXT NOT NULL,
    "matchPlayerId" TEXT,
    "playerName" TEXT NOT NULL,
    "minute" INTEGER,
    "extraMinute" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchComment" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineupPlan" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "playerCount" INTEGER NOT NULL,
    "formationCode" TEXT NOT NULL,
    "pitchType" "LineupPitchType" NOT NULL DEFAULT 'FULL',
    "status" "LineupPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LineupPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineupSlot" (
    "id" TEXT NOT NULL,
    "lineupPlanId" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" "FootballPosition",
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "assignedClubMemberId" TEXT,
    "shirtNumber" INTEGER,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,
    "isGoalkeeper" BOOLEAN NOT NULL DEFAULT false,
    "isSubstitute" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LineupSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tactic" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "lineupPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "TacticCategory" NOT NULL,
    "visibility" "TacticVisibility" NOT NULL DEFAULT 'COACHING_STAFF',
    "durationMs" INTEGER NOT NULL DEFAULT 10000,
    "status" "TacticStatus" NOT NULL DEFAULT 'DRAFT',
    "snapshotData" JSONB NOT NULL,
    "previewData" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tactic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TacticScene" (
    "id" TEXT NOT NULL,
    "tacticId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL DEFAULT 2000,
    "startState" JSONB NOT NULL,
    "endState" JSONB NOT NULL,
    "ballStartState" JSONB,
    "ballEndState" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TacticScene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TacticPlayerAction" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,
    "type" "TacticActionType" NOT NULL,
    "targetSlotKey" TEXT,
    "startX" DOUBLE PRECISION NOT NULL,
    "startY" DOUBLE PRECISION NOT NULL,
    "endX" DOUBLE PRECISION NOT NULL,
    "endY" DOUBLE PRECISION NOT NULL,
    "startTimeMs" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "easing" "TacticEasing" NOT NULL DEFAULT 'LINEAR',
    "label" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TacticPlayerAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TacticBallAction" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "type" "TacticBallActionType" NOT NULL,
    "sourceSlotKey" TEXT,
    "targetSlotKey" TEXT,
    "startX" DOUBLE PRECISION NOT NULL,
    "startY" DOUBLE PRECISION NOT NULL,
    "endX" DOUBLE PRECISION NOT NULL,
    "endY" DOUBLE PRECISION NOT NULL,
    "startTimeMs" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "easing" "TacticEasing" NOT NULL DEFAULT 'LINEAR',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TacticBallAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TacticAnnotation" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "type" "TacticAnnotationType" NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "label" TEXT,
    "description" TEXT,
    "startTimeMs" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TacticAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchTactic" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "tacticId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "attachedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchTactic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "preferredFoot" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "UserFavoriteTeam_userId_idx" ON "UserFavoriteTeam"("userId");

-- CreateIndex
CREATE INDEX "UserFavoriteTeam_name_idx" ON "UserFavoriteTeam"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserFavoriteTeam_userId_externalId_key" ON "UserFavoriteTeam"("userId", "externalId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Feedback_status_createdAt_idx" ON "Feedback"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Feedback_userId_createdAt_idx" ON "Feedback"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserEncryptedProfile_userId_key" ON "UserEncryptedProfile"("userId");

-- CreateIndex
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");

-- CreateIndex
CREATE INDEX "Post_authorId_createdAt_idx" ON "Post"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "Post_originalPostId_idx" ON "Post"("originalPostId");

-- CreateIndex
CREATE INDEX "Post_visibility_idx" ON "Post"("visibility");

-- CreateIndex
CREATE INDEX "Post_isHidden_createdAt_idx" ON "Post"("isHidden", "createdAt");

-- CreateIndex
CREATE INDEX "PostReport_status_createdAt_idx" ON "PostReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PostReport_postAuthorId_createdAt_idx" ON "PostReport"("postAuthorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PostReport_postId_reporterId_key" ON "PostReport"("postId", "reporterId");

-- CreateIndex
CREATE INDEX "PostMedia_postId_idx" ON "PostMedia"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "PostMedia_postId_order_key" ON "PostMedia"("postId", "order");

-- CreateIndex
CREATE INDEX "Comment_postId_createdAt_idx" ON "Comment"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX "PostLike_postId_idx" ON "PostLike"("postId");

-- CreateIndex
CREATE INDEX "PostLike_userId_idx" ON "PostLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PostLike_userId_postId_key" ON "PostLike"("userId", "postId");

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "Friendship_requesterId_status_idx" ON "Friendship"("requesterId", "status");

-- CreateIndex
CREATE INDEX "Friendship_addresseeId_status_idx" ON "Friendship"("addresseeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_requesterId_addresseeId_key" ON "Friendship"("requesterId", "addresseeId");

-- CreateIndex
CREATE INDEX "Block_blockerId_idx" ON "Block"("blockerId");

-- CreateIndex
CREATE INDEX "Block_blockedId_idx" ON "Block"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "Block_blockerId_blockedId_key" ON "Block"("blockerId", "blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_clubId_key" ON "Conversation"("clubId");

-- CreateIndex
CREATE INDEX "ConversationMember_userId_idx" ON "ConversationMember"("userId");

-- CreateIndex
CREATE INDEX "ConversationMember_conversationId_idx" ON "ConversationMember"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationMember_conversationId_userId_key" ON "ConversationMember"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Notification_recipientId_createdAt_idx" ON "Notification"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_recipientId_readAt_idx" ON "Notification"("recipientId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_actorId_idx" ON "Notification"("actorId");

-- CreateIndex
CREATE INDEX "Notification_postId_idx" ON "Notification"("postId");

-- CreateIndex
CREATE INDEX "Notification_commentId_idx" ON "Notification"("commentId");

-- CreateIndex
CREATE INDEX "Notification_conversationId_idx" ON "Notification"("conversationId");

-- CreateIndex
CREATE INDEX "Notification_matchId_idx" ON "Notification"("matchId");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Team_ownerId_idx" ON "Team"("ownerId");

-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Club_slug_key" ON "Club"("slug");

-- CreateIndex
CREATE INDEX "Club_ownerId_idx" ON "Club"("ownerId");

-- CreateIndex
CREATE INDEX "Club_isActive_idx" ON "Club"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ClubSettings_clubId_key" ON "ClubSettings"("clubId");

-- CreateIndex
CREATE INDEX "ClubMember_clubId_idx" ON "ClubMember"("clubId");

-- CreateIndex
CREATE INDEX "ClubMember_userId_idx" ON "ClubMember"("userId");

-- CreateIndex
CREATE INDEX "ClubMember_clubId_role_idx" ON "ClubMember"("clubId", "role");

-- CreateIndex
CREATE INDEX "ClubMember_clubId_status_idx" ON "ClubMember"("clubId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ClubMember_clubId_userId_key" ON "ClubMember"("clubId", "userId");

-- CreateIndex
CREATE INDEX "ClubGuest_clubId_idx" ON "ClubGuest"("clubId");

-- CreateIndex
CREATE INDEX "ClubMetricDefinition_clubId_idx" ON "ClubMetricDefinition"("clubId");

-- CreateIndex
CREATE INDEX "ClubMetricDefinition_clubId_isActive_idx" ON "ClubMetricDefinition"("clubId", "isActive");

-- CreateIndex
CREATE INDEX "Match_creatorClubId_idx" ON "Match"("creatorClubId");

-- CreateIndex
CREATE INDEX "Match_homeClubId_idx" ON "Match"("homeClubId");

-- CreateIndex
CREATE INDEX "Match_awayClubId_idx" ON "Match"("awayClubId");

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE INDEX "Match_startTime_idx" ON "Match"("startTime");

-- CreateIndex
CREATE INDEX "Match_resultSubmittedByClubId_idx" ON "Match"("resultSubmittedByClubId");

-- CreateIndex
CREATE INDEX "MatchSide_matchId_idx" ON "MatchSide"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchSide_matchId_side_key" ON "MatchSide"("matchId", "side");

-- CreateIndex
CREATE INDEX "MatchPlayer_matchId_idx" ON "MatchPlayer"("matchId");

-- CreateIndex
CREATE INDEX "MatchPlayer_matchSideId_idx" ON "MatchPlayer"("matchSideId");

-- CreateIndex
CREATE INDEX "MatchPlayer_userId_idx" ON "MatchPlayer"("userId");

-- CreateIndex
CREATE INDEX "MatchPlayer_clubGuestId_idx" ON "MatchPlayer"("clubGuestId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchPlayer_matchId_userId_key" ON "MatchPlayer"("matchId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClubStats_clubId_key" ON "ClubStats"("clubId");

-- CreateIndex
CREATE INDEX "MatchVideo_matchId_idx" ON "MatchVideo"("matchId");

-- CreateIndex
CREATE INDEX "MatchGoal_matchId_idx" ON "MatchGoal"("matchId");

-- CreateIndex
CREATE INDEX "MatchGoal_matchSideId_idx" ON "MatchGoal"("matchSideId");

-- CreateIndex
CREATE INDEX "MatchComment_matchId_createdAt_idx" ON "MatchComment"("matchId", "createdAt");

-- CreateIndex
CREATE INDEX "MatchComment_parentId_idx" ON "MatchComment"("parentId");

-- CreateIndex
CREATE INDEX "LineupPlan_clubId_status_updatedAt_idx" ON "LineupPlan"("clubId", "status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LineupPlan_clubId_name_key" ON "LineupPlan"("clubId", "name");

-- CreateIndex
CREATE INDEX "LineupSlot_lineupPlanId_sortOrder_idx" ON "LineupSlot"("lineupPlanId", "sortOrder");

-- CreateIndex
CREATE INDEX "LineupSlot_assignedClubMemberId_idx" ON "LineupSlot"("assignedClubMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "LineupSlot_lineupPlanId_slotKey_key" ON "LineupSlot"("lineupPlanId", "slotKey");

-- CreateIndex
CREATE UNIQUE INDEX "LineupSlot_lineupPlanId_assignedClubMemberId_key" ON "LineupSlot"("lineupPlanId", "assignedClubMemberId");

-- CreateIndex
CREATE INDEX "Tactic_clubId_status_updatedAt_idx" ON "Tactic"("clubId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "Tactic_lineupPlanId_status_idx" ON "Tactic"("lineupPlanId", "status");

-- CreateIndex
CREATE INDEX "TacticScene_tacticId_sortOrder_idx" ON "TacticScene"("tacticId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TacticScene_tacticId_sortOrder_key" ON "TacticScene"("tacticId", "sortOrder");

-- CreateIndex
CREATE INDEX "TacticPlayerAction_sceneId_startTimeMs_idx" ON "TacticPlayerAction"("sceneId", "startTimeMs");

-- CreateIndex
CREATE INDEX "TacticPlayerAction_sceneId_slotKey_idx" ON "TacticPlayerAction"("sceneId", "slotKey");

-- CreateIndex
CREATE INDEX "TacticBallAction_sceneId_startTimeMs_idx" ON "TacticBallAction"("sceneId", "startTimeMs");

-- CreateIndex
CREATE INDEX "TacticAnnotation_sceneId_startTimeMs_idx" ON "TacticAnnotation"("sceneId", "startTimeMs");

-- CreateIndex
CREATE INDEX "MatchTactic_clubId_matchId_idx" ON "MatchTactic"("clubId", "matchId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchTactic_matchId_tacticId_key" ON "MatchTactic"("matchId", "tacticId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStats_userId_key" ON "PlayerStats"("userId");

-- AddForeignKey
ALTER TABLE "UserFavoriteTeam" ADD CONSTRAINT "UserFavoriteTeam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEncryptedProfile" ADD CONSTRAINT "UserEncryptedProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_originalPostId_fkey" FOREIGN KEY ("originalPostId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostReport" ADD CONSTRAINT "PostReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostReport" ADD CONSTRAINT "PostReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostReport" ADD CONSTRAINT "PostReport_postAuthorId_fkey" FOREIGN KEY ("postAuthorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostMedia" ADD CONSTRAINT "PostMedia_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMember" ADD CONSTRAINT "ConversationMember_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMember" ADD CONSTRAINT "ConversationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_friendshipId_fkey" FOREIGN KEY ("friendshipId") REFERENCES "Friendship"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_deactivatedById_fkey" FOREIGN KEY ("deactivatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubSettings" ADD CONSTRAINT "ClubSettings_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubGuest" ADD CONSTRAINT "ClubGuest_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubGuest" ADD CONSTRAINT "ClubGuest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMetricDefinition" ADD CONSTRAINT "ClubMetricDefinition_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMetricDefinition" ADD CONSTRAINT "ClubMetricDefinition_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_creatorClubId_fkey" FOREIGN KEY ("creatorClubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeClubId_fkey" FOREIGN KEY ("homeClubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_awayClubId_fkey" FOREIGN KEY ("awayClubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_resultSubmittedById_fkey" FOREIGN KEY ("resultSubmittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_resultConfirmedById_fkey" FOREIGN KEY ("resultConfirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_resultSubmittedByClubId_fkey" FOREIGN KEY ("resultSubmittedByClubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_resultReviewedByClubId_fkey" FOREIGN KEY ("resultReviewedByClubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSide" ADD CONSTRAINT "MatchSide_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSide" ADD CONSTRAINT "MatchSide_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_matchSideId_fkey" FOREIGN KEY ("matchSideId") REFERENCES "MatchSide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_clubGuestId_fkey" FOREIGN KEY ("clubGuestId") REFERENCES "ClubGuest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubStats" ADD CONSTRAINT "ClubStats_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchVideo" ADD CONSTRAINT "MatchVideo_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchVideo" ADD CONSTRAINT "MatchVideo_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchGoal" ADD CONSTRAINT "MatchGoal_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchGoal" ADD CONSTRAINT "MatchGoal_matchSideId_fkey" FOREIGN KEY ("matchSideId") REFERENCES "MatchSide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchGoal" ADD CONSTRAINT "MatchGoal_matchPlayerId_fkey" FOREIGN KEY ("matchPlayerId") REFERENCES "MatchPlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchComment" ADD CONSTRAINT "MatchComment_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchComment" ADD CONSTRAINT "MatchComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchComment" ADD CONSTRAINT "MatchComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MatchComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineupPlan" ADD CONSTRAINT "LineupPlan_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineupPlan" ADD CONSTRAINT "LineupPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineupSlot" ADD CONSTRAINT "LineupSlot_lineupPlanId_fkey" FOREIGN KEY ("lineupPlanId") REFERENCES "LineupPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineupSlot" ADD CONSTRAINT "LineupSlot_assignedClubMemberId_fkey" FOREIGN KEY ("assignedClubMemberId") REFERENCES "ClubMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tactic" ADD CONSTRAINT "Tactic_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tactic" ADD CONSTRAINT "Tactic_lineupPlanId_fkey" FOREIGN KEY ("lineupPlanId") REFERENCES "LineupPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tactic" ADD CONSTRAINT "Tactic_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TacticScene" ADD CONSTRAINT "TacticScene_tacticId_fkey" FOREIGN KEY ("tacticId") REFERENCES "Tactic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TacticPlayerAction" ADD CONSTRAINT "TacticPlayerAction_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "TacticScene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TacticBallAction" ADD CONSTRAINT "TacticBallAction_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "TacticScene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TacticAnnotation" ADD CONSTRAINT "TacticAnnotation_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "TacticScene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchTactic" ADD CONSTRAINT "MatchTactic_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchTactic" ADD CONSTRAINT "MatchTactic_tacticId_fkey" FOREIGN KEY ("tacticId") REFERENCES "Tactic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchTactic" ADD CONSTRAINT "MatchTactic_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchTactic" ADD CONSTRAINT "MatchTactic_attachedById_fkey" FOREIGN KEY ("attachedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStats" ADD CONSTRAINT "PlayerStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
