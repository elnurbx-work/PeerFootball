"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireAdmin } from "@/server/services/admin-auth.service";
import type { ApiResponse } from "@/types/api.types";

export type FeedbackState = ApiResponse;

function cleanNote(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";
}

export async function submitFeedbackAction(
  _previousState: FeedbackState,
  formData: FormData
): Promise<FeedbackState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Feedback göndərmək üçün daxil olun." };

  const message = cleanNote(formData.get("message"), 1500);
  if (message.length < 10) return { ok: false, message: "Feedback ən azı 10 simvol olmalıdır." };

  await prisma.feedback.create({ data: { userId: user.id, message } });
  revalidatePath("/admin/feedback");
  return { ok: true, message: "Feedback göndərildi. Təşəkkür edirik." };
}

export async function reportPostAction(postId: string, noteValue: string): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Report üçün daxil olun." };

  const note = cleanNote(noteValue, 300);
  if (note.length < 5) return { ok: false, message: "Qısa səbəb yazın (ən azı 5 simvol)." };

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, isHidden: true }
  });
  if (!post || post.isHidden) return { ok: false, message: "Post tapılmadı." };
  if (post.authorId === user.id) return { ok: false, message: "Öz postunuzu report edə bilməzsiniz." };

  await prisma.postReport.upsert({
    where: { postId_reporterId: { postId, reporterId: user.id } },
    create: { postId, reporterId: user.id, postAuthorId: post.authorId, note },
    update: { note, status: "OPEN", adminNote: null, resolvedAt: null }
  });
  revalidatePath("/admin/reports");
  return { ok: true, message: "Report moderatorlara göndərildi." };
}

export async function updateFeedbackAction(formData: FormData) {
  await requireAdmin();
  const feedbackId = String(formData.get("feedbackId") ?? "");
  const status = String(formData.get("status") ?? "");
  const adminNote = cleanNote(formData.get("adminNote"), 500) || null;
  if (!feedbackId || !["REVIEWED", "RESOLVED", "DISMISSED"].includes(status)) return;

  await prisma.feedback.update({
    where: { id: feedbackId },
    data: {
      status: status as "REVIEWED" | "RESOLVED" | "DISMISSED",
      adminNote,
      resolvedAt: status === "RESOLVED" || status === "DISMISSED" ? new Date() : null
    }
  });
  revalidatePath("/admin/feedback");
}

export async function moderatePostReportAction(formData: FormData) {
  await requireAdmin();
  const reportId = String(formData.get("reportId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const adminNote = cleanNote(formData.get("adminNote"), 500) || null;
  if (!reportId || !["DISMISS", "HIDE_POST", "BAN_AUTHOR"].includes(decision)) return;

  const report = await prisma.postReport.findUnique({
    where: { id: reportId },
    select: { id: true, postId: true, postAuthorId: true }
  });
  if (!report) return;

  if (decision === "DISMISS") {
    await prisma.postReport.update({
      where: { id: report.id },
      data: { status: "DISMISSED", adminNote, resolvedAt: new Date() }
    });
  } else if (decision === "HIDE_POST") {
    await prisma.$transaction([
      prisma.post.update({
        where: { id: report.postId },
        data: { isHidden: true, hiddenAt: new Date(), moderationNote: adminNote ?? "Reported content" }
      }),
      prisma.postReport.update({
        where: { id: report.id },
        data: { status: "RESOLVED", adminNote, resolvedAt: new Date() }
      })
    ]);
  } else {
    const reason = adminNote ?? "Post report əsasında admin banı";
    await prisma.$transaction([
      prisma.user.update({
        where: { id: report.postAuthorId },
        data: { isBanned: true, bannedAt: new Date(), banReason: reason }
      }),
      prisma.post.updateMany({
        where: { authorId: report.postAuthorId },
        data: { isHidden: true, hiddenAt: new Date(), moderationNote: reason }
      }),
      prisma.postReport.update({
        where: { id: report.id },
        data: { status: "RESOLVED", adminNote: reason, resolvedAt: new Date() }
      })
    ]);
  }

  revalidatePath("/admin/reports");
  revalidatePath("/feed");
}

export async function moderatePostAction(formData: FormData) {
  await requireAdmin();
  const postId = String(formData.get("postId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const adminNote = cleanNote(formData.get("adminNote"), 500) || null;
  if (!postId || !["HIDE", "UNHIDE", "BAN_AUTHOR"].includes(decision)) return;

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post) return;

  if (decision === "BAN_AUTHOR") {
    const reason = adminNote ?? "Admin moderasiyası əsasında ban";
    await prisma.$transaction([
      prisma.user.update({
        where: { id: post.authorId },
        data: { isBanned: true, bannedAt: new Date(), banReason: reason }
      }),
      prisma.post.updateMany({
        where: { authorId: post.authorId },
        data: { isHidden: true, hiddenAt: new Date(), moderationNote: reason }
      }),
      prisma.postReport.updateMany({
        where: { postAuthorId: post.authorId, status: "OPEN" },
        data: { status: "RESOLVED", adminNote: reason, resolvedAt: new Date() }
      })
    ]);
  } else {
    const hidden = decision === "HIDE";
    await prisma.post.update({
      where: { id: postId },
      data: {
        isHidden: hidden,
        hiddenAt: hidden ? new Date() : null,
        moderationNote: hidden ? adminNote ?? "Admin tərəfindən gizlədildi" : null
      }
    });
  }

  revalidatePath("/admin/posts");
  revalidatePath(`/admin/posts/${postId}`);
  revalidatePath("/admin/reports");
  revalidatePath("/feed");
}
