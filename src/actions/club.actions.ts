"use server";

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
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const formData = input instanceof FormData ? input : null;
  const logoFile = formData ? getImageFile(formData, "logoFile") : null;
  const coverFile = formData ? getImageFile(formData, "coverFile") : null;
  const imageValidation = validateClubImages(logoFile, coverFile);

  if (imageValidation) {
    return imageValidation;
  }

  const result = createClubSchema.safeParse(normalizeClubInput(input));

  if (!result.success) {
    return validationResponse("Club details are invalid.", result.error.flatten().fieldErrors);
  }

  if (await userHasOwnedClub(user.id)) {
    return {
      ok: false,
      message: "You can create only one club for now."
    };
  }

  const slug = await createUniqueClubSlug(result.data.name, result.data.slug);
  const uploadResult = await uploadClubImages({
    userId: user.id,
    slug,
    logoFile,
    coverFile
  });

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
    message: "Club created.",
    data: {
      clubId: club.id,
      slug: club.slug
    }
  };
}

export async function updateClubAction(clubId: string, input: unknown): Promise<ApiResponse<{ slug: string }>> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const formData = input instanceof FormData ? input : null;
  const logoFile = formData ? getImageFile(formData, "logoFile") : null;
  const coverFile = formData ? getImageFile(formData, "coverFile") : null;
  const imageValidation = validateClubImages(logoFile, coverFile);

  if (imageValidation) {
    return imageValidation;
  }

  const result = updateClubSchema.safeParse(normalizeClubInput(input));

  if (!result.success) {
    return validationResponse("Club details are invalid.", result.error.flatten().fieldErrors);
  }

  if (!(await canManageClubSettings(user.id, clubId))) {
    return forbiddenResponse();
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
    return notFoundResponse();
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
  });

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
    message: "Club updated.",
    data: { slug }
  };
}

export async function deactivateClubAction(clubId: string): Promise<ApiResponse> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  if (!(await isClubOwner(user.id, clubId))) {
    return forbiddenResponse("Only the owner can deactivate a club.");
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
    message: "Club deactivated."
  };
}

export async function transferClubOwnershipAction(input: unknown): Promise<ApiResponse> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const result = transferClubOwnershipSchema.safeParse(toInputObject(input));

  if (!result.success) {
    return validationResponse("Ownership transfer details are invalid.", result.error.flatten().fieldErrors);
  }

  const { clubId, newOwnerMemberId, oldOwnerNewRole } = result.data;

  if (!(await isClubOwner(user.id, clubId))) {
    return forbiddenResponse("Only the owner can transfer ownership.");
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
      message: "Owner transfer could not be completed."
    };
  }

  if (newOwnerMember.userId === user.id) {
    return {
      ok: false,
      message: "Choose another active member as the new owner."
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
    message: "Ownership transferred."
  };
}

export async function updateClubSettingsAction(clubId: string, input: unknown): Promise<ApiResponse> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const result = updateClubSettingsSchema.safeParse(toInputObject(input));

  if (!result.success) {
    return validationResponse("Club settings are invalid.", result.error.flatten().fieldErrors);
  }

  if (!(await canManageClubSettings(user.id, clubId))) {
    return forbiddenResponse("Only the owner can update club settings.");
  }

  await ensureClubActive(clubId);

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { slug: true }
  });

  if (!club) {
    return {
      ok: false,
      message: "Club was not found."
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
    message: "Club settings updated."
  };
}

export async function joinOpenClubAction(clubId: string): Promise<ApiResponse> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const club = await getActiveClubForMembership(clubId);

  if (!club.ok) {
    return club;
  }

  if (club.data.visibility !== "OPEN") {
    return {
      ok: false,
      message: "This club is not open for direct joining."
    };
  }

  const existingMembership = await getReusableClubMembership(clubId, user.id);

  if (existingMembership) {
    return {
      ok: false,
      message: getExistingMembershipMessage(existingMembership.status)
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
    message: "You joined the club."
  };
}

export async function requestJoinClubAction(clubId: string): Promise<ApiResponse> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const club = await getActiveClubForMembership(clubId);

  if (!club.ok) {
    return club;
  }

  if (club.data.visibility !== "REQUEST_ONLY") {
    return {
      ok: false,
      message: "This club does not accept join requests."
    };
  }

  const existingMembership = await getReusableClubMembership(clubId, user.id);

  if (existingMembership) {
    return {
      ok: false,
      message: getExistingMembershipMessage(existingMembership.status)
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
    message: "Join request sent."
  };
}

export async function approveJoinRequestAction(memberId: string): Promise<ApiResponse> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const member = await getMemberForDecision(memberId);

  if (!member) {
    return notFoundResponse("Join request was not found.");
  }

  if (!(await canApproveJoinRequests(user.id, member.clubId))) {
    return forbiddenResponse("You cannot approve join requests for this club.");
  }

  await ensureClubActive(member.clubId);

  if (member.status !== "REQUESTED") {
    return {
      ok: false,
      message: "This member is not waiting for approval."
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
    message: "Join request approved."
  };
}

