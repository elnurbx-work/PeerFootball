"use server";

import { localizedFieldErrors } from "@/i18n/zod";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  changeClubMemberRoleSchema,
  createClubGuestSchema,
  createClubMetricSchema,
  createClubSchema,
  inviteUserToClubSchema,
  transferClubOwnershipSchema,
  updateClubGuestSchema,
  updateClubMetricSchema,
  updateClubSchema,
  updateClubSettingsSchema
} from "@/lib/validations/club";
import {
  canApproveJoinRequests,
  canInvitePlayers,
  canManageClubMetrics,
  canManageClubSettings,
  canManageGuestList,
  ensureClubActive,
  isClubOwner
} from "@/server/services/club-permissions.service";
import {
  createUniqueClubSlug,
  getReusableClubMembership,
  slugify,
  toClubGuestDto,
  toClubMetricDefinitionDto,
  userHasOwnedClub
} from "@/server/services/club.service";
import {
  deleteCloudinaryAsset,
  isCloudinaryConfigured,
  uploadClubImageFileToCloudinary
} from "@/server/services/cloudinary.service";
import type { ApiResponse } from "@/types/api.types";
import { addUserToClubChat, removeUserFromClubChat } from "@/server/services/club-chat.service";
import { getServerTranslator } from "@/i18n/server";
import type { Translate } from "@/i18n/dictionary";

type ActionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
type ClubImageUploadData = {
  logo: { url: string; publicId: string } | null;
  cover: { url: string; publicId: string } | null;
};
type ClubImageUploadResult =
  | { ok: true; data: ClubImageUploadData }
  | { ok: false; message: string; issues?: Record<string, string[] | undefined> };

const MAX_CLUB_IMAGE_SIZE = 5 * 1024 * 1024;
const CLUB_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function createClubAction(input: unknown): Promise<ApiResponse<{ clubId: string; slug: string }>> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse(t);
  }

  const formData = input instanceof FormData ? input : null;
  const logoFile = formData ? getImageFile(formData, "logoFile") : null;
  const coverFile = formData ? getImageFile(formData, "coverFile") : null;
  const imageValidation = validateClubImages(logoFile, coverFile, t);

  if (imageValidation) {
    return imageValidation;
  }

  const result = createClubSchema.safeParse(normalizeClubInput(input));

  if (!result.success) {
    return validationResponse(t("responses.club.invalid"), localizedFieldErrors(result.error, t));
  }

  if (await userHasOwnedClub(user.id)) {
    return {
      ok: false,
      message: t("responses.club.createLimit")
    };
  }

  const slug = await createUniqueClubSlug(result.data.name, result.data.slug);
  const uploadResult = await uploadClubImages({
    userId: user.id,
    slug,
    logoFile,
    coverFile
  }, t);

  if (!uploadResult.ok) {
    return uploadResult;
  }

  const club = await prisma.$transaction(async (tx) => {
    const createdClub = await tx.club.create({
      data: {
        name: result.data.name,
        slug,
        description: result.data.description,
        logoUrl: uploadResult.data.logo?.url ?? result.data.logoUrl,
        logoPublicId: uploadResult.data.logo?.publicId,
        coverUrl: uploadResult.data.cover?.url ?? result.data.coverUrl,
        coverPublicId: uploadResult.data.cover?.publicId,
        country: result.data.country,
        city: result.data.city,
        ownerId: user.id,
        visibility: "REQUEST_ONLY",
        settings: {
          create: {
            joinApprovalPolicy: "OWNER_TD",
            invitePermissionPolicy: "OWNER_TD",
            matchCreatePermissionPolicy: "OWNER_TD",
            guestInvitePolicy: "ONLY_OWNER_TD_YTD"
          }
        },
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
            status: "ACTIVE",
            joinedAt: new Date()
          }
        }
      },
      select: {
        id: true,
        slug: true
      }
    });

    await addUserToClubChat(tx, createdClub.id, user.id);

    return createdClub;
  });

  revalidateClubSurfaces(club.slug);

  return {
    ok: true,
    message: t("responses.club.created"),
    data: {
      clubId: club.id,
      slug: club.slug
    }
  };
}

