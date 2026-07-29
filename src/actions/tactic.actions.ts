"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import {
  attachTacticToMatchSchema,
  batchUpdateLineupSlotsSchema,
  createLineupPlanSchema,
  createTacticSchema,
  lineupPlanIdSchema,
  saveTacticEditorStateSchema,
  tacticIdSchema,
  updateLineupPlanSchema,
  updateTacticVisibilitySchema
} from "@/lib/validations/tactic";
import {
  archiveLineupPlan,
  archiveTactic,
  attachTacticToMatch,
  createLineupPlan,
  createTactic,
  deleteLineupPlan,
  deleteTactic,
  detachTacticFromMatch,
  duplicateTactic,
  saveLineupSlots,
  saveTacticEditorState,
  TacticDomainError,
  updateLineupPlan,
  updateTacticVisibility
} from "@/server/services/tactic.service";
import type { ApiResponse } from "@/types/api.types";

export async function createLineupPlanAction(input: unknown): Promise<ApiResponse<{ lineupPlanId: string }>> {
  const user = await getCurrentUser();
  if (!user) return fail("Daxil olmaq tələb olunur.");
  const parsed = createLineupPlanSchema.safeParse(toObject(input));
  if (!parsed.success) return validationFail(parsed.error);
  try {
    const plan = await createLineupPlan(user.id, parsed.data);
    revalidatePath(`/clubs`, "layout");
    return { ok: true, message: "Heyət planı yaradıldı.", data: { lineupPlanId: plan.id } };
  } catch (error) {
    return domainFail(error, "Heyət planı yaradıla bilmədi.");
  }
}

export async function saveLineupSlotsAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return fail("Daxil olmaq tələb olunur.");
  const parsed = batchUpdateLineupSlotsSchema.safeParse(input);
  if (!parsed.success) return validationFail(parsed.error);
  try {
    await saveLineupSlots(user.id, parsed.data);
    revalidatePath(`/clubs`, "layout");
    return { ok: true, message: "Heyət düzülüşü saxlanıldı." };
  } catch (error) {
    return domainFail(error, "Heyət düzülüşü saxlanılmadı.");
  }
}

export async function updateLineupPlanAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return fail("Daxil olmaq tələb olunur.");
  const parsed = updateLineupPlanSchema.safeParse(toObject(input));
  if (!parsed.success) return validationFail(parsed.error);
  try {
    await updateLineupPlan(user.id, parsed.data);
    revalidatePath("/clubs", "layout");
    return { ok: true, message: "Heyət planının ayarları yeniləndi." };
  } catch (error) {
    return domainFail(error, "Heyət planı yenilənmədi.");
  }
}

export async function archiveLineupPlanAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return fail("Daxil olmaq tələb olunur.");
  const parsed = lineupPlanIdSchema.safeParse(input);
  if (!parsed.success) return validationFail(parsed.error);
  try {
    await archiveLineupPlan(user.id, parsed.data.lineupPlanId);
    revalidatePath(`/clubs`, "layout");
    return { ok: true, message: "Heyət planı arxivləşdirildi." };
  } catch (error) {
    return domainFail(error, "Əməliyyat alınmadı.");
  }
}

export async function deleteLineupPlanAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return fail("Daxil olmaq tələb olunur.");
  const parsed = lineupPlanIdSchema.safeParse(input);
  if (!parsed.success) return validationFail(parsed.error);
  try {
    await deleteLineupPlan(user.id, parsed.data.lineupPlanId);
    revalidatePath(`/clubs`, "layout");
    return { ok: true, message: "Heyət planı silindi." };
  } catch (error) {
    return domainFail(error, "Heyət planı silinmədi.");
  }
}

export async function createTacticAction(input: unknown): Promise<ApiResponse<{ tacticId: string }>> {
  const user = await getCurrentUser();
  if (!user) return fail("Daxil olmaq tələb olunur.");
  const parsed = createTacticSchema.safeParse(toObject(input));
  if (!parsed.success) return validationFail(parsed.error);
  try {
    const tactic = await createTactic(user.id, parsed.data);
    revalidateTacticSurfaces(tactic.id);
    return { ok: true, message: "Taktika yaradıldı.", data: { tacticId: tactic.id } };
  } catch (error) {
    return domainFail(error, "Taktika yaradıla bilmədi.");
  }
}

