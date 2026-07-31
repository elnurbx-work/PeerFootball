import Link from "next/link";
import { CalendarDays, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Translate } from "@/i18n/dictionary";

export function MatchClubSwitcher({ active, t }: { active: "matches" | "clubs"; t: Translate }) {
  const items = [
    { key: "matches" as const, href: "/matches", label: t("nav.matches"), icon: CalendarDays },
    { key: "clubs" as const, href: "/clubs", label: t("nav.clubs"), icon: Shield }
  ];

  return (
    <nav className="grid grid-cols-2 gap-2 md:hidden" aria-label={t("nav.match")}>
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={active === item.key ? "page" : undefined}
          className={cn(
            "flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold",
            active === item.key ? "border-primary bg-primary text-primary-foreground" : "bg-card"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
