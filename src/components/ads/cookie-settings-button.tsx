"use client";

export function CookieSettingsButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      className={`text-left text-muted-foreground hover:text-foreground ${className}`}
      onClick={() => window.dispatchEvent(new Event("peerfootball:open-cookie-settings"))}
    >
      Cookie ayarları
    </button>
  );
}
