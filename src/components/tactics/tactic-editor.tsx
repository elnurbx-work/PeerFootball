"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Copy, Pause, Play, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { saveTacticEditorStateAction } from "@/actions/tactic.actions";
import type { TacticActionType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TacticPitch } from "@/components/tactics/tactic-pitch";
import {
  calculateBallState,
  calculatePlayerState,
  getTacticDuration,
  synchronizeSceneContinuity
} from "@/lib/tactics/engine";
import type {
  ScenePlayerState,
  TacticDetailDto,
  TacticPlayerActionDto,
  TacticSceneDto
} from "@/types/tactic.types";

const tools: TacticActionType[] = ["MOVE", "RUN", "SPRINT", "DRIBBLE", "PASS", "CROSS", "HOLD_POSITION"];

export function TacticEditor({ tactic }: { tactic: TacticDetailDto }) {
  const [scenes, setScenes] = useState(tactic.scenes);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [tool, setTool] = useState<TacticActionType>("MOVE");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [sourceSlot, setSourceSlot] = useState<string | null>(null);
  const [timeMs, setTimeMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const revisionRef = useRef(0);
  const scene = scenes[sceneIndex];
  const players = scene ? calculatePlayerState(scene, timeMs) : [];
  const ball = scene ? calculateBallState(scene, timeMs, players) : null;
  const totalDuration = getTacticDuration(scenes);

  const markChanged = useCallback((nextScenes: TacticSceneDto[]) => {
    revisionRef.current += 1;
    setScenes(synchronizeSceneContinuity(nextScenes).map((item, index) => ({ ...item, sortOrder: index })));
    setDirty(true);
  }, []);

  const save = useCallback((silent = false) => {
    if (!dirty || pending) return;
    const savingRevision = revisionRef.current;
    startTransition(async () => {
      const result = await saveTacticEditorStateAction({ tacticId: tactic.id, scenes });
      setMessage(result.ok ? (silent ? "Avtomatik saxlanıldı." : result.message) : result.message);
      if (result.ok && revisionRef.current === savingRevision) setDirty(false);
    });
  }, [dirty, pending, scenes, tactic.id]);

  useEffect(() => {
    if (!dirty) return;
    const timeout = window.setTimeout(() => save(true), 1400);
    return () => window.clearTimeout(timeout);
  }, [dirty, save]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!playing || !scene) {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      lastFrameRef.current = null;
      return;
    }
    const tick = (timestamp: number) => {
      const previous = lastFrameRef.current ?? timestamp;
      lastFrameRef.current = timestamp;
      setTimeMs((value) => {
        const next = value + timestamp - previous;
        if (next < scene.durationMs) return next;
        setPlaying(false);
        return scene.durationMs;
      });
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [playing, scene]);

  function updateScene(updater: (current: TacticSceneDto) => TacticSceneDto) {
    markChanged(scenes.map((item, index) => index === sceneIndex ? updater(item) : item));
  }

  function moveSlot(slotKey: string, point: { x: number; y: number }) {
    if (!scene || ["PASS", "CROSS"].includes(tool)) return;
    const start = scene.startState.find((item) => item.slotKey === slotKey) ?? point;
    const finalPoint = tool === "HOLD_POSITION" ? start : point;
    const endState = upsertPlayerState(scene.endState, { slotKey, ...finalPoint });
    const existing = scene.playerActions.find((action) => action.slotKey === slotKey && !["PASS", "CROSS"].includes(action.type));
    const action: TacticPlayerActionDto = {
      id: existing?.id ?? tempId("action"),
      slotKey,
      type: tool,
      targetSlotKey: null,
      startX: start.x,
      startY: start.y,
      endX: finalPoint.x,
      endY: finalPoint.y,
      startTimeMs: 0,
      durationMs: scene.durationMs,
      easing: "LINEAR",
      label: null,
      note: null
    };
    updateScene((current) => ({
      ...current,
      endState,
      playerActions: [...current.playerActions.filter((item) => item.id !== existing?.id), action],
      ...(tool === "DRIBBLE" ? {
        ballActions: [
          ...current.ballActions.filter((item) => !(item.type === "DRIBBLE" && item.sourceSlotKey === slotKey)),
          {
            id: tempId("ball"),
            type: "DRIBBLE" as const,
            sourceSlotKey: slotKey,
            targetSlotKey: slotKey,
            startX: start.x,
            startY: start.y,
            endX: point.x,
            endY: point.y,
            startTimeMs: 0,
            durationMs: current.durationMs,
            easing: "LINEAR" as const
          }
        ],
        ballEndState: { x: point.x, y: point.y, ownerSlotKey: slotKey, isFree: false }
      } : {})
    }));
    setSelectedSlot(slotKey);
  }

  function selectSlot(slotKey: string) {
    setSelectedSlot(slotKey);
    if (!["PASS", "CROSS"].includes(tool)) return;
    if (!sourceSlot) {
      setSourceSlot(slotKey);
      setMessage("İndi ötürmənin hədəf oyunçusunu seç.");
      return;
    }
    if (sourceSlot === slotKey) {
      setSourceSlot(null);
      return;
    }
    const source = scene.startState.find((item) => item.slotKey === sourceSlot);
    const target = scene.endState.find((item) => item.slotKey === slotKey) ?? scene.startState.find((item) => item.slotKey === slotKey);
    if (!source || !target) return;
    const passType = tool === "CROSS" ? "CROSS" : "PASS";
    const passStartTimeMs = scene.ballActions.reduce((latest, action) => Math.max(latest, action.startTimeMs + action.durationMs), 0);
    const passDurationMs = Math.min(1500, scene.durationMs - passStartTimeMs);
    if (passDurationMs <= 0) {
      setMessage("Bu səhnədə yeni ötürmə üçün vaxt qalmayıb.");
      setSourceSlot(null);
      return;
    }
    const action: TacticPlayerActionDto = {
      id: tempId("pass"),
      slotKey: sourceSlot,
      type: passType,
      targetSlotKey: slotKey,
      startX: source.x,
      startY: source.y,
      endX: target.x,
      endY: target.y,
      startTimeMs: passStartTimeMs,
      durationMs: passDurationMs,
      easing: "LINEAR",
      label: null,
      note: null
    };
    updateScene((current) => ({
      ...current,
      playerActions: [...current.playerActions, action],
      ballActions: [...current.ballActions, {
        id: tempId("ball"),
        type: passType,
        sourceSlotKey: sourceSlot,
        targetSlotKey: slotKey,
        startX: source.x,
        startY: source.y,
        endX: target.x,
        endY: target.y,
        startTimeMs: passStartTimeMs,
        durationMs: passDurationMs,
        easing: "LINEAR"
      }],
      ballEndState: { x: target.x, y: target.y, ownerSlotKey: slotKey, isFree: false }
    }));
    setSourceSlot(null);
    setMessage("Ötürmə əlavə edildi.");
  }

  function addScene() {
    if (!scene || totalDuration + 2000 > 60000) return setMessage("Taktikanın maksimum müddəti 60 saniyədir.");
    const next: TacticSceneDto = {
      id: tempId("scene"),
      name: `Səhnə ${scenes.length + 1}`,
      description: null,
      sortOrder: scenes.length,
      durationMs: 2000,
      startState: scene.endState.map((item) => ({ ...item })),
      endState: scene.endState.map((item) => ({ ...item })),
      ballStartState: scene.ballEndState ? { ...scene.ballEndState } : null,
      ballEndState: scene.ballEndState ? { ...scene.ballEndState } : null,
      playerActions: [],
      ballActions: [],
      annotations: []
    };
    markChanged([...scenes, next]);
    setSceneIndex(scenes.length);
    setTimeMs(0);
  }

  function duplicateScene() {
    if (!scene || totalDuration + scene.durationMs > 60000) return;
    const copy = {
      ...structuredClone(scene),
      id: tempId("scene"),
      name: `${scene.name} — Kopiya`,
      playerActions: scene.playerActions.map((item) => ({ ...item, id: tempId("action") })),
      ballActions: scene.ballActions.map((item) => ({ ...item, id: tempId("ball") })),
      annotations: scene.annotations.map((item) => ({ ...item, id: tempId("annotation") }))
    };
    const next = [...scenes];
    next.splice(sceneIndex + 1, 0, copy);
    markChanged(next);
    setSceneIndex(sceneIndex + 1);
  }

  function deleteScene() {
    if (scenes.length === 1) return setMessage("Ən azı bir səhnə olmalıdır.");
    markChanged(scenes.filter((_, index) => index !== sceneIndex));
    setSceneIndex(Math.max(0, sceneIndex - 1));
    setTimeMs(0);
  }

  function moveScene(direction: -1 | 1) {
    const target = sceneIndex + direction;
    if (target < 0 || target >= scenes.length) return;
    const next = [...scenes];
    [next[sceneIndex], next[target]] = [next[target], next[sceneIndex]];
    markChanged(next);
    setSceneIndex(target);
  }

  function addAnnotation(type: "TEXT" | "ZONE" | "CIRCLE" | "ARROW") {
    updateScene((current) => ({
      ...current,
      annotations: [...current.annotations, {
        id: tempId("annotation"),
        type,
        x: 50,
        y: 50,
        width: type === "TEXT" ? null : 20,
        height: type === "TEXT" ? null : 15,
        rotation: 0,
        label: type === "TEXT" ? "Qeyd" : type,
        description: null,
        startTimeMs: 0,
        durationMs: current.durationMs
      }]
    }));
  }

  if (!scene) return <div className="rounded-xl border p-8 text-center">Editor üçün səhnə yoxdur.</div>;
  const selectedSnapshotSlot = tactic.snapshotData.slots.find((slot) => slot.slotKey === selectedSlot);

  return (
    <div className="grid min-w-0 gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
        <Button size="sm" onClick={() => save(false)} disabled={!dirty || pending}><Save className="h-4 w-4" />Saxla</Button>
        <span className={`text-xs ${dirty ? "text-warning" : "text-success"}`}>{pending ? "Saxlanılır..." : dirty ? "Saxlanmamış dəyişiklik" : "Saxlanılıb"}</span>
        {message ? <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{message}</span> : null}
      </div>

      <div className="grid min-w-0 gap-3 xl:grid-cols-[220px_minmax(0,1fr)_250px]">
        <aside className="grid content-start gap-4 rounded-xl border bg-card p-3">
          <section>
            <h2 className="mb-2 text-sm font-semibold">Hərəkət alətləri</h2>
            <div className="grid grid-cols-2 gap-2">
              {tools.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setTool(value);
                    setSourceSlot(null);
                  }}
                  className={`rounded-md border px-2 py-2 text-xs ${tool === value ? "border-primary bg-primary/10" : ""}`}
                >
                  {toolLabel(value)}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-2 text-sm font-semibold">Annotasiya</h2>
            <div className="flex flex-wrap gap-2">
              {(["TEXT", "ZONE", "CIRCLE", "ARROW"] as const).map((value) => <Button key={value} size="sm" variant="outline" onClick={() => addAnnotation(value)}>{value}</Button>)}
            </div>
          </section>
        </aside>

        <main className="grid min-w-0 content-start gap-3">
          <TacticPitch
            snapshot={tactic.snapshotData}
            players={players}
            ball={ball}
            actions={scene.playerActions}
            annotations={scene.annotations.filter((item) =>
              timeMs >= item.startTimeMs
              && (item.durationMs === null || timeMs <= item.startTimeMs + item.durationMs)
            )}
            selectedSlotKey={selectedSlot}
            editable
            onSelectSlot={selectSlot}
            onMoveSlot={moveSlot}
          />
          <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
            <Button size="sm" variant="outline" onClick={() => { setPlaying(false); setTimeMs(0); }}><RotateCcw className="h-4 w-4" /></Button>
            <Button size="sm" onClick={() => setPlaying((value) => !value)}>{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{playing ? "Pauza" : "Oynat"}</Button>
            <input className="min-w-32 flex-1 accent-[hsl(var(--primary))]" type="range" min={0} max={scene.durationMs} step={10} value={timeMs} onChange={(event) => { setPlaying(false); setTimeMs(Number(event.target.value)); }} aria-label="Səhnə zamanı" />
            <span className="text-xs tabular-nums">{(timeMs / 1000).toFixed(1)} / {(scene.durationMs / 1000).toFixed(1)}s</span>
          </div>
        </main>

        <aside className="grid content-start gap-4 rounded-xl border bg-card p-3">
          <section>
            <h2 className="text-sm font-semibold">Seçilmiş obyekt</h2>
            {selectedSnapshotSlot ? (
              <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                <strong className="text-foreground">{selectedSnapshotSlot.assignedUser?.name ?? selectedSnapshotSlot.label}</strong>
                <span>{selectedSnapshotSlot.position ?? "Mövqesiz"}</span>
                <span>Slot: {selectedSnapshotSlot.slotKey}</span>
                <span>Alət: {toolLabel(tool)}</span>
                {sourceSlot ? <span>Ötürmə mənbəyi seçildi: {sourceSlot}</span> : null}
              </div>
            ) : <p className="mt-2 text-xs text-muted-foreground">Meydanda oyunçu seç.</p>}
          </section>
          <section>
            <h2 className="mb-2 text-sm font-semibold">Səhnə</h2>
            <Input value={scene.name} onChange={(event) => updateScene((current) => ({ ...current, name: event.target.value }))} aria-label="Səhnə adı" />
            <label className="mt-2 grid gap-1 text-xs">Müddət (ms)
              <Input type="number" min={500} max={60000} step={100} value={scene.durationMs} onChange={(event) => {
                const durationMs = Math.max(500, Number(event.target.value));
                updateScene((current) => ({
                  ...current,
                  durationMs,
                  playerActions: current.playerActions.map((action) => ({ ...action, durationMs: Math.min(action.durationMs, Math.max(0, durationMs - action.startTimeMs)) })),
                  ballActions: current.ballActions.map((action) => ({ ...action, durationMs: Math.min(action.durationMs, Math.max(0, durationMs - action.startTimeMs)) }))
                }));
                setTimeMs((value) => Math.min(value, durationMs));
              }} />
            </label>
          </section>
          <section>
            <h2 className="mb-2 text-sm font-semibold">Action-lar ({scene.playerActions.length})</h2>
            <div className="grid max-h-48 gap-1 overflow-y-auto">
              {scene.playerActions.map((action) => (
                <div key={action.id} className="flex items-center justify-between rounded border p-2 text-xs">
                  <span>{action.slotKey} · {toolLabel(action.type)}</span>
                  <button type="button" aria-label="Action-u sil" onClick={() => updateScene((current) => ({ ...current, playerActions: current.playerActions.filter((item) => item.id !== action.id) }))}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <section className="grid gap-2 rounded-xl border bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-sm">Timeline · {(totalDuration / 1000).toFixed(1)}s</strong>
          <Button size="sm" variant="outline" onClick={addScene}><Plus className="h-4 w-4" />Səhnə</Button>
          <Button size="sm" variant="outline" onClick={duplicateScene}><Copy className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" onClick={() => moveScene(-1)}><ArrowUp className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" onClick={() => moveScene(1)}><ArrowDown className="h-4 w-4" /></Button>
          <Button size="sm" variant="destructive" onClick={deleteScene}><Trash2 className="h-4 w-4" /></Button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {scenes.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { setSceneIndex(index); setTimeMs(0); setPlaying(false); }}
              className={`min-w-40 rounded-lg border p-3 text-left text-xs ${sceneIndex === index ? "border-primary bg-primary/10" : ""}`}
            >
              <strong className="block truncate">{index + 1}. {item.name}</strong>
              <span className="text-muted-foreground">{(item.durationMs / 1000).toFixed(1)}s</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function upsertPlayerState(states: ScenePlayerState[], next: ScenePlayerState) {
  return states.some((item) => item.slotKey === next.slotKey)
    ? states.map((item) => item.slotKey === next.slotKey ? next : item)
    : [...states, next];
}

function tempId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function toolLabel(tool: TacticActionType) {
  const labels: Record<TacticActionType, string> = {
    MOVE: "Hərəkət",
    RUN: "Qaçış",
    SPRINT: "Sprint",
    DRIBBLE: "Driblinq",
    PASS: "Ötürmə",
    CROSS: "Cinah ötürməsi",
    SHOT: "Zərbə",
    PRESS: "Pressinq",
    HOLD_POSITION: "Mövqedə qal",
    CUSTOM: "Xüsusi"
  };
  return labels[tool];
}