export async function updateClubAction(clubId: string, input: unknown): Promise<ApiResponse<{ slug: string }>> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse(t);
  }

  const formData = input instanceof FormData ? input : null;
  const logoFile = formData ? getImageFile(formData, "logoFile") : null;
  const coverFile = formData ? getImageFile(formData, "coverFile") : null;
  const imageValidation = validateClubImages(logoFile, coverFile, t);

  if (imageValidation) {
    return imageValidation;
  }

  const result = updateClubSchema.safeParse(normalizeClubInput(input));

  if (!result.success) {
    return validationResponse(t("responses.club.invalid"), localizedFieldErrors(result.error, t));
  }

  if (!(await canManageClubSettings(user.id, clubId))) {
    return forbiddenResponse(t);
  }

  await ensureClubActive(clubId);

  const existingClub = await prisma.club.findUnique({
    where: { id: clubId },
    select: {
      slug: true,
      logoPublicId: true,
      coverPublicId: true
    }
  });

  if (!existingClub) {
    return notFoundResponse(t);
  }

  let slug = existingClub.slug;

  if (result.data.slug && result.data.slug !== existingClub.slug) {
    slug = await createUniqueClubSlug(result.data.name, result.data.slug);
  }

  const uploadResult = await uploadClubImages({
    userId: user.id,
    slug,
    logoFile,
    coverFile
  }, t);

  if (!uploadResult.ok) {
    return uploadResult;
  }

  await prisma.club.update({
    where: { id: clubId },
    data: {
      name: result.data.name,
      slug,
      description: result.data.description,
      logoUrl: uploadResult.data.logo?.url ?? result.data.logoUrl,
      logoPublicId: uploadResult.data.logo?.publicId ?? existingClub.logoPublicId,
      coverUrl: uploadResult.data.cover?.url ?? result.data.coverUrl,
      coverPublicId: uploadResult.data.cover?.publicId ?? existingClub.coverPublicId,
      country: result.data.country,
      city: result.data.city,
      visibility: result.data.visibility
    },
    select: {
      id: true
    }
  });

  await deleteReplacedClubImages({
    oldLogoPublicId: existingClub.logoPublicId,
    oldCoverPublicId: existingClub.coverPublicId,
    newLogoPublicId: uploadResult.data.logo?.publicId,
    newCoverPublicId: uploadResult.data.cover?.publicId
  });

  revalidateClubSurfaces(slug);
  revalidateClubSurfaces(existingClub.slug);

  return {
    ok: true,
    message: t("responses.club.updated"),
    data: { slug }
  };
}

export async function deactivateClubAction(clubId: string): Promise<ApiResponse> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse(t);
  }

  if (!(await isClubOwner(user.id, clubId))) {
    return forbiddenResponse(t, t("responses.club.ownerDeactivateOnly"));
  }

  const club = await prisma.club.update({
    where: { id: clubId },
    data: {
      isActive: false,
      deactivatedAt: new Date(),
      deactivatedById: user.id
    },
    select: {
      slug: true
    }
  });

  revalidateClubSurfaces(club.slug);

  return {
    ok: true,
    message: t("responses.club.deactivated")
  };
}

