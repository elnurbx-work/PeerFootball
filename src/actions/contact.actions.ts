"use server";

import type { ApiResponse } from "@/types/api.types";

export async function submitContactAction(formData: FormData): Promise<ApiResponse> {
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  if (website) return { ok: true, message: "Sorğunuz qəbul edildi." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || subject.length < 3 || subject.length > 120 || message.length < 20 || message.length > 4000) {
    return { ok: false, message: "E-poçt, mövzu və ən az 20 simvolluq mesaj daxil edin." };
  }
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!supportEmail || !apiKey || !from) {
    return { ok: false, message: "Əlaqə kanalı hazırda konfiqurasiya edilməyib. Hesab daxilində Əks əlaqə bölməsindən istifadə edin." };
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from, to: [supportEmail], reply_to: email,
      subject: `[PeerFootball Contact] ${subject}`,
      text: message
    }),
    cache: "no-store"
  });
  return response.ok
    ? { ok: true, message: "Mesaj göndərildi. Təşəkkür edirik." }
    : { ok: false, message: "Mesaj göndərilmədi. Bir qədər sonra yenidən cəhd edin." };
}
