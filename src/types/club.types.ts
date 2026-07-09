import type {
  ClubMemberStatus,
  ClubPermissionPolicy,
  ClubRole,
  ClubVisibility,
  GuestInvitePolicy
} from "@prisma/client";
import type {
  CreateClubInput,
  UpdateClubInput,
  UpdateClubSettingsInput
} from "@/lib/validations/club";

export type {
  ClubMemberStatus,
  ClubPermissionPolicy,
  ClubRole,
  ClubVisibility,
  CreateClubInput,
  GuestInvitePolicy,
  UpdateClubInput,
  UpdateClubSettingsInput
};

export type ClubUserDto = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
};

export type ClubSettingsDto = {
  id: string;
  clubId: string;
  joinApprovalPolicy: ClubPermissionPolicy;
  invitePermissionPolicy: ClubPermissionPolicy;
  matchCreatePermissionPolicy: ClubPermissionPolicy;
  guestInvitePolicy: GuestInvitePolicy;
  createdAt: string;
  updatedAt: string;
};

export type ClubSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  country: string | null;
  city: string | null;
  ownerId: string;
  owner: ClubUserDto;
  visibility: ClubVisibility;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  currentUserRole?: ClubRole | null;
  currentUserMemberStatus?: ClubMemberStatus | null;
};

export type ClubDetails = ClubSummary & {
  deactivatedAt: string | null;
  deactivatedById: string | null;
  settings: ClubSettingsDto;
};

export type ClubMemberDto = {
  id: string;
  clubId: string;
  userId: string;
  user: ClubUserDto;
  role: ClubRole;
  status: ClubMemberStatus;
  invitedById: string | null;
  invitedBy: ClubUserDto | null;
  joinedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClubGuestDto = {
  id: string;
  clubId: string;
  fullName: string;
  position: string | null;
  phone: string | null;
  note: string | null;
  createdById: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ClubMetricDefinitionDto = {
  id: string;
  clubId: string;
  name: string;
  description: string | null;
  order: number;
  isActive: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
};
