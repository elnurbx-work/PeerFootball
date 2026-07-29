"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, Pause, Play, RotateCcw, Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TacticPitch } from "@/components/tactics/tactic-pitch";
import {
  calculateBallState,
  calculatePlayerState,
  getSceneAtTime,
  getTacticDuration
} from "@/lib/tactics/engine";
import type { TacticDetailDto } from "@/types/tactic.types";

const speeds = [0.5, 0.75, 1, 1.5, 2] as const;

export function TacticViewer({ tactic }: { tactic: TacticDetailDto }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const [timeMs, setTimeMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [showNames, setShowNames] = useState(true);
  const [showNumbers, setShowNumbers] = useState(true);
  const [showArrows, setShowArrows] = useState(true);
  const durationMs = getTacticDuration(tactic.scenes);
  const current = useMemo(() => getSceneAtTime(tactic.scenes, timeMs), [tactic.scenes, timeMs]);
  const players = current ? calculatePlayerState(current.scene, current.localTimeMs) : [];
  const ball = current ? calculateBallState(current.scene, current.localTimeMs, players) : null;

  const tick = useCallback((timestamp: number) => {
    const last = lastFrameRef.current ?? timestamp;
    const delta = (timestamp - last) * speed;
    lastFrameRef.current = timestamp;
    setTimeMs((currentTime) => {
      const next = currentTime + delta;
      if (next < durationMs) return next;
      if (loop) return 0;
      setPlaying(false);
      return durationMs;
    });
    frameRef.current = requestAnimationFrame(tick);
  }, [durationMs, loop, speed]);

  useEffect(() => {
    if (!playing) {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      lastFrameRef.current = null;
      return;
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [playing, tick]);

  function jumpScene(direction: -1 | 1) {
    const index = current ? tactic.scenes.findIndex((scene) => scene.id === current.scene.id) : 0;
    const target = Math.max(0, Math.min(tactic.scenes.length - 1, index + direction));
    setTimeMs(sceneOffset(tactic.scenes, target));
  }

  return (
    <div ref={rootRef} className="grid gap-4 rounded-xl border bg-card p-3 sm:p-5">
      {current ? (
        <TacticPitch
          snapshot={tactic.snapshotData}
          players={players}
          ball={ball}
          actions={current.scene.playerActions}
          annotations={current.scene.annotations.filter((item) =>
            current.localTimeMs >= item.startTimeMs
            && (item.durationMs === null || current.localTimeMs <= item.startTimeMs + item.durationMs)
          )}
          showNames={showNames}
          showNumbers={showNumbers}
          showArrows={showArrows}
        />
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center rounded-xl border bg-secondary text-sm text-muted-foreground">Səhnə yoxdur.</div>
      )}

      <div className="grid gap-3">
        <input
          type="range"
          min={0}
          max={Math.max(1, durationMs)}
          step={10}
          value={Math.min(timeMs, durationMs)}
          onChange={(event) => {
            setPlaying(false);
            setTimeMs(Number(event.target.value));
          }}
          aria-label="Taktika zamanı"
          className="w-full accent-[hsl(var(--primary))]"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setTimeMs(0)} aria-label="Yenidən başlat"><RotateCcw className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" onClick={() => jumpScene(-1)} aria-label="Əvvəlki səhnə"><ChevronLeft className="h-4 w-4" /></Button>
          <Button size="sm" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Pauza" : "Oynat"}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? "Pauza" : "Oynat"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => jumpScene(1)} aria-label="Növbəti səhnə"><ChevronRight className="h-4 w-4" /></Button>
          <Button size="sm" variant={loop ? "secondary" : "outline"} onClick={() => setLoop((value) => !value)} aria-pressed={loop}><Repeat2 className="h-4 w-4" />Loop</Button>
          <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))} className="h-9 rounded-md border bg-background px-2 text-sm" aria-label="Animasiya sürəti">
            {speeds.map((value) => <option key={value} value={value}>{value}x</option>)}
          </select>
          <Button size="sm" variant="outline" onClick={() => rootRef.current?.requestFullscreen()} aria-label="Tam ekran"><Expand className="h-4 w-4" /></Button>
          <span className="ml-auto text-xs tabular-nums text-muted-foreground">{formatMs(timeMs)} / {formatMs(durationMs)}</span>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <Toggle label="Adlar" value={showNames} onChange={setShowNames} />
          <Toggle label="Nömrələr" value={showNumbers} onChange={setShowNumbers} />
          <Toggle label="Oxlar" value={showArrows} onChange={setShowArrows} />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tactic.scenes.map((scene, index) => {
          const active = current?.scene.id === scene.id;
          return (
            <button
              key={scene.id}
              type="button"
              onClick={() => setTimeMs(sceneOffset(tactic.scenes, index))}
              className={`min-w-36 rounded-lg border p-3 text-left text-xs ${active ? "border-primary bg-primary/10" : "bg-background"}`}
            >
              <strong className="block truncate">{index + 1}. {scene.name}</strong>
              <span className="text-muted-foreground">{formatMs(scene.durationMs)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center gap-1.5"><input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}

function sceneOffset(scenes: TacticDetailDto["scenes"], index: number) {
  return scenes.slice(0, index).reduce((sum, scene) => sum + scene.durationMs, 0);
}

function formatMs(value: number) {
  return `${(value / 1000).toFixed(1)}s`;
}