export async function transferClubOwnershipAction(input: unknown): Promise<ApiResponse> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse(t);
  }

  const result = transferClubOwnershipSchema.safeParse(toInputObject(input));

  if (!result.success) {
    return validationResponse(t("responses.club.transferInvalid"), localizedFieldErrors(result.error, t));
  }

  const { clubId, newOwnerMemberId, oldOwnerNewRole } = result.data;

  if (!(await isClubOwner(user.id, clubId))) {
    return forbiddenResponse(t, t("responses.club.ownerTransferOnly"));
  }

  await ensureClubActive(clubId);

  const [currentOwnerMember, newOwnerMember, club] = await Promise.all([
    prisma.clubMember.findFirst({
      where: {
        clubId,
        userId: user.id,
        role: "OWNER",
        status: "ACTIVE"
      },
      select: {
        id: true
      }
    }),
    prisma.clubMember.findFirst({
      where: {
        id: newOwnerMemberId,
        clubId,
        status: "ACTIVE"
      },
      select: {
        id: true,
        userId: true
      }
    }),
    prisma.club.findUnique({
      where: { id: clubId },
      select: { slug: true }
    })
  ]);

  if (!currentOwnerMember || !newOwnerMember || !club) {
    return {
      ok: false,
      message: t("responses.club.transferFailed")
    };
  }

  if (newOwnerMember.userId === user.id) {
    return {
      ok: false,
      message: t("responses.club.chooseNewOwner")
    };
  }

  await prisma.$transaction([
    prisma.clubMember.update({
      where: { id: currentOwnerMember.id },
      data: { role: oldOwnerNewRole }
    }),
    prisma.clubMember.update({
      where: { id: newOwnerMember.id },
      data: { role: "OWNER" }
    }),
    prisma.club.update({
      where: { id: clubId },
      data: { ownerId: newOwnerMember.userId }
    })
  ]);

  revalidateClubSurfaces(club.slug);

  return {
    ok: true,
    message: t("responses.club.transferred")
  };
}

export async function updateClubSettingsAction(clubId: string, input: unknown): Promise<ApiResponse> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse(t);
  }

  const result = updateClubSettingsSchema.safeParse(toInputObject(input));

  if (!result.success) {
    return validationResponse(t("responses.club.settingsInvalid"), localizedFieldErrors(result.error, t));
  }

  if (!(await canManageClubSettings(user.id, clubId))) {
    return forbiddenResponse(t, t("responses.club.ownerSettingsOnly"));
  }

  await ensureClubActive(clubId);

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { slug: true }
  });

  if (!club) {
    return {
      ok: false,
      message: t("responses.club.notFound")
    };
  }

  await prisma.clubSettings.upsert({
    where: { clubId },
    update: result.data,
    create: {
      clubId,
      ...result.data
    },
    select: { id: true }
  });

  revalidateClubSurfaces(club.slug);

  return {
    ok: true,
    message: t("responses.club.settingsUpdated")
  };
}

export async function joinOpenClubAction(clubId: string): Promise<ApiResponse> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse(t);
  }

  const club = await getActiveClubForMembership(clubId, t);

  if (!club.ok) {
    return club;
  }

  if (club.data.visibility !== "OPEN") {
    return {
      ok: false,
      message: t("responses.club.notOpen")
    };
  }

  const existingMembership = await getReusableClubMembership(clubId, user.id);

  if (existingMembership) {
    return {
      ok: false,
      message: getExistingMembershipMessage(existingMembership.status, t)
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.clubMember.upsert({
      where: { clubId_userId: { clubId, userId: user.id } },
      update: {
        role: "PLAYER",
        status: "ACTIVE",
        joinedAt: new Date(),
        invitedById: null
      },
      create: {
        clubId,
        userId: user.id,
        role: "PLAYER",
        status: "ACTIVE",
        joinedAt: new Date()
      },
      select: { id: true }
    });
    await addUserToClubChat(tx, clubId, user.id);
  });

  revalidateClubSurfaces(club.data.slug);

  return {
    ok: true,
    message: t("responses.club.joined")
  };
}

