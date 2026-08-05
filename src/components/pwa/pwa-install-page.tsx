"use client";

import { useCallback, useEffect, useRef, useState, type ElementType } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ExternalLink,
  Gauge,
  Maximize2,
  ShieldCheck,
  Smartphone,
  Zap
} from "lucide-react";
import { BrandMark } from "@/components/landing/brand-mark";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import {
  PwaInstallInstructions,
  getInstallGuide
} from "@/components/pwa/pwa-install-instructions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCookieConsent } from "@/lib/ads/use-ad-consent";
import { usePwaInstall, type PwaInstallResult } from "@/hooks/use-pwa-install";
import type { Browser, Platform } from "@/lib/pwa/device-detection";

const platformLabels: Record<Platform, string> = {
  android: "Android",
  ios: "iPhone",
  ipados: "iPad",
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
  unknown: "Naməlum cihaz"
};

const browserLabels: Record<Browser, string> = {
  chrome: "Chrome",
  edge: "Edge",
  samsung: "Samsung Internet",
  safari: "Safari",
  firefox: "Firefox",
  opera: "Opera",
  unknown: "Naməlum brauzer"
};

const benefits: Array<{ title: string; description: string; icon: ElementType }> = [
  { title: "Sürətli giriş", description: "Ana ekrandan bir toxunuşla PeerFootball-u aç.", icon: Zap },
  { title: "Tam ekran təcrübəsi", description: "Brauzer elementləri olmadan tətbiq görünüşündə istifadə et.", icon: Maximize2 },
  { title: "Bildirişlər", description: "Yeni mesajlar və oyun yenilikləri haqqında xəbərdar ol.", icon: Bell },
  { title: "Həmişə əlçatan", description: "PeerFootball cihazındakı digər tətbiqlər kimi görünsün.", icon: Smartphone }
];

const alternativeGuides: Array<{ platform: Platform; browser: Browser }> = [
  { platform: "android", browser: "chrome" },
  { platform: "android", browser: "edge" },
  { platform: "android", browser: "samsung" },
  { platform: "ios", browser: "safari" },
  { platform: "ipados", browser: "safari" },
  { platform: "windows", browser: "chrome" },
  { platform: "windows", browser: "edge" },
  { platform: "macos", browser: "chrome" },
  { platform: "macos", browser: "edge" },
  { platform: "macos", browser: "safari" }
];

function getStatusMessage(state: ReturnType<typeof usePwaInstall>) {
  if (state.isInstalled) return "PeerFootball artıq tətbiq rejimində işləyir";
  if (state.isInstallable) return "Bu cihaz PeerFootball-u tətbiq kimi quraşdırmağı dəstəkləyir.";
  if (state.platform === "ios" || state.platform === "ipados") {
    return "iPhone və iPad-də tətbiq Safari vasitəsilə ana ekrana əlavə edilir";
  }
  return "Bu brauzer hazırda birbaşa quraşdırma düyməsini təqdim etmir.";
}

