import { cn } from "@/lib/utils";

export function BrandMark({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label="PeerFootball">
      <span className={cn("relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl", inverse ? "bg-lime-400" : "bg-emerald-700")}>
        <span className={cn("h-4 w-4 rounded-full border-[3px]", inverse ? "border-emerald-950" : "border-white")} />
        <span className={cn("absolute -bottom-2 h-5 w-0.5", inverse ? "bg-emerald-950/40" : "bg-white/40")} />
      </span>
      {!compact && <span className={cn("text-lg font-black tracking-[-0.04em]", inverse ? "text-white" : "text-slate-950")}>PeerFootball</span>}
    </span>
  );
}
