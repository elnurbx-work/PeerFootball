"use client";

import { useRef, useState, type PointerEvent } from "react";
import { clampCoordinate } from "@/lib/tactics/engine";
import type {
  SceneBallState,
  ScenePlayerState,
  TacticAnnotationDto,
  TacticPlayerActionDto,
  TacticSnapshot
} from "@/types/tactic.types";

export function TacticPitch({
  snapshot,
  players,
  ball,
  actions = [],
  annotations = [],
  selectedSlotKey,
  editable = false,
  showNames = true,
  showNumbers = true,
  showArrows = true,
  onSelectSlot,
  onMoveSlot
}: {
  snapshot: TacticSnapshot;
  players: ScenePlayerState[];
  ball: SceneBallState | null;
  actions?: TacticPlayerActionDto[];
  annotations?: TacticAnnotationDto[];
  selectedSlotKey?: string | null;
  editable?: boolean;
  showNames?: boolean;
  showNumbers?: boolean;
  showArrows?: boolean;
  onSelectSlot?: (slotKey: string) => void;
  onMoveSlot?: (slotKey: string, point: { x: number; y: number }) => void;
}) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const slotByKey = new Map(snapshot.slots.map((slot) => [slot.slotKey, slot]));

  function pointFromEvent(event: PointerEvent) {
    const rect = fieldRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: clampCoordinate((event.clientX - rect.left) / rect.width * 100),
      y: clampCoordinate((event.clientY - rect.top) / rect.height * 100)
    };
  }

  function startDrag(event: PointerEvent<HTMLButtonElement>, slotKey: string) {
    onSelectSlot?.(slotKey);
    if (!editable) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(slotKey);
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>, slotKey: string) {
    if (dragging !== slotKey) return;
    const point = pointFromEvent(event);
    if (point) onMoveSlot?.(slotKey, point);
  }

  return (
    <div
      ref={fieldRef}
      className="relative aspect-[16/10] w-full touch-none overflow-hidden rounded-xl border-2 border-white/25 bg-[linear-gradient(90deg,#176b3a_0%,#176b3a_50%,#1b7440_50%,#1b7440_100%)] shadow-inner dark:bg-[linear-gradient(90deg,#0d4f2a_0%,#0d4f2a_50%,#115b31_50%,#115b31_100%)]"
      aria-label="Taktika meydanı"
    >
      <FieldLines />
      <Annotations items={annotations} />
      {showArrows ? <ActionArrows actions={actions} /> : null}

      {players.map((player) => {
        const slot = slotByKey.get(player.slotKey);
        if (!slot || slot.isSubstitute) return null;
        const name = slot.assignedUser?.name ?? slot.assignedUser?.username ?? slot.label;
        return (
          <button
            key={player.slotKey}
            type="button"
            aria-label={`${name}, ${slot.position ?? slot.label}`}
            aria-pressed={selectedSlotKey === player.slotKey}
            onClick={() => {
              if (!editable) onSelectSlot?.(player.slotKey);
            }}
            onPointerDown={(event) => startDrag(event, player.slotKey)}
            onPointerMove={(event) => moveDrag(event, player.slotKey)}
            onPointerUp={() => setDragging(null)}
            onPointerCancel={() => setDragging(null)}
            onKeyDown={(event) => {
              if (!editable || !onMoveSlot) return;
              const delta = event.shiftKey ? 5 : 1;
              const changes: Record<string, { x: number; y: number }> = {
                ArrowLeft: { x: player.x - delta, y: player.y },
                ArrowRight: { x: player.x + delta, y: player.y },
                ArrowUp: { x: player.x, y: player.y - delta },
                ArrowDown: { x: player.x, y: player.y + delta }
              };
              if (changes[event.key]) {
                event.preventDefault();
                onMoveSlot(player.slotKey, {
                  x: clampCoordinate(changes[event.key].x),
                  y: clampCoordinate(changes[event.key].y)
                });
              }
            }}
            style={{ left: `${player.x}%`, top: `${player.y}%` }}
            className={`group absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center outline-none ${
              editable ? "cursor-grab active:cursor-grabbing" : "cursor-default"
            }`}
          >
            <span className={`relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 bg-card text-[10px] font-black text-foreground shadow-lg transition sm:h-11 sm:w-11 sm:text-xs ${
              selectedSlotKey === player.slotKey ? "border-primary ring-4 ring-primary/30" : "border-white"
            }`}>
              {slot.assignedUser?.image ? <img src={slot.assignedUser.image} alt="" className="h-full w-full object-cover" /> : showNumbers ? slot.shirtNumber ?? slot.position ?? "?" : slot.position ?? "?"}
              {slot.isCaptain ? <i className="absolute -right-0.5 -top-0.5 rounded-full bg-primary px-1 text-[8px] not-italic text-primary-foreground">C</i> : null}
              {slot.isGoalkeeper ? <i className="absolute -bottom-0.5 -right-0.5 rounded-full bg-warning px-1 text-[7px] not-italic text-black">GK</i> : null}
            </span>
            {showNames ? <span className="mt-1 max-w-20 truncate rounded bg-black/65 px-1.5 py-0.5 text-[8px] font-semibold text-white sm:text-[10px]">{name}</span> : null}
          </button>
        );
      })}

      {ball ? (
        <span
          style={{ left: `${ball.x}%`, top: `${ball.y}%` }}
          className="absolute z-30 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-black bg-white text-[9px] shadow sm:h-5 sm:w-5"
          aria-label="Top"
        >
          ⚽
        </span>
      ) : null}
    </div>
  );
}

