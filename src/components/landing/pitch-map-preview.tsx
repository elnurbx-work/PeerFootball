"use client";

import { useState } from "react";
import { Building2, CalendarClock, CircleDot, Clock3, MapPin, Navigation, Radio } from "lucide-react";
import type { LandingCopy } from "./landing-data";
import { pitchMarkers } from "./landing-data";
import { cn } from "@/lib/utils";

type MarkerType = (typeof pitchMarkers)[number]["type"];

const markerIcons: Record<MarkerType, typeof MapPin> = {
  pitch: MapPin,
  live: Radio,
  match: CalendarClock,
  indoor: Building2
};

function MapMarker({ marker, visible }: { marker: (typeof pitchMarkers)[number]; visible: boolean }) {
  const Icon = markerIcons[marker.type];
  return (
    <button type="button" aria-label={marker.name} className={cn("absolute z-20 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-pitch-line shadow-lg transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring", marker.active ? "h-12 w-12 bg-accent text-accent-foreground" : marker.type === "live" ? "h-10 w-10 bg-warning text-warning-foreground" : "h-10 w-10 bg-primary text-primary-foreground", visible ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0")} style={{ left: marker.left, top: marker.top }}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      {marker.type === "live" && <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-warning opacity-30 motion-reduce:animate-none" />}
    </button>
  );
}

export function PitchMapPreview({ copy }: { copy: LandingCopy }) {
  const [filter, setFilter] = useState(0);
  const filterTypes: Array<MarkerType | null> = [null, "pitch", "match", "indoor"];

  return (
    <section id="pitches" className="landing-section bg-card">
      <div className="landing-container grid min-w-0 grid-cols-[minmax(0,1fr)] items-center gap-12 lg:grid-cols-[minmax(0,.78fr)_minmax(0,1.22fr)]">
        <div className="min-w-0 max-w-full">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">{copy.map.eyebrow}</p>
          <h2 className="mt-4 text-[clamp(2rem,9vw,4.25rem)] font-black leading-none tracking-[-0.045em] text-foreground sm:tracking-[-0.055em]">{copy.map.title}</h2>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">{copy.map.body}</p>
          <SelectedPitchCard copy={copy} />
        </div>
        <div>
          <div className="mb-4 flex max-w-full gap-2 overflow-x-auto pb-2" role="group" aria-label="Map filters">
            {copy.map.filters.map((label, index) => (
              <button key={label} type="button" aria-pressed={filter === index} onClick={() => setFilter(index)} className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", filter === index ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary")}>{label}</button>
            ))}
          </div>
          <div className="map-canvas relative min-h-[400px] overflow-hidden rounded-[1.5rem] border border-border bg-map shadow-[0_24px_80px_rgba(15,23,42,.12)] sm:min-h-[520px] sm:rounded-[1.75rem]">
            <div className="map-block map-block-one" /><div className="map-block map-block-two" /><div className="map-block map-block-three" /><div className="map-block map-block-four" />
            <div className="map-road map-road-one" /><div className="map-road map-road-two" /><div className="map-road map-road-three" />
            <div className="map-pitch left-[59%] top-[15%]"><span /></div>
            <div className="map-pitch left-[8%] top-[56%] rotate-6"><span /></div>
            <span className="absolute left-[6%] top-[8%] text-[10px] font-bold uppercase tracking-widest text-muted-foreground">North district</span>
            <span className="absolute bottom-[9%] right-[7%] text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Park quarter</span>
            {pitchMarkers.map((marker) => <MapMarker key={marker.id} marker={marker} visible={filter === 0 || marker.type === filterTypes[filter] || (filter === 2 && marker.type === "live")} />)}
            <div className="absolute bottom-3 left-3 right-3 z-30 grid grid-cols-1 gap-1.5 rounded-2xl border border-white/70 bg-card/90 p-3 text-[10px] font-semibold leading-4 text-muted-foreground shadow-lg backdrop-blur min-[360px]:grid-cols-2 sm:bottom-4 sm:left-4 sm:right-4 sm:grid-cols-4">
              {copy.map.legend.map((label, index) => <span key={label} className="flex min-w-0 items-center gap-2"><span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", index === 0 ? "bg-accent" : index === 1 ? "bg-warning" : index === 2 ? "bg-primary" : "bg-muted-foreground")} />{label}</span>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SelectedPitchCard({ copy }: { copy: LandingCopy }) {
  return (
    <article className="mt-8 rounded-[1.5rem] border border-border bg-surface-muted p-4 sm:p-5">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground"><MapPin className="h-5 w-5" /></span>
        <div className="min-w-0"><h3 className="font-bold text-foreground">Arena Football Center</h3><p className="mt-1 text-sm text-muted-foreground">{copy.map.distance}</p></div>
      </div>
      <div className="mt-5 grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 text-sm text-muted-foreground">
        <span className="flex min-w-0 items-start gap-2"><CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{copy.map.outdoor}</span>
        <span className="flex min-w-0 items-start gap-2"><CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{copy.map.surface}</span>
        <span className="flex min-w-0 items-start gap-2"><CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{copy.map.format}</span>
        <span className="flex min-w-0 items-start gap-2"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{copy.map.next}</span>
      </div>
      {/* TODO: Connect these demo controls when public pitch detail and directions routes are introduced. */}
      <div className="mt-5 flex gap-3">
        <button type="button" disabled title="Pitch pages are coming soon" className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-70">{copy.map.view}</button>
        <button type="button" disabled title="Directions are coming soon" className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-card text-muted-foreground disabled:cursor-not-allowed" aria-label={copy.map.directions}><Navigation className="h-4 w-4" /></button>
      </div>
    </article>
  );
}
