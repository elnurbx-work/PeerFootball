import { Heart, MapPin, MessageCircle, Repeat2, UsersRound } from "lucide-react";
import type { LandingCopy } from "./landing-data";
import { SectionHeading } from "./section-heading";

function Actions({ copy, likes, comments }: { copy: LandingCopy; likes: number; comments: number }) {
  return <div className="flex items-center gap-5 border-t border-slate-200 pt-3 text-xs font-semibold text-slate-500"><span className="flex items-center gap-1.5"><Heart className="h-4 w-4" />{likes} {copy.community.likes}</span><span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4" />{comments} {copy.community.comments}</span><span className="ml-auto flex items-center gap-1.5"><Repeat2 className="h-4 w-4" />{copy.community.repost}</span></div>;
}

export function CommunityPreviewSection({ copy }: { copy: LandingCopy }) {
  return (
    <section className="landing-section bg-[#f5f5ee]">
      <div className="landing-container">
        <SectionHeading eyebrow={copy.community.eyebrow} title={copy.community.title} body={copy.community.body} />
        <div className="mt-12 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white">
            <PostHead initials="FFC" name="Falcons FC" meta={`${copy.community.now} · Arena Football Center`} />
            <div className="relative mx-4 aspect-[16/9] overflow-hidden rounded-2xl bg-[#0b2117] sm:mx-6">
              <div className="absolute inset-[9%] border border-white/25"><span className="absolute left-1/2 top-0 h-full border-l border-white/20" /></div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 pt-20 text-white"><p className="text-xs font-bold uppercase tracking-wider text-lime-400">Full time</p><p className="mt-1 text-3xl font-black">FALCONS 4—2 NORTHSIDE</p></div>
            </div>
            <div className="p-4 sm:p-6"><p className="mb-4 leading-7 text-slate-700">{copy.community.result}</p><Actions copy={copy} likes={84} comments={12} /></div>
          </article>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <PostHead compact initials="PU" name="Park United" meta={`${copy.community.hour} · Central Park`} />
              <div className="my-5 flex min-h-28 items-center gap-4 rounded-2xl bg-emerald-50 p-5 text-emerald-950"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-800 text-white"><UsersRound /></span><p className="font-bold leading-6">{copy.community.invite}</p></div>
              <Actions copy={copy} likes={21} comments={8} />
            </article>
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <PostHead compact initials="MA" name="Mika Aliyev" meta={`${copy.community.yesterday} · Riverside`} />
              <div className="relative my-5 min-h-28 overflow-hidden rounded-2xl bg-gradient-to-br from-orange-200 via-emerald-200 to-emerald-800 p-5"><span className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-bold text-white">00:18 highlight</span></div>
              <p className="mb-4 text-sm text-slate-700">{copy.community.highlight}</p>
              <Actions copy={copy} likes={46} comments={5} />
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

function PostHead({ initials, name, meta, compact = false }: { initials: string; name: string; meta: string; compact?: boolean }) {
  return <div className={compact ? "flex items-center gap-3" : "flex items-center gap-3 p-4 sm:p-6"}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-800 text-xs font-black text-white">{initials}</span><div className="min-w-0"><h3 className="font-bold text-slate-950">{name}</h3><p className="flex items-center gap-1 truncate text-xs text-slate-500"><MapPin className="h-3 w-3" />{meta}</p></div></div>;
}
