"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { saveLineupSlotsAction } from "@/actions/tactic.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TacticPitch } from "@/components/tactics/tactic-pitch";
import { FOOTBALL_POSITIONS } from "@/lib/football-positions";
import type { ClubMemberDto } from "@/types/club.types";
import type { LineupPlanDetailDto, LineupSlotDto, TacticSnapshot } from "@/types/tactic.types";

export function LineupEditor({ plan, members }: { plan: LineupPlanDetailDto; members: ClubMemberDto[] }) {
  const [slots, setSlots] = useState(plan.slots);
  const [selectedSlotKey, setSelectedSlotKey] = useState(plan.slots[0]?.slotKey ?? null);
  const [memberSearch, setMemberSearch] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const selected = slots.find((slot) => slot.slotKey === selectedSlotKey);
  const memberById = new Map(members.map((member) => [member.id, member]));
  const assignedSlotByMemberId = new Map(
    slots.flatMap((slot) => slot.assignedClubMemberId ? [[slot.assignedClubMemberId, slot.slotKey] as const] : [])
  );
  const visibleMembers = members.filter((member) => {
    const query = memberSearch.trim().toLocaleLowerCase("az");
    if (!query) return true;
    return [member.user.name, member.user.username]
      .filter(Boolean)
      .some((value) => value!.toLocaleLowerCase("az").includes(query));
  });
  const snapshot = useMemo<TacticSnapshot>(() => ({
    version: 1,
    lineupPlanId: plan.id,
    formationCode: plan.formationCode,
    playerCount: plan.playerCount,
    pitchType: plan.pitchType,
    slots: slots.map((slot) => {
      const member = slot.assignedClubMemberId ? memberById.get(slot.assignedClubMemberId) : null;
      return {
        slotKey: slot.slotKey,
        label: slot.label,
        position: slot.position,
        x: slot.x,
        y: slot.y,
        shirtNumber: slot.shirtNumber,
        isCaptain: slot.isCaptain,
        isGoalkeeper: slot.isGoalkeeper,
        isSubstitute: slot.isSubstitute,
        assignedUser: member ? member.user : null
      };
    })
  }), [memberById, plan, slots]);

  function updateSlot(slotKey: string, changes: Partial<LineupSlotDto>) {
    setSlots((current) => current.map((slot) => slot.slotKey === slotKey ? { ...slot, ...changes } : slot));
  }

  function save() {
    startTransition(async () => {
      const result = await saveLineupSlotsAction({
        lineupPlanId: plan.id,
        slots: slots.map(({ assignedClubMember, ...slot }) => ({
          ...slot,
          position: slot.position ?? undefined,
          assignedClubMemberId: slot.assignedClubMemberId ?? null
        }))
      });
      setMessage(result.message);
    });
  }

  function addSubstitute() {
    const index = slots.filter((slot) => slot.isSubstitute).length + 1;
    const slotKey = `SUB_${Date.now()}_${index}`;
    setSlots((current) => [...current, {
      id: "",
      slotKey,
      label: `Ehtiyat ${index}`,
      position: null,
      x: 50,
      y: 95,
      assignedClubMemberId: null,
      shirtNumber: null,
      isCaptain: false,
      isGoalkeeper: false,
      isSubstitute: true,
      sortOrder: current.length,
      assignedClubMember: null
    }]);
    setSelectedSlotKey(slotKey);
  }

  function selectMember(memberId: string) {
    const assignedSlotKey = assignedSlotByMemberId.get(memberId);
    if (assignedSlotKey) {
      setSelectedSlotKey(assignedSlotKey);
      return;
    }
    if (!selectedSlotKey || !plan.canEdit) return;
    setSlots((current) => current.map((slot) =>
      slot.slotKey === selectedSlotKey
        ? { ...slot, assignedClubMemberId: memberId }
        : slot
    ));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="grid min-w-0 gap-3">
        <TacticPitch
          snapshot={snapshot}
          players={slots.filter((slot) => !slot.isSubstitute).map((slot) => ({ slotKey: slot.slotKey, x: slot.x, y: slot.y }))}
          ball={null}
          editable={plan.canEdit}
          selectedSlotKey={selectedSlotKey}
          onSelectSlot={setSelectedSlotKey}
          onMoveSlot={(slotKey, point) => updateSlot(slotKey, point)}
        />
        <section className="grid gap-2 rounded-xl border bg-card p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">Ehtiyat oyunçular</h3>
            {plan.canEdit ? <Button size="sm" variant="outline" onClick={addSubstitute}><Plus className="h-4 w-4" />Əlavə et</Button> : null}
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {slots.filter((slot) => slot.isSubstitute).map((slot) => {
              const member = slot.assignedClubMemberId ? memberById.get(slot.assignedClubMemberId) : null;
              return (
                <button key={slot.slotKey} type="button" onClick={() => setSelectedSlotKey(slot.slotKey)} className={`min-w-36 rounded-lg border p-3 text-left text-xs ${selectedSlotKey === slot.slotKey ? "border-primary bg-primary/10" : ""}`}>
                  <strong className="block truncate">{member?.user.name ?? slot.label}</strong>
                  <span className="text-muted-foreground">{slot.position ?? "Mövqesiz"}</span>
                </button>
              );
            })}
            {!slots.some((slot) => slot.isSubstitute) ? <p className="text-sm text-muted-foreground">Ehtiyat oyunçu əlavə edilməyib.</p> : null}
          </div>
        </section>
      </div>

      <aside className="grid content-start gap-3 rounded-xl border bg-card p-4">
        <section className="grid gap-2 border-b pb-4">
          <div>
            <h2 className="font-semibold">Klub heyətindən seç</h2>
            <p className="text-xs text-muted-foreground">
              Əvvəl meydanda mövqe seç, sonra oyunçuya toxun.
            </p>
          </div>
          <Input
            value={memberSearch}
            onChange={(event) => setMemberSearch(event.target.value)}
            placeholder="Oyunçu axtar..."
            aria-label="Klub heyətində oyunçu axtar"
          />
          <div className="grid max-h-64 gap-2 overflow-y-auto pr-1">
            {visibleMembers.map((member) => {
              const name = member.user.name ?? member.user.username ?? "Oyunçu";
              const assignedSlotKey = assignedSlotByMemberId.get(member.id);
              const isSelected = assignedSlotKey === selectedSlotKey;
              return (
                <button
                  key={member.id}
                  type="button"
                  disabled={!plan.canEdit && !assignedSlotKey}
                  onClick={() => selectMember(member.id)}
                  className={`flex min-w-0 items-center gap-2 rounded-lg border p-2 text-left transition ${
                    isSelected
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : assignedSlotKey
                        ? "bg-secondary/50"
                        : "hover:border-primary/50 hover:bg-secondary/60"
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-semibold">
                    {member.user.image
                      ? <img src={member.user.image} alt="" className="h-full w-full object-cover" />
                      : getInitials(name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm">{name}</strong>
                    <span className="block truncate text-xs text-muted-foreground">
                      {assignedSlotKey ? "Heyətdə yerləşdirilib" : "Seçilmiş mövqeyə əlavə et"}
                    </span>
                  </span>
                </button>
              );
            })}
            {!visibleMembers.length ? (
              <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                Uyğun oyunçu tapılmadı.
              </p>
            ) : null}
          </div>
        </section>
        <h2 className="font-semibold">Slot detalları</h2>
        {selected ? (
          <>
            <label className="grid gap-1 text-xs">Etiket
              <Input value={selected.label} disabled={!plan.canEdit} onChange={(event) => updateSlot(selected.slotKey, { label: event.target.value })} />
            </label>
            <label className="grid gap-1 text-xs">Oyunçu
              <select
                value={selected.assignedClubMemberId ?? ""}
                disabled={!plan.canEdit}
                onChange={(event) => {
                  const assignedClubMemberId = event.target.value || null;
                  setSlots((current) => current.map((slot) => slot.slotKey === selected.slotKey
                    ? { ...slot, assignedClubMemberId }
                    : assignedClubMemberId && slot.assignedClubMemberId === assignedClubMemberId
                      ? { ...slot, assignedClubMemberId: null }
                      : slot));
                }}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Placeholder</option>
                {members.map((member) => <option key={member.id} value={member.id}>{member.user.name ?? member.user.username}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-xs">Mövqe
              <select value={selected.position ?? ""} disabled={!plan.canEdit} onChange={(event) => updateSlot(selected.slotKey, { position: (event.target.value || null) as LineupSlotDto["position"] })} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">Mövqesiz</option>
                {FOOTBALL_POSITIONS.map((position) => <option key={position} value={position}>{position}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-xs">Forma nömrəsi
              <Input type="number" min={1} max={99} value={selected.shirtNumber ?? ""} disabled={!plan.canEdit} onChange={(event) => updateSlot(selected.slotKey, { shirtNumber: event.target.value ? Number(event.target.value) : null })} />
            </label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.isCaptain} disabled={!plan.canEdit} onChange={(event) => setSlots((current) => current.map((slot) => ({ ...slot, isCaptain: slot.slotKey === selected.slotKey ? event.target.checked : false })))} />Kapitan</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.isGoalkeeper} disabled={!plan.canEdit} onChange={(event) => updateSlot(selected.slotKey, { isGoalkeeper: event.target.checked })} />Qapıçı</label>
            {plan.canEdit && selected.isSubstitute ? <Button variant="destructive" size="sm" onClick={() => { setSlots((current) => current.filter((slot) => slot.slotKey !== selected.slotKey)); setSelectedSlotKey(plan.slots[0]?.slotKey ?? null); }}><Trash2 className="h-4 w-4" />Ehtiyatı sil</Button> : null}
          </>
        ) : <p className="text-sm text-muted-foreground">Meydanda slot seç.</p>}
        {plan.canEdit ? <Button onClick={save} disabled={pending}><Save className="h-4 w-4" />{pending ? "Saxlanılır..." : "Düzülüşü saxla"}</Button> : null}
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </aside>
    </div>
  );
}

function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("az"))
    .join("");
}
