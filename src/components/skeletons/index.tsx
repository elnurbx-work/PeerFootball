import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function LoadingRegion({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn("min-w-0 animate-pulse", className)}
    >
      <span className="sr-only">Məlumatlar yüklənir</span>
      {children}
    </div>
  );
}

function Block({ className }: { className?: string }) {
  return <div className={cn("rounded-md bg-muted", className)} />;
}

export function PageShellSkeleton() {
  return (
    <LoadingRegion className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-8 sm:py-10">
      <Block className="h-9 w-56 max-w-full" />
      <Block className="h-5 w-80 max-w-full" />
      <Block className="h-52 w-full border bg-card" />
    </LoadingRegion>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="min-w-0 space-y-4 overflow-hidden rounded-md border bg-card p-4 sm:p-5">
      <div className="flex min-w-0 gap-3">
        <Block className="h-11 w-11 shrink-0 rounded-full" />
        <div className="grid min-w-0 flex-1 gap-2">
          <Block className="h-4 w-36 max-w-full" />
          <Block className="h-3 w-24 max-w-full" />
        </div>
      </div>
      <Block className="h-4 w-full" />
      <Block className="h-4 w-4/5" />
      <Block className="h-44 w-full sm:h-56" />
      <div className="flex gap-2 border-t pt-3">
        <Block className="h-8 w-16" />
        <Block className="h-8 w-16" />
        <Block className="h-8 w-16" />
      </div>
    </div>
  );
}

export function PostListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <LoadingRegion className="grid w-full min-w-0 gap-5">
      {Array.from({ length: count }, (_, index) => (
        <PostCardSkeleton key={index} />
      ))}
    </LoadingRegion>
  );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <LoadingRegion className="mx-auto grid w-full max-w-3xl gap-5 px-4 py-8 sm:py-10">
      <div className="grid gap-2">
        <Block className="h-9 w-40 max-w-full" />
        <Block className="h-4 w-72 max-w-full" />
      </div>
      {Array.from({ length: count }, (_, index) => (
        <PostCardSkeleton key={index} />
      ))}
    </LoadingRegion>
  );
}

export function ProfileSkeleton() {
  return (
    <LoadingRegion className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-8 sm:py-10">
      <div className="overflow-hidden rounded-md border bg-card">
        <Block className="h-40 w-full rounded-none sm:h-48" />
        <div className="relative grid min-w-0 gap-6 p-4 pt-0 sm:p-6 sm:pt-0 md:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-5">
            <div className="-mt-10 flex min-w-0 items-end gap-3 sm:-mt-12 sm:gap-4">
              <Block className="h-24 w-24 shrink-0 rounded-full border-4 border-card sm:h-28 sm:w-28" />
              <div className="grid min-w-0 flex-1 gap-2 pb-2">
                <Block className="h-7 w-32 max-w-full sm:w-48" />
                <Block className="h-4 w-24 max-w-full sm:w-28" />
              </div>
            </div>
            <Block className="h-4 w-full" />
            <Block className="h-4 w-4/5" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Block className="h-10 w-full" />
              <Block className="h-10 w-full" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Block className="h-16 w-full" />
              <Block className="h-16 w-full" />
            </div>
          </div>
          <div className="grid content-start gap-3">
            <Block className="h-32 w-full border bg-background" />
            <Block className="h-14 w-full border bg-background" />
          </div>
        </div>
      </div>
      <Block className="h-36 w-full border bg-card" />
      <div className="mx-auto grid w-full min-w-0 max-w-3xl gap-5">
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    </LoadingRegion>
  );
}

export function DirectInboxSkeleton() {
  return (
    <LoadingRegion className="grid h-[calc(100dvh-5rem)] grid-cols-1 overflow-hidden md:h-screen md:grid-cols-[320px_1fr]">
      <div className="grid content-start gap-3 border-r p-4">
        <Block className="h-9 w-40" />
        {Array.from({ length: 6 }, (_, index) => <Block key={index} className="h-16 w-full" />)}
      </div>
      <div className="hidden content-between p-5 md:grid">
        <Block className="h-16 w-full" />
        <div className="grid gap-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Block key={index} className={cn("h-10", index % 2 ? "ml-auto w-1/2" : "w-2/3")} />
          ))}
        </div>
        <Block className="h-12 w-full" />
      </div>
    </LoadingRegion>
  );
}

export function MatchListSkeleton() {
  return (
    <LoadingRegion className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8">
      <Block className="h-9 w-48 max-w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => <Block key={index} className="h-44 border bg-card" />)}
      </div>
    </LoadingRegion>
  );
}

export function MatchDetailSkeleton() {
  return (
    <LoadingRegion className="mx-auto grid w-full max-w-[1500px] gap-6 px-4 py-8">
      <Block className="h-10 w-52 max-w-full" />
      <Block className="h-56 w-full border bg-card" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Block className="h-80 border bg-card" />
        <Block className="h-80 border bg-card" />
      </div>
    </LoadingRegion>
  );
}

export function ClubSkeleton() {
  return (
    <LoadingRegion className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:py-10">
      <Block className="h-48 w-full" />
      <div className="flex min-w-0 gap-4">
        <Block className="h-24 w-24 shrink-0 rounded-full" />
        <div className="grid min-w-0 flex-1 gap-2">
          <Block className="h-8 w-56 max-w-full" />
          <Block className="h-4 w-36 max-w-full" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Block className="h-52 border bg-card" />
        <Block className="h-52 border bg-card" />
      </div>
    </LoadingRegion>
  );
}

export function NotificationListSkeleton() {
  return (
    <LoadingRegion className="mx-auto grid w-full max-w-3xl gap-5 px-4 py-8 sm:py-10">
      <Block className="h-9 w-52 max-w-full" />
      <div className="rounded-md border bg-card">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="flex min-w-0 gap-3 border-b p-4 last:border-0">
            <Block className="h-10 w-10 shrink-0 rounded-full" />
            <div className="grid min-w-0 flex-1 gap-2">
              <Block className="h-4 w-4/5" />
              <Block className="h-3 w-24 max-w-full" />
            </div>
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

export function AdminTableSkeleton() {
  return (
    <LoadingRegion className="min-h-screen bg-slate-950 px-4 py-8 sm:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-5">
        <Block className="h-10 w-72 max-w-full bg-slate-800" />
        {Array.from({ length: 6 }, (_, index) => (
          <Block key={index} className="h-36 border border-slate-800 bg-slate-900" />
        ))}
      </div>
    </LoadingRegion>
  );
}