export async function requestJoinClubAction(clubId: string): Promise<ApiResponse> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse(t);
  }

  const club = await getActiveClubForMembership(clubId, t);

  if (!club.ok) {
    return club;
  }

  if (club.data.visibility !== "REQUEST_ONLY") {
    return {
      ok: false,
      message: t("responses.club.requestsDisabled")
    };
  }

  const existingMembership = await getReusableClubMembership(clubId, user.id);

  if (existingMembership) {
    return {
      ok: false,
      message: getExistingMembershipMessage(existingMembership.status, t)
    };
  }

  await prisma.clubMember.upsert({
    where: { clubId_userId: { clubId, userId: user.id } },
    update: {
      role: "PLAYER",
      status: "REQUESTED",
      joinedAt: null,
      invitedById: null
    },
    create: {
      clubId,
      userId: user.id,
      role: "PLAYER",
      status: "REQUESTED"
    },
    select: { id: true }
  });

  revalidateClubSurfaces(club.data.slug);

  return {
    ok: true,
    message: t("responses.club.requestSent")
  };
}

export async function approveJoinRequestAction(memberId: string): Promise<ApiResponse> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse(t);
  }

  const member = await getMemberForDecision(memberId);

  if (!member) {
    return notFoundResponse(t, t("responses.club.requestNotFound"));
  }

  if (!(await canApproveJoinRequests(user.id, member.clubId))) {
    return forbiddenResponse(t, t("responses.club.cannotApprove"));
  }

  await ensureClubActive(member.clubId);

  if (member.status !== "REQUESTED") {
    return {
      ok: false,
      message: t("responses.club.notAwaitingApproval")
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.clubMember.update({
      where: { id: member.id },
      data: {
        status: "ACTIVE",
        joinedAt: new Date()
      },
      select: { id: true }
    });
    await addUserToClubChat(tx, member.clubId, member.userId);
  });

  revalidateClubSurfaces(member.club.slug);

  return {
    ok: true,
    message: t("responses.club.requestApproved")
  };
}

export async function rejectJoinRequestAction(memberId: string): Promise<ApiResponse> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse(t);
  }

  const member = await getMemberForDecision(memberId);

  if (!member) {
    return notFoundResponse(t, t("responses.club.requestNotFound"));
  }

  if (!(await canApproveJoinRequests(user.id, member.clubId))) {
    return forbiddenResponse(t, t("responses.club.cannotReject"));
  }

  await ensureClubActive(member.clubId);

  if (member.status !== "REQUESTED") {
    return {
      ok: false,
      message: t("responses.club.notAwaitingApproval")
    };
  }

  await prisma.clubMember.update({
    where: { id: member.id },
    data: { status: "REMOVED" },
    select: { id: true }
  });

  revalidateClubSurfaces(member.club.slug);

  return {
    ok: true,
    message: t("responses.club.requestRejected")
  };
}

export async function inviteUserToClubAction(input: unknown): Promise<ApiResponse> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse(t);
  }

  const result = inviteUserToClubSchema.safeParse(toInputObject(input));

  if (!result.success) {
    return validationResponse(t("responses.club.inviteInvalid"), localizedFieldErrors(result.error, t));
  }

  const { clubId, userId, role } = result.data;

  if (!(await canInvitePlayers(user.id, clubId))) {
    return forbiddenResponse(t, t("responses.club.cannotInvite"));
  }

  if (role === "TD" && !(await isClubOwner(user.id, clubId))) {
    return forbiddenResponse(t, t("responses.club.ownerInviteTdOnly"));
  }

  await ensureClubActive(clubId);

  const [club, invitedUser, existingMembership] = await Promise.all([
    prisma.club.findUnique({
      where: { id: clubId },
      select: { slug: true }
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    }),
    getReusableClubMembership(clubId, userId)
  ]);

  if (!club || !invitedUser) {
    return {
      ok: false,
      message: t("responses.club.clubOrUserNotFound")
    };
  }

  if (existingMembership) {
    return {
      ok: false,
      message: getExistingMembershipMessage(existingMembership.status, t)
    };
  }

  await prisma.clubMember.upsert({
    where: { clubId_userId: { clubId, userId } },
    update: {
      role,
      status: "INVITED",
      joinedAt: null,
      invitedById: user.id
    },
    create: {
      clubId,
      userId,
      role,
      status: "INVITED",
      invitedById: user.id
    },
    select: { id: true }
  });

  revalidateClubSurfaces(club.slug);

  return {
    ok: true,
    message: t("responses.club.inviteSent")
  };
}