export async function saveTacticEditorStateAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return fail("Daxil olmaq tələb olunur.");
  const parsed = saveTacticEditorStateSchema.safeParse(input);
  if (!parsed.success) return validationFail(parsed.error);
  try {
    await saveTacticEditorState(user.id, parsed.data);
    revalidateTacticSurfaces(parsed.data.tacticId);
    return { ok: true, message: "Taktika saxlanıldı." };
  } catch (error) {
    return domainFail(error, "Taktika saxlanılmadı.");
  }
}

export async function duplicateTacticAction(input: unknown): Promise<ApiResponse<{ tacticId: string }>> {
  const user = await getCurrentUser();
  if (!user) return fail("Daxil olmaq tələb olunur.");
  const parsed = tacticIdSchema.safeParse(input);
  if (!parsed.success) return validationFail(parsed.error);
  try {
    const tactic = await duplicateTactic(user.id, parsed.data.tacticId);
    revalidateTacticSurfaces(tactic.id);
    return { ok: true, message: "Taktikanın tam kopiyası yaradıldı.", data: { tacticId: tactic.id } };
  } catch (error) {
    return domainFail(error, "Taktika kopyalanmadı.");
  }
}

export async function archiveTacticAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return fail("Daxil olmaq tələb olunur.");
  const parsed = tacticIdSchema.safeParse(input);
  if (!parsed.success) return validationFail(parsed.error);
  try {
    await archiveTactic(user.id, parsed.data.tacticId);
    revalidateTacticSurfaces(parsed.data.tacticId);
    return { ok: true, message: "Taktikanın arxiv statusu yeniləndi." };
  } catch (error) {
    return domainFail(error, "Əməliyyat alınmadı.");
  }
}

export async function deleteTacticAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return fail("Daxil olmaq tələb olunur.");
  const parsed = tacticIdSchema.safeParse(input);
  if (!parsed.success) return validationFail(parsed.error);
  try {
    await deleteTactic(user.id, parsed.data.tacticId);
    revalidatePath("/clubs", "layout");
    return { ok: true, message: "Taktika silindi." };
  } catch (error) {
    return domainFail(error, "Taktika silinmədi.");
  }
}

export async function updateTacticVisibilityAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return fail("Daxil olmaq tələb olunur.");
  const parsed = updateTacticVisibilitySchema.safeParse(input);
  if (!parsed.success) return validationFail(parsed.error);
  try {
    await updateTacticVisibility(user.id, parsed.data);
    revalidateTacticSurfaces(parsed.data.tacticId);
    return { ok: true, message: "Görünürlük yeniləndi." };
  } catch (error) {
    return domainFail(error, "Görünürlük yenilənmədi.");
  }
}

export async function attachTacticToMatchAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return fail("Daxil olmaq tələb olunur.");
  const parsed = attachTacticToMatchSchema.safeParse(input);
  if (!parsed.success) return validationFail(parsed.error);
  try {
    await attachTacticToMatch(user.id, parsed.data);
    revalidatePath(`/matches/${parsed.data.matchId}`);
    return { ok: true, message: "Taktika matça bağlandı." };
  } catch (error) {
    return domainFail(error, "Taktika matça bağlanmadı.");
  }
}

export async function detachTacticFromMatchAction(input: { matchId: string; tacticId: string }): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return fail("Daxil olmaq tələb olunur.");
  try {
    await detachTacticFromMatch(user.id, input.matchId, input.tacticId);
    revalidatePath(`/matches/${input.matchId}`);
    return { ok: true, message: "Taktika matçdan ayrıldı." };
  } catch (error) {
    return domainFail(error, "Taktika matçdan ayrılmadı.");
  }
}

function revalidateTacticSurfaces(tacticId: string) {
  revalidatePath(`/tactics/${tacticId}`);
  revalidatePath("/clubs", "layout");
}

function toObject(input: unknown) {
  return input instanceof FormData ? Object.fromEntries(input) : input;
}

function validationFail(error: { flatten(): { fieldErrors: Record<string, string[]> } }): ApiResponse<never> {
  return { ok: false, message: "Daxil edilən məlumatları yoxlayın.", issues: error.flatten().fieldErrors };
}

function fail(message: string): ApiResponse<never> {
  return { ok: false, message };
}

function domainFail(error: unknown, fallback: string): ApiResponse<never> {
  if (error instanceof TacticDomainError) return fail(error.message);
  throw error instanceof Error ? error : new Error(fallback);
}