function Annotations({ items }: { items: TacticAnnotationDto[] }) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 z-[5] h-full w-full text-warning" aria-hidden="true">
      {items.map((item) => {
        if (item.type === "TEXT") return <text key={item.id} x={item.x} y={item.y} fill="currentColor" fontSize="3" textAnchor="middle">{item.label ?? "Qeyd"}</text>;
        if (item.type === "CIRCLE") return <ellipse key={item.id} cx={item.x} cy={item.y} rx={(item.width ?? 12) / 2} ry={(item.height ?? 12) / 2} fill="none" stroke="currentColor" strokeWidth="0.7" />;
        if (item.type === "ZONE") return <rect key={item.id} x={item.x - (item.width ?? 20) / 2} y={item.y - (item.height ?? 15) / 2} width={item.width ?? 20} height={item.height ?? 15} fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="0.5" />;
        return <line key={item.id} x1={item.x - (item.width ?? 10) / 2} y1={item.y} x2={item.x + (item.width ?? 10) / 2} y2={item.y} stroke="currentColor" strokeWidth="0.8" />;
      })}
    </svg>
  );
}

function FieldLines() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full text-white/65" aria-hidden="true">
      <rect x="1" y="1" width="98" height="98" fill="none" stroke="currentColor" strokeWidth="0.6" />
      <line x1="50" y1="1" x2="50" y2="99" stroke="currentColor" strokeWidth="0.5" />
      <ellipse cx="50" cy="50" rx="9" ry="14" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <rect x="1" y="25" width="15" height="50" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <rect x="84" y="25" width="15" height="50" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <rect x="1" y="38" width="5" height="24" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <rect x="94" y="38" width="5" height="24" fill="none" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  );
}

function ActionArrows({ actions }: { actions: TacticPlayerActionDto[] }) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 z-10 h-full w-full text-primary" aria-hidden="true">
      <defs>
        <marker id="tactic-arrow" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
          <path d="M0,0 L4,2 L0,4 Z" fill="currentColor" />
        </marker>
      </defs>
      {actions.map((action) => (
        <line
          key={action.id}
          x1={action.startX}
          y1={action.startY}
          x2={action.endX}
          y2={action.endY}
          stroke="currentColor"
          strokeWidth={action.type === "SPRINT" ? 1.2 : 0.75}
          strokeDasharray={["PASS", "CROSS"].includes(action.type) ? "2 2" : action.type === "DRIBBLE" ? "1 1" : undefined}
          markerEnd="url(#tactic-arrow)"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