export async function acceptClubInviteAction(memberId: string): Promise<ApiResponse> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse(t);
  }

  const member = await getMemberForDecision(memberId);

  if (!member || member.userId !== user.id) {
    return notFoundResponse(t, t("responses.club.inviteNotFound"));
  }

  await ensureClubActive(member.clubId);

  if (member.status !== "INVITED") {
    return {
      ok: false,
      message: t("responses.club.inviteInactive")
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.clubMember.update({
      where: { id: member.id },
      data: {
        status: "ACTIVE",
        joinedAt: new Date()
      },
      select: { id: true }
    });
    await addUserToClubChat(tx, member.clubId, member.userId);
  });

  revalidateClubSurfaces(member.club.slug);

  return {
    ok: true,
    message: t("responses.club.inviteAccepted")
  };
}

export async function leaveClubAction(clubId: string): Promise<ApiResponse> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse(t);
  }

  await ensureClubActive(clubId);

  const member = await prisma.clubMember.findFirst({
    where: {
      clubId,
      userId: user.id,
      status: "ACTIVE"
    },
    include: {
      club: {
        select: { slug: true }
      }
    }
  });

  if (!member) {
    return notFoundResponse(t, t("responses.club.membershipNotFound"));
  }

  if (member.role === "OWNER") {
    return {
      ok: false,
      message: t("responses.club.transferBeforeLeaving")
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.clubMember.update({
      where: { id: member.id },
      data: { status: "LEFT" },
      select: { id: true }
    });
    await removeUserFromClubChat(tx, clubId, user.id);
  });

  revalidateClubSurfaces(member.club.slug);

  return {
    ok: true,
    message: t("responses.club.left")
  };
}

export async function removeClubMemberAction(memberId: string): Promise<ApiResponse> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse(t);
  }

  const member = await getMemberForDecision(memberId);

  if (!member) {
    return notFoundResponse(t, t("responses.club.membershipNotFound"));
  }

  if (!(await isClubOwner(user.id, member.clubId))) {
    return forbiddenResponse(t, t("responses.club.ownerRemoveOnly"));
  }

  await ensureClubActive(member.clubId);

  if (member.role === "OWNER") {
    return {
      ok: false,
      message: t("responses.club.transferBeforeRemoveOwner")
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.clubMember.update({
      where: { id: member.id },
      data: { status: "REMOVED" },
      select: { id: true }
    });
    await removeUserFromClubChat(tx, member.clubId, member.userId);
  });

  revalidateClubSurfaces(member.club.slug);

  return {
    ok: true,
    message: t("responses.club.memberRemoved")
  };
}

export async function changeClubMemberRoleAction(input: unknown): Promise<ApiResponse> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse(t);
  }

  const result = changeClubMemberRoleSchema.safeParse(toInputObject(input));

  if (!result.success) {
    return validationResponse(t("responses.club.roleInvalid"), localizedFieldErrors(result.error, t));
  }

  const member = await getMemberForDecision(result.data.memberId);

  if (!member) {
    return notFoundResponse(t, t("responses.club.membershipNotFound"));
  }

  if (!(await isClubOwner(user.id, member.clubId))) {
    return forbiddenResponse(t, t("responses.club.ownerRoleOnly"));
  }

  await ensureClubActive(member.clubId);

  if (member.role === "OWNER") {
    return {
      ok: false,
      message: t("responses.club.useTransfer")
    };
  }

  await prisma.clubMember.update({
    where: { id: member.id },
    data: { role: result.data.role },
    select: { id: true }
  });

  revalidateClubSurfaces(member.club.slug);

  return {
    ok: true,
    message: t("responses.club.roleUpdated")
  };
}

