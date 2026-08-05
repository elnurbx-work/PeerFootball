"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, Download, LoaderCircle, MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PwaInstallInstructions } from "@/components/pwa/pwa-install-instructions";
import { usePwaInstall, type PwaInstallResult, type PwaInstallState } from "@/hooks/use-pwa-install";
import { getPwaCtaMode } from "@/lib/pwa/install-cta";
import { cn } from "@/lib/utils";

export type PwaInstallButtonProps = {
  variant?: "default" | "compact";
  className?: string;
  showInstalledState?: boolean;
  installState?: PwaInstallState;
  onManualGuide?: () => void;
  onInstallResult?: (result: PwaInstallResult) => void;
};

export function PwaInstallButton(props: PwaInstallButtonProps) {
  if (props.installState) {
    return <PwaInstallButtonContent {...props} installState={props.installState} />;
  }

  return <StandalonePwaInstallButton {...props} />;
}

function StandalonePwaInstallButton(props: PwaInstallButtonProps) {
  const installState = usePwaInstall();
  const [guideOpen, setGuideOpen] = useState(false);
  const openGuide = props.onManualGuide ?? (() => setGuideOpen(true));

  return (
    <>
      <PwaInstallButtonContent {...props} installState={installState} onManualGuide={openGuide} />
      {!props.onManualGuide ? (
        <PwaInstallInstructions
          platform={installState.platform}
          browser={installState.browser}
          open={guideOpen}
          onOpenChange={setGuideOpen}
        />
      ) : null}
    </>
  );
}

function PwaInstallButtonContent({
  variant = "default",
  className,
  showInstalledState = true,
  installState,
  onManualGuide,
  onInstallResult
}: PwaInstallButtonProps & { installState: PwaInstallState }) {
  const ctaMode = getPwaCtaMode(installState);

  if (ctaMode === "loading") {
    return <div className={cn("h-11 animate-pulse rounded-md bg-muted", variant === "compact" ? "w-36" : "w-full sm:w-64", className)} aria-hidden="true" />;
  }

  if (ctaMode === "installed") {
    if (!showInstalledState) return null;
    return (
      <Button asChild size={variant === "compact" ? "md" : "lg"} className={className}>
        <Link href="/feed">
          PeerFootball-a keç
          <MoveRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    );
  }

  if (ctaMode === "none") return null;

  const isIosManualAction = ctaMode === "ios-manual";
  const label = isIosManualAction
    ? "Ana ekrana necə əlavə etməli?"
    : "PeerFootball-u yüklə";

  const handleClick = async () => {
    if (isIosManualAction) {
      onManualGuide?.();
      return;
    }

    const result = await installState.install();
    onInstallResult?.(result);
  };

  return (
    <Button
      type="button"
      variant={isIosManualAction ? "secondary" : "default"}
      size={variant === "compact" ? "md" : "lg"}
      className={cn(variant === "default" && "w-full sm:w-auto", className)}
      onClick={handleClick}
      disabled={installState.isInstalling}
      aria-label={label}
    >
      {installState.isInstalling ? (
        <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      ) : isIosManualAction ? (
        <BookOpen className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Download className="h-4 w-4" aria-hidden="true" />
      )}
      {installState.isInstalling ? "Quraşdırma açılır..." : label}
    </Button>
  );
}
