"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  Home,
  Menu,
  PlusSquare,
  Share2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Browser, Platform } from "@/lib/pwa/device-detection";

export type InstallInstructionsProps = {
  platform: Platform;
  browser: Browser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type InstallGuide = {
  title: string;
  description: string;
  steps: string[];
};

const chromiumDesktopSteps = [
  "Ünvan sətrindəki quraşdırma işarəsinə basın.",
  "Install seçimini təsdiqləyin.",
  "İşarə görünmürsə, brauzer menyusundakı Apps və ya Install PeerFootball seçimini açın."
];

export function getInstallGuide(platform: Platform, browser: Browser): InstallGuide {
  if (platform === "ios" || platform === "ipados") {
    if (browser !== "safari") {
      return {
        title: "Quraşdırmaq üçün Safari istifadə edin",
        description: "iPhone və iPad-də ana ekrana əlavə etmə Safari vasitəsilə tamamlanır.",
        steps: [
          "Bu səhifənin linkini kopyalayın və ya paylaşın.",
          "Safari-ni açın və install səhifəsinə keçin.",
          "Share düyməsinə basın.",
          "Add to Home Screen, sonra Add seçin."
        ]
      };
    }

    return {
      title: platform === "ipados" ? "iPad-də quraşdırma" : "iPhone-da quraşdırma",
      description: "PeerFootball-u Safari vasitəsilə ana ekranınıza əlavə edin.",
      steps: [
        "PeerFootball-u Safari-də açın.",
        "Aşağıdakı və ya yuxarıdakı Share düyməsinə basın.",
        "Menyudan Add to Home Screen seçin.",
        "Sağ yuxarıdan Add düyməsinə basın.",
        "PeerFootball ana ekranda tətbiq kimi görünəcək."
      ]
    };
  }

  if (platform === "android" && browser === "chrome") {
    return {
      title: "Android · Chrome",
      description: "Quraşdırma brauzerin tətbiq menyusundan da edilə bilər.",
      steps: [
        "Chrome menyusunu açın.",
        "Add to Home screen və ya Install app seçin.",
        "Install düyməsinə basın."
      ]
    };
  }

  if (platform === "android" && browser === "edge") {
    return {
      title: "Android · Edge",
      description: "Edge menyusundan telefonunuza əlavə edin.",
      steps: [
        "Edge menyusunu açın.",
        "Add to phone və ya Apps bölməsini seçin.",
        "PeerFootball-u quraşdırın."
      ]
    };
  }

  if (platform === "android" && browser === "samsung") {
    return {
      title: "Android · Samsung Internet",
      description: "Samsung Internet ana ekran qısayolunu menyudan yaradır.",
      steps: ["Brauzer menyusunu açın.", "Add page to seçin.", "Home screen seçin."]
    };
  }

  if (platform === "windows" && browser === "edge") {
    return {
      title: "Windows · Edge",
      description: "PeerFootball-u Edge tətbiqi kimi quraşdırın.",
      steps: ["Edge menyusunu açın.", "Apps seçin.", "Install PeerFootball seçimini təsdiqləyin."]
    };
  }

  if (platform === "windows" && browser === "chrome") {
    return {
      title: "Windows · Chrome",
      description: "Ünvan sətrindən və ya Chrome menyusundan quraşdırın.",
      steps: [
        "Ünvan sətrindəki quraşdırma işarəsinə basın.",
        "Install düyməsini seçin.",
        "Alternativ olaraq Chrome menyusunu açın.",
        "Cast, save and share bölməsini seçin.",
        "Install PeerFootball seçimini təsdiqləyin."
      ]
    };
  }

  if ((platform === "windows" || platform === "macos") && (browser === "chrome" || browser === "edge")) {
    return {
      title: `${platform === "macos" ? "macOS" : "Windows"} · ${browser === "edge" ? "Edge" : "Chrome"}`,
      description: "Desktop Chromium brauzerlərində ünvan sətrindən və ya menyudan quraşdırın.",
      steps: chromiumDesktopSteps
    };
  }

  if (platform === "macos" && browser === "safari") {
    return {
      title: "macOS · Safari",
      description: "Dəstəklənən Safari versiyasında saytı Dock-a əlavə edin.",
      steps: ["File menyusunu açın.", "Add to Dock seçin.", "Adı yoxlayıb Add düyməsinə basın."]
    };
  }

  return {
    title: "Manual quraşdırma",
    description: "Bu brauzerdə avtomatik quraşdırma mövcud deyil. Saytdan normal şəkildə istifadə etməyə davam edə bilərsiniz.",
    steps: [
      "Brauzerin əsas menyusunu açın.",
      "Install app, Apps və ya Add to Home Screen seçimini axtarın.",
      "Seçim yoxdursa, Chrome, Edge və ya Safari-nin son versiyasını sınayın."
    ]
  };
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
}

export function PwaInstallInstructions({
  platform,
  browser,
  open,
  onOpenChange
}: InstallInstructionsProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const guide = useMemo(() => getInstallGuide(platform, browser), [browser, platform]);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">("idle");
  const needsSafari = (platform === "ios" || platform === "ipados") && browser !== "safari";
  const canShare = typeof navigator !== "undefined" && "share" in navigator;
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const installUrl = `${configuredOrigin ?? (typeof window === "undefined" ? "" : window.location.origin)}/install`;

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = getFocusableElements(dialogRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [onOpenChange, open]);

  if (!open) return null;

  const shareOrCopy = async () => {
    setShareStatus("idle");
    try {
      if (canShare) {
        await navigator.share({
          title: "PeerFootball",
          text: "PeerFootball-u cihazına quraşdır",
          url: installUrl
        });
      } else {
        await navigator.clipboard.writeText(installUrl);
        setShareStatus("copied");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareStatus("error");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-overlay p-0 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="max-h-[88dvh] w-full overflow-y-auto rounded-t-2xl border bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-card-foreground shadow-2xl focus:outline-none sm:max-w-lg sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">Quraşdırma bələdçisi</p>
            <h2 id={titleId} className="mt-1 text-2xl font-bold">{guide.title}</h2>
          </div>
          <Button type="button" variant="ghost" className="h-11 w-11 shrink-0 px-0" aria-label="Bələdçini bağla" onClick={() => onOpenChange(false)}>
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
        <p id={descriptionId} className="mt-3 text-sm text-muted-foreground">{guide.description}</p>

        <ol className="mt-6 space-y-4">
          {guide.steps.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">{index + 1}</span>
              <span className="pt-1 text-sm leading-6">{step}</span>
            </li>
          ))}
        </ol>

        {(platform === "ios" || platform === "ipados") && browser === "safari" ? (
          <div className="mt-6 grid grid-cols-3 gap-2 rounded-xl bg-muted p-3 text-center text-xs text-muted-foreground" aria-hidden="true">
            <span className="grid gap-2"><Share2 className="mx-auto h-5 w-5 text-primary" />Share</span>
            <span className="grid gap-2"><PlusSquare className="mx-auto h-5 w-5 text-primary" />Add</span>
            <span className="grid gap-2"><Home className="mx-auto h-5 w-5 text-primary" />Home Screen</span>
          </div>
        ) : null}

        {needsSafari ? (
          <div className="mt-6">
            <p className="mb-2 truncate rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground" title={installUrl}>{installUrl}</p>
            <Button type="button" variant="secondary" className="w-full" onClick={shareOrCopy}>
              {canShare ? <Share2 className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {canShare ? "Linki paylaş" : "Linki kopyala"}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground" aria-live="polite">
              {shareStatus === "copied" ? <><Check className="mr-1 inline h-3.5 w-3.5" />Link kopyalandı.</> : null}
              {shareStatus === "error" ? "Link paylaşılmadı. Ünvan sətrindən manual kopyalayın." : null}
            </p>
          </div>
        ) : null}

        <div className="mt-6 flex items-center gap-2 rounded-lg border p-3 text-xs text-muted-foreground">
          <Menu className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          Menyu adları brauzerin dilinə və versiyasına görə fərqlənə bilər.
        </div>
      </div>
    </div>
  );
}