export async function createClubGuestAction(input: unknown): Promise<ApiResponse> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse(t);
  }

  const result = createClubGuestSchema.safeParse(toInputObject(input));

  if (!result.success) {
    return validationResponse(t("responses.club.guestInvalid"), localizedFieldErrors(result.error, t));
  }

  const { clubId, ...data } = result.data;

  if (!(await canManageGuestList(user.id, clubId))) {
    return forbiddenResponse(t, t("responses.club.guestForbidden"));
  }

  await ensureClubActive(clubId);

  const guest = await prisma.clubGuest.create({
    data: {
      clubId,
      createdById: user.id,
      ...data
    }
  });

  await revalidateClubIdSurfaces(clubId);

  return {
    ok: true,
    message: t("responses.club.guestAdded"),
    data: toClubGuestDto(guest)
  };
}

export async function updateClubGuestAction(input: unknown): Promise<ApiResponse> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse(t);
  }

  const result = updateClubGuestSchema.safeParse(toInputObject(input));

  if (!result.success) {
    return validationResponse(t("responses.club.guestInvalid"), localizedFieldErrors(result.error, t));
  }

  const guest = await prisma.clubGuest.findUnique({
    where: { id: result.data.guestId },
    select: { clubId: true }
  });

  if (!guest) {
    return notFoundResponse(t, t("responses.club.guestNotFound"));
  }

  if (!(await canManageGuestList(user.id, guest.clubId))) {
    return forbiddenResponse(t, t("responses.club.guestForbidden"));
  }

  await ensureClubActive(guest.clubId);

  await prisma.clubGuest.update({
    where: { id: result.data.guestId },
    data: {
      fullName: result.data.fullName,
      position: result.data.position,
      note: result.data.note
    },
    select: { id: true }
  });

  await revalidateClubIdSurfaces(guest.clubId);

  return {
    ok: true,
    message: t("responses.club.guestUpdated")
  };
}

export async function deactivateClubGuestAction(guestId: string): Promise<ApiResponse> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse(t);
  }

  const guest = await prisma.clubGuest.findUnique({
    where: { id: guestId },
    select: { clubId: true }
  });

  if (!guest) {
    return notFoundResponse(t, t("responses.club.guestNotFound"));
  }

  if (!(await canManageGuestList(user.id, guest.clubId))) {
    return forbiddenResponse(t, t("responses.club.guestForbidden"));
  }

  await ensureClubActive(guest.clubId);

  await prisma.clubGuest.update({
    where: { id: guestId },
    data: { isActive: false },
    select: { id: true }
  });

  await revalidateClubIdSurfaces(guest.clubId);

  return {
    ok: true,
    message: t("responses.club.guestDeactivated")
  };
}

export async function createClubMetricDefinitionAction(input: unknown): Promise<ApiResponse> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse(t);
  }

  const result = createClubMetricSchema.safeParse(toInputObject(input));

  if (!result.success) {
    return validationResponse(t("responses.club.metricInvalid"), localizedFieldErrors(result.error, t));
  }

  const { clubId, order, ...data } = result.data;

  if (!(await canManageClubMetrics(user.id, clubId))) {
    return forbiddenResponse(t, t("responses.club.metricForbidden"));
  }

  await ensureClubActive(clubId);

  const activeMetricCount = await prisma.clubMetricDefinition.count({
    where: {
      clubId,
      isActive: true
    }
  });

  if (activeMetricCount >= 6) {
    return {
      ok: false,
      message: t("responses.club.metricLimit")
    };
  }

  const metric = await prisma.clubMetricDefinition.create({
    data: {
      clubId,
      createdById: user.id,
      order: order ?? activeMetricCount + 1,
      ...data
    }
  });

  await revalidateClubIdSurfaces(clubId);

  return {
    ok: true,
    message: t("responses.club.metricCreated"),
    data: toClubMetricDefinitionDto(metric)
  };
}