export function PwaInstallPage() {
  const installState = usePwaInstall();
  const consent = useCookieConsent();
  const [guideOpen, setGuideOpen] = useState(false);
  const tracked = useRef(new Set<string>());

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
    if (installState.isInstallable) trackOnce("pwa_install_prompt_available");
    if (installState.isInstalled) trackOnce("pwa_install_already_installed");
  }, [installState.isReady, installState.isInstallable, installState.isInstalled, trackOnce]);

  const openGuide = () => {
    setGuideOpen(true);
    trackOnce("pwa_install_clicked");
    trackOnce("pwa_install_manual_guide_opened");
  };

  const handleInstallResult = (result: PwaInstallResult) => {
    trackOnce("pwa_install_clicked");
    if (result === "accepted") trackOnce("pwa_install_accepted");
    if (result === "dismissed") trackOnce("pwa_install_dismissed");
  };

  if (!installState.isReady) {
    return <InstallPageSkeleton />;
  }

  const currentGuide = getInstallGuide(installState.platform, installState.browser);
  const badge = `${platformLabels[installState.platform]} · ${browserLabels[installState.browser]}`;

  return (
    <main className="min-h-screen overflow-hidden">
      <section className="relative border-b bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-center lg:px-8 lg:py-20">
          <div>
            <Link href="/" className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <BrandMark />
            </Link>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
              {badge}
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.08] tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
              PeerFootball-u cihazına yüklə
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              PeerFootball-u tətbiq kimi quraşdıraraq oyunlara, klublara, mesajlara və bildirişlərə daha sürətli çat.
            </p>
            <div className="mt-7">
              <PwaInstallButton
                installState={installState}
                onManualGuide={openGuide}
                onInstallResult={handleInstallResult}
              />
            </div>
            {installState.installError ? (
              <div className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm" role="alert">
                <p className="font-semibold">Quraşdırma pəncərəsi açıla bilmədi.</p>
                <p className="mt-1 text-muted-foreground">Brauzer menyusundakı “Install app” seçimini yoxlayın.</p>
              </div>
            ) : null}
          </div>

          <Card className="relative overflow-hidden p-5 sm:p-6" aria-live="polite">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                {installState.isInstalled ? <CheckCircle2 className="h-6 w-6" aria-hidden="true" /> : <Gauge className="h-6 w-6" aria-hidden="true" />}
              </span>
              <div>
                <p className="text-sm font-semibold text-primary">Quraşdırma statusu</p>
                <h2 className="mt-1 text-xl font-bold">
                  {installState.isInstalled
                    ? "PeerFootball artıq bu cihazda quraşdırılıb"
                    : installState.isInstallable
                      ? "Quraşdırmağa hazırdır"
                      : installState.platform === "ios" || installState.platform === "ipados"
                        ? "Safari vasitəsilə ana ekrana əlavə edin"
                        : "Manual quraşdırma məlumatı"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{getStatusMessage(installState)}</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              Quraşdırma pulsuzdur və hesab məlumatlarınız mövcud təhlükəsizlik qaydaları ilə qorunur.
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20" aria-labelledby="benefits-title">
        <h2 id="benefits-title" className="text-3xl font-bold tracking-tight">Tətbiq kimi daha rahatdır</h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <Card key={benefit.title} className="p-5">
              <benefit.icon className="h-6 w-6 text-primary" aria-hidden="true" />
              <h3 className="mt-4 font-bold">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{benefit.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y bg-surface-muted/60">
        <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <p className="text-sm font-semibold text-primary">Sizin cihazınız</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">Quraşdırma addımları</h2>
          <Card className="mt-7 p-5 sm:p-6">
            <h3 className="text-xl font-bold">{currentGuide.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{currentGuide.description}</p>
            <ol className="mt-5 space-y-3">
              {currentGuide.steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-6">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-primary">{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </Card>

          <div className="mt-8">
            <h3 className="text-lg font-bold">Digər platformalar</h3>
            <div className="mt-3 grid gap-2">
              {alternativeGuides
                .filter((item) => item.platform !== installState.platform || item.browser !== installState.browser)
                .map((item) => {
                  const guide = getInstallGuide(item.platform, item.browser);
                  return (
                    <details key={`${item.platform}-${item.browser}`} className="group rounded-lg border bg-card">
                      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                        {guide.title}
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
                      </summary>
                      <ol className="space-y-2 border-t px-4 py-4 text-sm text-muted-foreground">
                        {guide.steps.map((step, index) => <li key={step}>{index + 1}. {step}</li>)}
                      </ol>
                    </details>
                  );
                })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20" aria-labelledby="troubleshooting-title">
        <div className="flex gap-4">
          <CircleHelp className="mt-1 h-7 w-7 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 id="troubleshooting-title" className="text-2xl font-bold">Quraşdırma düyməsi görünmür?</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              <p>Brauzeri yeniləyin, səhifəni təhlükəsiz HTTPS ünvanında açdığınıza əmin olun və brauzer menyusundakı Install app, Apps və ya Add to Home Screen seçimini yoxlayın.</p>
              <p>Tətbiq artıq quraşdırılıbsa brauzer prompt-u yenidən göstərməyə bilər. Korporativ cihaz siyasətləri və bəzi daxili brauzerlər də quraşdırmanı məhdudlaşdıra bilər.</p>
              <p>Quraşdırma mümkün olmasa belə PeerFootball saytından normal istifadə edə bilərsiniz. Bəzi funksiyalar internet bağlantısı tələb edir.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6 lg:px-8">
          <Button asChild variant="outline"><Link href="/feed">Feed-ə qayıt</Link></Button>
          <Button asChild><Link href="/"><span>PeerFootball-a davam et</span><ExternalLink className="h-4 w-4" aria-hidden="true" /></Link></Button>
        </div>
      </footer>

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
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8" aria-busy="true" aria-label="Cihaz məlumatı yoxlanılır">
      <div className="h-9 w-48 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
      <div className="mt-16 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="h-8 w-40 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
          <div className="mt-5 h-28 max-w-xl animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
          <div className="mt-5 h-16 max-w-lg animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
      </div>
    </main>
  );
}