export async function rejectJoinRequestAction(memberId: string): Promise<ApiResponse> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const member = await getMemberForDecision(memberId);

  if (!member) {
    return notFoundResponse("Join request was not found.");
  }

  if (!(await canApproveJoinRequests(user.id, member.clubId))) {
    return forbiddenResponse("You cannot reject join requests for this club.");
  }

  await ensureClubActive(member.clubId);

  if (member.status !== "REQUESTED") {
    return {
      ok: false,
      message: "This member is not waiting for approval."
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
    message: "Join request rejected."
  };
}

export async function inviteUserToClubAction(input: unknown): Promise<ApiResponse> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const result = inviteUserToClubSchema.safeParse(toInputObject(input));

  if (!result.success) {
    return validationResponse("Club invite details are invalid.", result.error.flatten().fieldErrors);
  }

  const { clubId, userId, role } = result.data;

  if (!(await canInvitePlayers(user.id, clubId))) {
    return forbiddenResponse("You cannot invite players to this club.");
  }

  if (role === "TD" && !(await isClubOwner(user.id, clubId))) {
    return forbiddenResponse("Only the club owner can invite a Technical Director.");
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
      message: "Club or user was not found."
    };
  }

  if (existingMembership) {
    return {
      ok: false,
      message: getExistingMembershipMessage(existingMembership.status)
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
    message: "Club invite sent."
  };
}

export async function acceptClubInviteAction(memberId: string): Promise<ApiResponse> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const member = await getMemberForDecision(memberId);

  if (!member || member.userId !== user.id) {
    return notFoundResponse("Invite was not found.");
  }

  await ensureClubActive(member.clubId);

  if (member.status !== "INVITED") {
    return {
      ok: false,
      message: "This invite is no longer active."
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
    message: "Club invite accepted."
  };
}

export async function leaveClubAction(clubId: string): Promise<ApiResponse> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
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
    return notFoundResponse("Membership was not found.");
  }

  if (member.role === "OWNER") {
    return {
      ok: false,
      message: "Transfer ownership before leaving this club."
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
    message: "You left the club."
  };
}

export async function removeClubMemberAction(memberId: string): Promise<ApiResponse> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const member = await getMemberForDecision(memberId);

  if (!member) {
    return notFoundResponse("Membership was not found.");
  }

  if (!(await isClubOwner(user.id, member.clubId))) {
    return forbiddenResponse("Only the owner can remove members.");
  }

  await ensureClubActive(member.clubId);

  if (member.role === "OWNER") {
    return {
      ok: false,
      message: "Transfer ownership before removing the current owner."
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
    message: "Club member removed."
  };
}

export async function changeClubMemberRoleAction(input: unknown): Promise<ApiResponse> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const result = changeClubMemberRoleSchema.safeParse(toInputObject(input));

  if (!result.success) {
    return validationResponse("Member role details are invalid.", result.error.flatten().fieldErrors);
  }

  const member = await getMemberForDecision(result.data.memberId);

  if (!member) {
    return notFoundResponse("Membership was not found.");
  }

  if (!(await isClubOwner(user.id, member.clubId))) {
    return forbiddenResponse("Only the owner can change member roles.");
  }

  await ensureClubActive(member.clubId);

  if (member.role === "OWNER") {
    return {
      ok: false,
      message: "Use owner transfer to change the club owner."
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
    message: "Member role updated."
  };
}

export async function createClubGuestAction(input: unknown): Promise<ApiResponse> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const result = createClubGuestSchema.safeParse(toInputObject(input));

  if (!result.success) {
    return validationResponse("Guest details are invalid.", result.error.flatten().fieldErrors);
  }

  const { clubId, ...data } = result.data;

  if (!(await canManageGuestList(user.id, clubId))) {
    return forbiddenResponse("You cannot manage the guest list for this club.");
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
    message: "Guest added.",
    data: toClubGuestDto(guest)
  };
}

export async function updateClubGuestAction(input: unknown): Promise<ApiResponse> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const result = updateClubGuestSchema.safeParse(toInputObject(input));

  if (!result.success) {
    return validationResponse("Guest details are invalid.", result.error.flatten().fieldErrors);
  }

  const guest = await prisma.clubGuest.findUnique({
    where: { id: result.data.guestId },
    select: { clubId: true }
  });

  if (!guest) {
    return notFoundResponse("Guest was not found.");
  }

  if (!(await canManageGuestList(user.id, guest.clubId))) {
    return forbiddenResponse("You cannot manage the guest list for this club.");
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
    message: "Guest updated."
  };
}

export async function deactivateClubGuestAction(guestId: string): Promise<ApiResponse> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const guest = await prisma.clubGuest.findUnique({
    where: { id: guestId },
    select: { clubId: true }
  });

  if (!guest) {
    return notFoundResponse("Guest was not found.");
  }

  if (!(await canManageGuestList(user.id, guest.clubId))) {
    return forbiddenResponse("You cannot manage the guest list for this club.");
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
    message: "Guest deactivated."
  };
}

