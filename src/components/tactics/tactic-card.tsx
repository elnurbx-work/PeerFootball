"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, Copy, Eye, Pencil } from "lucide-react";
import { archiveTacticAction, duplicateTacticAction } from "@/actions/tactic.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TacticListItemDto } from "@/types/tactic.types";

export function TacticCard({ tactic, canEdit }: { tactic: TacticListItemDto; canEdit: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const preview = parsePreview(tactic.previewData);
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[16/7] border-b bg-[linear-gradient(90deg,#176b3a_0%,#176b3a_50%,#1b7440_50%,#1b7440_100%)]">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full text-white/60">
          <rect x="1" y="1" width="98" height="98" fill="none" stroke="currentColor" />
          <line x1="50" y1="1" x2="50" y2="99" stroke="currentColor" />
          {preview.map((point) => <circle key={point.slotKey} cx={point.x} cy={point.y} r="3.2" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="1" />)}
        </svg>
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{tactic.name}</CardTitle>
          <Badge>{categoryLabel(tactic.category)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span>{tactic.lineupPlan.name} · {tactic.lineupPlan.formationCode}</span>
          <span>{(tactic.durationMs / 1000).toFixed(1)}s · {tactic.sceneCount} səhnə</span>
          <span>{visibilityLabel(tactic.visibility)}</span>
          <span>{new Date(tactic.updatedAt).toLocaleDateString("az-AZ")}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline"><Link href={`/tactics/${tactic.id}`}><Eye className="h-4 w-4" />Bax</Link></Button>
          {canEdit && tactic.status !== "ARCHIVED" ? <Button asChild size="sm" variant="outline"><Link href={`/tactics/${tactic.id}/edit`}><Pencil className="h-4 w-4" />Redaktə</Link></Button> : null}
          {canEdit ? <Button size="sm" variant="outline" disabled={pending} onClick={() => startTransition(async () => { const result = await duplicateTacticAction({ tacticId: tactic.id }); setMessage(result.message); if (result.ok && result.data) router.push(`/tactics/${result.data.tacticId}`); })}><Copy className="h-4 w-4" /></Button> : null}
          {canEdit ? <Button size="sm" variant="outline" disabled={pending} onClick={() => startTransition(async () => { const result = await archiveTacticAction({ tacticId: tactic.id }); setMessage(result.message); if (result.ok) router.refresh(); })}><Archive className="h-4 w-4" /></Button> : null}
        </div>
        {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      </CardContent>
    </Card>
  );
}

function parsePreview(value: unknown): Array<{ slotKey: string; x: number; y: number }> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const players = (value as { players?: unknown }).players;
  if (!Array.isArray(players)) return [];
  return players.flatMap((item) => item && typeof item === "object"
    && typeof (item as { slotKey?: unknown }).slotKey === "string"
    && typeof (item as { x?: unknown }).x === "number"
    && typeof (item as { y?: unknown }).y === "number"
    ? [item as { slotKey: string; x: number; y: number }]
    : []);
}

function categoryLabel(value: string) {
  return ({ ATTACK: "Hücum", DEFENCE: "Müdafiə", TRANSITION: "Keçid", PRESSING: "Pressinq", BUILD_UP: "Oyun qurma", SET_PIECE: "Standart", TRAINING: "Məşq", CUSTOM: "Digər" } as Record<string, string>)[value] ?? value;
}

function visibilityLabel(value: string) {
  return ({ PRIVATE: "Yalnız müəllif", COACHING_STAFF: "Məşqçi heyəti", TEAM_MEMBERS: "Klub üzvləri", PUBLIC: "Hamı" } as Record<string, string>)[value] ?? value;
}