export async function updateClubMetricDefinitionAction(input: unknown): Promise<ApiResponse> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse(t);
  }

  const result = updateClubMetricSchema.safeParse(toInputObject(input));

  if (!result.success) {
    return validationResponse(t("responses.club.metricInvalid"), localizedFieldErrors(result.error, t));
  }

  const metric = await prisma.clubMetricDefinition.findUnique({
    where: { id: result.data.metricId },
    select: { clubId: true }
  });

  if (!metric) {
    return notFoundResponse(t, t("responses.club.metricNotFound"));
  }

  if (!(await canManageClubMetrics(user.id, metric.clubId))) {
    return forbiddenResponse(t, t("responses.club.metricForbidden"));
  }

  await ensureClubActive(metric.clubId);

  await prisma.clubMetricDefinition.update({
    where: { id: result.data.metricId },
    data: {
      name: result.data.name,
      description: result.data.description,
      order: result.data.order
    },
    select: { id: true }
  });

  await revalidateClubIdSurfaces(metric.clubId);

  return {
    ok: true,
    message: t("responses.club.metricUpdated")
  };
}

export async function deactivateClubMetricDefinitionAction(metricId: string): Promise<ApiResponse> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse(t);
  }

  const metric = await prisma.clubMetricDefinition.findUnique({
    where: { id: metricId },
    select: { clubId: true }
  });

  if (!metric) {
    return notFoundResponse(t, t("responses.club.metricNotFound"));
  }

  if (!(await canManageClubMetrics(user.id, metric.clubId))) {
    return forbiddenResponse(t, t("responses.club.metricForbidden"));
  }

  await ensureClubActive(metric.clubId);

  await prisma.clubMetricDefinition.update({
    where: { id: metricId },
    data: { isActive: false },
    select: { id: true }
  });

  await revalidateClubIdSurfaces(metric.clubId);

  return {
    ok: true,
    message: t("responses.club.metricDeactivated")
  };
}

async function requireUser(): Promise<ActionUser | null> {
  return getCurrentUser();
}

function toInputObject(input: unknown) {
  if (input instanceof FormData) {
    return Object.fromEntries(input);
  }

  return input;
}

function normalizeClubInput(input: unknown) {
  const objectInput = toInputObject(input);

  if (!objectInput || typeof objectInput !== "object") {
    return objectInput;
  }

  const values = { ...(objectInput as Record<string, unknown>) };
  const rawSlug = typeof values.slug === "string" ? values.slug : "";

  if (rawSlug.trim()) {
    values.slug = slugify(rawSlug);
  }

  return values;
}

