"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { setCookieConsent, useCookieConsent } from "@/lib/ads/use-ad-consent";

export function AdConsentBanner() {
  const consent = useCookieConsent();
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [preferences, setPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [advertising, setAdvertising] = useState(false);

  useEffect(() => {
    const show = () => {
      setPreferences(Boolean(consent?.preferences));
      setAnalytics(Boolean(consent?.analytics));
      setAdvertising(Boolean(consent?.advertising));
      setCustomize(true);
      setOpen(true);
    };
    window.addEventListener("peerfootball:open-cookie-settings", show);
    return () => window.removeEventListener("peerfootball:open-cookie-settings", show);
  }, [consent]);

  const visible = open || consent === null;
  if (!visible || consent === undefined) return null;

  const save = (value: { preferences: boolean; analytics: boolean; advertising: boolean }) => {
    setCookieConsent(value);
    setOpen(false);
    setCustomize(false);
  };

  return (
    <section aria-labelledby="cookie-consent-title" className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-2xl rounded-xl border bg-card p-4 shadow-2xl sm:p-5" role="dialog">
      <h2 id="cookie-consent-title" className="font-semibold">Cookie seçimləri</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Zəruri cookie-lər hesab və təhlükəsizlik üçün işləyir. Analitika və reklam cookie-ləri yalnız seçiminizlə aktivləşir. <Link href="/cookie-policy" className="underline">Cookie siyasəti</Link>
      </p>
      {customize ? (
        <fieldset className="mt-4 grid gap-2 text-sm">
          <legend className="sr-only">Cookie kateqoriyaları</legend>
          <ConsentRow label="Zəruri" description="Giriş, təhlükəsizlik və əsas funksiyalar" checked disabled onChange={() => undefined} />
          <ConsentRow label="Seçimlər" description="Dil və görünüş seçimləri" checked={preferences} onChange={setPreferences} />
          <ConsentRow label="Analitika" description="Saytın istifadəsini anlamağa kömək edir" checked={analytics} onChange={setAnalytics} />
          <ConsentRow label="Reklam" description="AdSense reklamlarının göstərilməsinə icazə verir" checked={advertising} onChange={setAdvertising} />
        </fieldset>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={() => save({ preferences: true, analytics: true, advertising: true })}>Hamısını qəbul et</Button>
        <Button type="button" variant="outline" onClick={() => save({ preferences: false, analytics: false, advertising: false })}>Opsionalı rədd et</Button>
        {customize
          ? <Button type="button" variant="outline" onClick={() => save({ preferences, analytics, advertising })}>Seçimi saxla</Button>
          : <Button type="button" variant="ghost" onClick={() => setCustomize(true)}>Fərdiləşdir</Button>}
      </div>
    </section>
  );
}

function ConsentRow({ label, description, checked, disabled, onChange }: {
  label: string; description: string; checked: boolean; disabled?: boolean; onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-md border p-3">
      <input className="mt-1" type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span><strong className="block">{label}</strong><span className="text-xs text-muted-foreground">{description}</span></span>
    </label>
  );
}
