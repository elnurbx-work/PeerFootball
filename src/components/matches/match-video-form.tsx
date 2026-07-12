"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addMatchVideoAction, updateMatchVideoAction } from "@/actions/match.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { MatchVideoDto } from "@/types/match.types";

export function MatchVideoForm({ matchId, video, onDone }: { matchId: string; video?: MatchVideoDto; onDone?: () => void }) {
  const router = useRouter(); const [message, setMessage] = useState(""); const [pending, startTransition] = useTransition();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form));
    startTransition(async () => {
      const result = video ? await updateMatchVideoAction({ ...values, matchVideoId: video.id }) : await addMatchVideoAction({ ...values, matchId });
      setMessage(result.message); if (result.ok) { if (!video) form.reset(); onDone?.(); router.refresh(); }
    });
  }
  return <form className="grid gap-3" onSubmit={submit}><Input name="title" defaultValue={video?.title ?? ""} maxLength={120} placeholder="Video başlığı" /><Input name="url" type="url" defaultValue={video?.originalUrl ?? ""} placeholder="Video linki" required /><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm"><span>Video tipi</span><select name="videoType" defaultValue={video?.videoType ?? "FULL_MATCH"} className="h-10 rounded-md border bg-background px-3"><option value="FULL_MATCH">Tam oyun</option><option value="FIRST_HALF">1-ci hissə</option><option value="SECOND_HALF">2-ci hissə</option><option value="OTHER">Digər</option></select></label><label className="grid gap-1 text-sm"><span>Oyunun videoda başladığı saniyə</span><Input name="matchStartSecond" type="number" min={0} defaultValue={video?.matchStartSecond ?? 0} required /></label></div><Textarea name="description" defaultValue={video?.description ?? ""} maxLength={500} placeholder="Açıqlama (istəyə bağlı)" /><div className="rounded-md bg-secondary p-3 text-xs text-muted-foreground"><p>Yalnız Google Drive və YouTube linkləri dəstəklənir.</p><p className="mt-1">Google Drive videolarında dəqiq saniyəyə keçid məhdud işləyə bilər. YouTube videolarında keçid daha stabil işləyir.</p></div><details className="rounded-md border p-3 text-sm"><summary className="cursor-pointer font-medium">Dəstəklənən link formatları</summary><div className="mt-3 grid gap-2 text-xs text-muted-foreground"><p><strong>Google Drive</strong><br />https://drive.google.com/file/d/FILE_ID/view<br />https://drive.google.com/file/d/FILE_ID/preview</p><p><strong>YouTube</strong><br />https://www.youtube.com/watch?v=VIDEO_ID<br />https://youtu.be/VIDEO_ID<br />https://www.youtube.com/embed/VIDEO_ID</p><p><strong>Şərhlərdə işləyən vaxt formatları</strong><br />19:30 · 1:05:20 · 67’ · 67-ci dəqiqə · 45+2</p></div></details>{message ? <p className="text-sm text-destructive">{message}</p> : null}<Button className="w-fit" disabled={pending}>{pending ? "Saxlanılır..." : video ? "Videonu yenilə" : "Video əlavə et"}</Button></form>;
}