function getImageFile(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

function validateClubImages(logoFile: File | null, coverFile: File | null, t: Translate): ApiResponse<never> | null {
  if (logoFile && !CLUB_IMAGE_TYPES.has(logoFile.type)) {
    return {
      ok: false,
      message: t("responses.club.invalid"),
      issues: { logoFile: [t("responses.profile.imageType")] }
    };
  }

  if (coverFile && !CLUB_IMAGE_TYPES.has(coverFile.type)) {
    return {
      ok: false,
      message: t("responses.club.invalid"),
      issues: { coverFile: [t("responses.profile.imageType")] }
    };
  }

  if (logoFile && logoFile.size > MAX_CLUB_IMAGE_SIZE) {
    return {
      ok: false,
      message: t("responses.club.invalid"),
      issues: { logoFile: [t("responses.club.logoTooLarge")] }
    };
  }

  if (coverFile && coverFile.size > MAX_CLUB_IMAGE_SIZE) {
    return {
      ok: false,
      message: t("responses.club.invalid"),
      issues: { coverFile: [t("responses.club.coverTooLarge")] }
    };
  }

  return null;
}

async function uploadClubImages({
  coverFile,
  logoFile,
  slug,
  userId
}: {
  coverFile: File | null;
  logoFile: File | null;
  slug: string;
  userId: string;
}, t: Translate): Promise<ClubImageUploadResult> {
  if ((logoFile || coverFile) && !isCloudinaryConfigured()) {
    return {
      ok: false,
      message: t("responses.profile.uploadNotConfigured"),
      issues: {
        logoFile: logoFile ? [t("responses.profile.uploadUnavailable")] : undefined,
        coverFile: coverFile ? [t("responses.profile.uploadUnavailable")] : undefined
      }
    };
  }

  const logo = logoFile ? await uploadClubImageFileToCloudinary(logoFile, `${userId}/${slug}/logo`) : null;
  const cover = coverFile ? await uploadClubImageFileToCloudinary(coverFile, `${userId}/${slug}/cover`) : null;

  if (logoFile && !logo) {
    return {
      ok: false,
      message: t("responses.club.logoUploadFailed"),
      issues: { logoFile: [t("responses.profile.uploadFailed")] }
    };
  }

  if (coverFile && !cover) {
    return {
      ok: false,
      message: t("responses.club.coverUploadFailed"),
      issues: { coverFile: [t("responses.profile.uploadFailed")] }
    };
  }

  return {
    ok: true,
    data: { logo, cover }
  };
}

async function deleteReplacedClubImages({
  newCoverPublicId,
  newLogoPublicId,
  oldCoverPublicId,
  oldLogoPublicId
}: {
  oldLogoPublicId: string | null;
  oldCoverPublicId: string | null;
  newLogoPublicId?: string;
  newCoverPublicId?: string;
}) {
  await Promise.all([
    oldLogoPublicId && newLogoPublicId && oldLogoPublicId !== newLogoPublicId
      ? deleteCloudinaryAsset(oldLogoPublicId, "image")
      : Promise.resolve(null),
    oldCoverPublicId && newCoverPublicId && oldCoverPublicId !== newCoverPublicId
      ? deleteCloudinaryAsset(oldCoverPublicId, "image")
      : Promise.resolve(null)
  ]);
}

type ActiveClubResult =
  | { ok: true; data: { slug: string; visibility: "OPEN" | "REQUEST_ONLY" | "INVITE_ONLY" } }
  | { ok: false; message: string };

async function getActiveClubForMembership(clubId: string, t: Translate): Promise<ActiveClubResult> {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: {
      slug: true,
      visibility: true,
      isActive: true
    }
  });

  if (!club) {
    return {
      ok: false,
      message: t("responses.club.notFound")
    };
  }

  if (!club.isActive) {
    return {
      ok: false,
      message: t("responses.club.deactivatedState")
    };
  }

  return {
    ok: true,
    data: {
      slug: club.slug,
      visibility: club.visibility
    }
  };
}

async function getMemberForDecision(memberId: string) {
  return prisma.clubMember.findUnique({
    where: { id: memberId },
    include: {
      club: {
        select: {
          slug: true
        }
      }
    }
  });
}

function getExistingMembershipMessage(status: string, t: Translate) {
  if (status === "ACTIVE") {
    return t("responses.club.memberActive");
  }

  if (status === "INVITED") {
    return t("responses.club.invitePending");
  }

  return t("responses.club.requestPending");
}

async function revalidateClubIdSurfaces(clubId: string) {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { slug: true }
  });

  if (club) {
    revalidateClubSurfaces(club.slug);
  }
}

function revalidateClubSurfaces(slug?: string) {
  revalidatePath("/clubs");

  if (!slug) {
    return;
  }

  revalidatePath(`/clubs/${slug}`);
  revalidatePath(`/clubs/${slug}/settings`);
  revalidatePath(`/clubs/${slug}/members`);
  revalidatePath(`/clubs/${slug}/guests`);
  revalidatePath(`/clubs/${slug}/metrics`);
}

function validationResponse(message: string, issues: Record<string, string[] | undefined>): ApiResponse<never> {
  return {
    ok: false,
    message,
    issues
  };
}

function unauthenticatedResponse(t: Translate): ApiResponse<never> {
  return {
    ok: false,
    message: t("responses.signInRequired")
  };
}

function forbiddenResponse(t: Translate, message = t("responses.forbidden")): ApiResponse<never> {
  return {
    ok: false,
    message
  };
}

function notFoundResponse(t: Translate, message = t("responses.club.notFound")): ApiResponse<never> {
  return {
    ok: false,
    message
  };
}