export async function createClubMetricDefinitionAction(input: unknown): Promise<ApiResponse> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const result = createClubMetricSchema.safeParse(toInputObject(input));

  if (!result.success) {
    return validationResponse("Metric details are invalid.", result.error.flatten().fieldErrors);
  }

  const { clubId, order, ...data } = result.data;

  if (!(await canManageClubMetrics(user.id, clubId))) {
    return forbiddenResponse("You cannot manage club metrics.");
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
      message: "A club can have up to 6 active metrics."
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
    message: "Metric created.",
    data: toClubMetricDefinitionDto(metric)
  };
}

export async function updateClubMetricDefinitionAction(input: unknown): Promise<ApiResponse> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const result = updateClubMetricSchema.safeParse(toInputObject(input));

  if (!result.success) {
    return validationResponse("Metric details are invalid.", result.error.flatten().fieldErrors);
  }

  const metric = await prisma.clubMetricDefinition.findUnique({
    where: { id: result.data.metricId },
    select: { clubId: true }
  });

  if (!metric) {
    return notFoundResponse("Metric was not found.");
  }

  if (!(await canManageClubMetrics(user.id, metric.clubId))) {
    return forbiddenResponse("You cannot manage club metrics.");
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
    message: "Metric updated."
  };
}

export async function deactivateClubMetricDefinitionAction(metricId: string): Promise<ApiResponse> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const metric = await prisma.clubMetricDefinition.findUnique({
    where: { id: metricId },
    select: { clubId: true }
  });

  if (!metric) {
    return notFoundResponse("Metric was not found.");
  }

  if (!(await canManageClubMetrics(user.id, metric.clubId))) {
    return forbiddenResponse("You cannot manage club metrics.");
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
    message: "Metric deactivated."
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

function validateClubImages(logoFile: File | null, coverFile: File | null): ApiResponse<never> | null {
  if (logoFile && !CLUB_IMAGE_TYPES.has(logoFile.type)) {
    return {
      ok: false,
      message: "Club details are invalid.",
      issues: { logoFile: ["Choose a JPG, PNG, WebP, or GIF image."] }
    };
  }

  if (coverFile && !CLUB_IMAGE_TYPES.has(coverFile.type)) {
    return {
      ok: false,
      message: "Club details are invalid.",
      issues: { coverFile: ["Choose a JPG, PNG, WebP, or GIF image."] }
    };
  }

  if (logoFile && logoFile.size > MAX_CLUB_IMAGE_SIZE) {
    return {
      ok: false,
      message: "Club details are invalid.",
      issues: { logoFile: ["Logo must be 5 MB or smaller."] }
    };
  }

  if (coverFile && coverFile.size > MAX_CLUB_IMAGE_SIZE) {
    return {
      ok: false,
      message: "Club details are invalid.",
      issues: { coverFile: ["Cover image must be 5 MB or smaller."] }
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
}): Promise<ClubImageUploadResult> {
  if ((logoFile || coverFile) && !isCloudinaryConfigured()) {
    return {
      ok: false,
      message: "Image upload is not configured yet. Add Cloudinary settings and try again.",
      issues: {
        logoFile: logoFile ? ["Image upload is not configured."] : undefined,
        coverFile: coverFile ? ["Image upload is not configured."] : undefined
      }
    };
  }

  const logo = logoFile ? await uploadClubImageFileToCloudinary(logoFile, `${userId}/${slug}/logo`) : null;
  const cover = coverFile ? await uploadClubImageFileToCloudinary(coverFile, `${userId}/${slug}/cover`) : null;

  if (logoFile && !logo) {
    return {
      ok: false,
      message: "We could not upload that club logo. Try another image.",
      issues: { logoFile: ["Upload failed."] }
    };
  }

  if (coverFile && !cover) {
    return {
      ok: false,
      message: "We could not upload that cover image. Try another image.",
      issues: { coverFile: ["Upload failed."] }
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

async function getActiveClubForMembership(clubId: string): Promise<ActiveClubResult> {
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
      message: "Club was not found."
    };
  }

  if (!club.isActive) {
    return {
      ok: false,
      message: "This club is deactivated."
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

function getExistingMembershipMessage(status: string) {
  if (status === "ACTIVE") {
    return "This user is already an active club member.";
  }

  if (status === "INVITED") {
    return "There is already a pending invite for this club.";
  }

  return "There is already a pending join request for this club.";
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

function unauthenticatedResponse(): ApiResponse<never> {
  return {
    ok: false,
    message: "You need to sign in first."
  };
}

function forbiddenResponse(message = "You do not have permission to do that."): ApiResponse<never> {
  return {
    ok: false,
    message
  };
}

function notFoundResponse(message = "Club was not found."): ApiResponse<never> {
  return {
    ok: false,
    message
  };
}
