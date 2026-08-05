"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { CheckCircle2, ShieldCheck, Smartphone, Zap } from "lucide-react";
import { BrandMark } from "@/components/landing/brand-mark";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import { PwaInstallInstructions } from "@/components/pwa/pwa-install-instructions";
import { useCookieConsent } from "@/lib/ads/use-ad-consent";
import { usePwaInstall, type PwaInstallResult } from "@/hooks/use-pwa-install";

export function PwaInstallPage() {
  const installState = usePwaInstall();
  const consent = useCookieConsent();
  const [guideOpen, setGuideOpen] = useState(false);
  const tracked = useRef(new Set<string>());
  const isAppleMobile = installState.platform === "ios" || installState.platform === "ipados";

  const trackOnce = useCallback((eventName: string) => {
    if (!consent?.analytics || tracked.current.has(eventName)) return;
    tracked.current.add(eventName);
    track(eventName, {
      platform: installState.platform,
      browser: installState.browser
    });
  }, [consent?.analytics, installState.browser, installState.platform]);

  useEffect(() => {
    if (!installState.isReady) return;
    trackOnce("pwa_install_page_viewed");
    if (installState.canInstall) trackOnce("pwa_install_prompt_available");
    if (installState.isInstalled) trackOnce("pwa_install_already_installed");
  }, [installState.canInstall, installState.isInstalled, installState.isReady, trackOnce]);

  const openGuide = () => {
    setGuideOpen(true);
    trackOnce("pwa_install_manual_guide_opened");
  };

  const handleInstallResult = (result: PwaInstallResult) => {
    trackOnce("pwa_install_clicked");
    if (result === "accepted") trackOnce("pwa_install_accepted");
    if (result === "dismissed") trackOnce("pwa_install_dismissed");
  };

  if (!installState.isReady) return <InstallPageSkeleton />;

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
      <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative w-full max-w-3xl">
        <Link href="/" className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <BrandMark />
        </Link>

        <div className="mt-8 rounded-2xl border bg-card p-6 shadow-xl shadow-foreground/[0.05] sm:p-10">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
            {installState.isInstalled ? (
              <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
            ) : (
              <Smartphone className="h-7 w-7" aria-hidden="true" />
            )}
          </div>

          <h1 className="mt-7 text-4xl font-black leading-[1.08] tracking-[-0.04em] sm:text-5xl">
            PeerFootball-u cihazına yüklə
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Oyunlara, klublara, mesajlara və bildirişlərə daha sürətli çat.
          </p>

          <div className="mt-8">
            <PwaInstallButton
              installState={installState}
              onManualGuide={openGuide}
              onInstallResult={handleInstallResult}
            />
          </div>

          <div className="mt-5 text-sm leading-6 text-muted-foreground" aria-live="polite">
            {installState.isInstalled ? (
              <p className="font-semibold text-success">PeerFootball quraşdırıldı</p>
            ) : installState.canInstall ? (
              <p>{installState.browser === "chrome" ? "Chrome" : "Brauzer"} quraşdırmaya hazırdır. Düyməyə basdıqda native install pəncərəsi birbaşa açılacaq.</p>
            ) : isAppleMobile ? (
              <p>iPhone və iPad-də tətbiq Share → Add to Home Screen vasitəsilə əlavə edilir.</p>
            ) : (
              <p>PeerFootball-u birbaşa quraşdırmaq bu brauzerdə hazırda mümkün deyil.</p>
            )}

            {installState.lastResult === "dismissed" ? (
              <p className="mt-3">Quraşdırma tamamlanmadı. Chrome yenidən icazə verdikdə düymə görünəcək.</p>
            ) : null}

            {installState.installError ? (
              <div className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-foreground" role="alert">
                <p className="font-semibold">Quraşdırma pəncərəsi açıla bilmədi.</p>
                <p className="mt-1 text-muted-foreground">Chrome quraşdırmaya yenidən icazə verdikdə düymə görünəcək.</p>
              </div>
            ) : null}
          </div>

          <ul className="mt-8 grid gap-3 border-t pt-6 text-sm text-muted-foreground sm:grid-cols-2">
            <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary" aria-hidden="true" />Ana ekrandan sürətli giriş</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />Pulsuz və təhlükəsiz quraşdırma</li>
          </ul>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/feed" className="rounded-sm underline hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            PeerFootball-a brauzerdə davam et
          </Link>
        </p>
      </div>

      <PwaInstallInstructions
        platform={installState.platform}
        browser={installState.browser}
        open={guideOpen}
        onOpenChange={setGuideOpen}
      />
    </main>
  );
}

function InstallPageSkeleton() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10 sm:px-6" aria-busy="true" aria-label="Quraşdırma imkanları yoxlanılır">
      <div className="h-9 w-48 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
      <div className="mt-8 h-[28rem] animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
    </main>
  );
}
