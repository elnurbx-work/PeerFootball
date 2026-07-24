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
    <button type="button" aria-label={marker.name} className={cn("absolute z-20 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white shadow-lg transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300", marker.active ? "h-12 w-12 bg-lime-400 text-emerald-950" : marker.type === "live" ? "h-10 w-10 bg-orange-500 text-white" : "h-10 w-10 bg-emerald-800 text-white", visible ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0")} style={{ left: marker.left, top: marker.top }}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      {marker.type === "live" && <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-orange-400 opacity-30 motion-reduce:animate-none" />}
    </button>
  );
}

export function PitchMapPreview({ copy }: { copy: LandingCopy }) {
  const [filter, setFilter] = useState(0);
  const filterTypes: Array<MarkerType | null> = [null, "pitch", "match", "indoor"];

  return (
    <section id="pitches" className="landing-section bg-white">
      <div className="landing-container grid items-center gap-12 lg:grid-cols-[.78fr_1.22fr]">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">{copy.map.eyebrow}</p>
          <h2 className="mt-4 text-[clamp(2.25rem,5vw,4.25rem)] font-black leading-none tracking-[-0.055em] text-slate-950">{copy.map.title}</h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">{copy.map.body}</p>
          <SelectedPitchCard copy={copy} />
        </div>
        <div>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Map filters">
            {copy.map.filters.map((label, index) => (
              <button key={label} type="button" aria-pressed={filter === index} onClick={() => setFilter(index)} className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700", filter === index ? "border-emerald-800 bg-emerald-800 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-500")}>{label}</button>
            ))}
          </div>
          <div className="map-canvas relative min-h-[420px] overflow-hidden rounded-[1.75rem] border border-emerald-950/10 bg-[#e6eadc] shadow-[0_24px_80px_rgba(15,23,42,.12)] sm:min-h-[520px]">
            <div className="map-block map-block-one" /><div className="map-block map-block-two" /><div className="map-block map-block-three" /><div className="map-block map-block-four" />
            <div className="map-road map-road-one" /><div className="map-road map-road-two" /><div className="map-road map-road-three" />
            <div className="map-pitch left-[59%] top-[15%]"><span /></div>
            <div className="map-pitch left-[8%] top-[56%] rotate-6"><span /></div>
            <span className="absolute left-[6%] top-[8%] text-[10px] font-bold uppercase tracking-widest text-slate-500">North district</span>
            <span className="absolute bottom-[9%] right-[7%] text-[10px] font-bold uppercase tracking-widest text-slate-500">Park quarter</span>
            {pitchMarkers.map((marker) => <MapMarker key={marker.id} marker={marker} visible={filter === 0 || marker.type === filterTypes[filter] || (filter === 2 && marker.type === "live")} />)}
            <div className="absolute bottom-4 left-4 right-4 z-30 grid grid-cols-2 gap-2 rounded-2xl border border-white/70 bg-white/90 p-3 text-[10px] font-semibold text-slate-600 shadow-lg backdrop-blur sm:grid-cols-4">
              {copy.map.legend.map((label, index) => <span key={label} className="flex items-center gap-2"><span className={cn("h-2.5 w-2.5 rounded-full", index === 0 ? "bg-lime-500" : index === 1 ? "bg-orange-500" : index === 2 ? "bg-emerald-800" : "bg-slate-700")} />{label}</span>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SelectedPitchCard({ copy }: { copy: LandingCopy }) {
  return (
    <article className="mt-8 rounded-[1.5rem] border border-slate-200 bg-[#f7f8f3] p-5">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-800 text-white"><MapPin className="h-5 w-5" /></span>
        <div><h3 className="font-bold text-slate-950">Arena Football Center</h3><p className="mt-1 text-sm text-slate-500">{copy.map.distance}</p></div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-600">
        <span className="flex items-center gap-2"><CircleDot className="h-4 w-4 text-emerald-700" />{copy.map.outdoor}</span>
        <span className="flex items-center gap-2"><CircleDot className="h-4 w-4 text-emerald-700" />{copy.map.surface}</span>
        <span className="flex items-center gap-2"><CircleDot className="h-4 w-4 text-emerald-700" />{copy.map.format}</span>
        <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-emerald-700" />{copy.map.next}</span>
      </div>
      {/* TODO: Connect these demo controls when public pitch detail and directions routes are introduced. */}
      <div className="mt-5 flex gap-3">
        <button type="button" disabled title="Pitch pages are coming soon" className="flex-1 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70">{copy.map.view}</button>
        <button type="button" disabled title="Directions are coming soon" className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 disabled:cursor-not-allowed" aria-label={copy.map.directions}><Navigation className="h-4 w-4" /></button>
      </div>
    </article>
  );
}
