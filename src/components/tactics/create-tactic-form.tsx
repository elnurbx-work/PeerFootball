"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTacticAction } from "@/actions/tactic.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const categories = [
  ["ATTACK", "Hücum"],
  ["DEFENCE", "Müdafiə"],
  ["TRANSITION", "Keçid"],
  ["PRESSING", "Pressinq"],
  ["BUILD_UP", "Geridən oyun qurma"],
  ["SET_PIECE", "Standart vəziyyət"],
  ["TRAINING", "Məşq"],
  ["CUSTOM", "Digər"]
] as const;

export function CreateTacticForm({ lineupPlanId }: { lineupPlanId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="grid max-w-2xl gap-4 rounded-xl border bg-card p-5 sm:p-7"
      onSubmit={(event) => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(event.currentTarget));
        startTransition(async () => {
          const result = await createTacticAction({ ...values, lineupPlanId });
          setMessage(result.message);
          if (result.ok && result.data) router.push(`/tactics/${result.data.tacticId}/edit`);
        });
      }}
    >
      <label className="grid gap-1 text-sm">Ad<Input name="name" required minLength={2} maxLength={120} placeholder="Sağ cinah hücumu" /></label>
      <label className="grid gap-1 text-sm">Açıqlama<textarea name="description" maxLength={1000} className="min-h-24 rounded-md border bg-background p-3 text-sm" /></label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-1 text-sm">Kateqoriya
          <select name="category" className="h-10 rounded-md border bg-background px-3">{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        </label>
        <label className="grid gap-1 text-sm">Görünürlük
          <select name="visibility" defaultValue="COACHING_STAFF" className="h-10 rounded-md border bg-background px-3">
            <option value="PRIVATE">Yalnız mən</option>
            <option value="COACHING_STAFF">Məşqçi heyəti</option>
            <option value="TEAM_MEMBERS">Klub üzvləri</option>
            <option value="PUBLIC">Hamı</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">Başlanğıc müddət
          <select name="durationMs" defaultValue="10000" className="h-10 rounded-md border bg-background px-3">
            <option value="5000">5 saniyə</option>
            <option value="10000">10 saniyə</option>
            <option value="15000">15 saniyə</option>
            <option value="20000">20 saniyə</option>
          </select>
        </label>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Yaradılır..." : "Taktikanı yarat və redaktə et"}</Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
