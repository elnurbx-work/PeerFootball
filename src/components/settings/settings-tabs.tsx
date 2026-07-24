"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Lock, Paintbrush, UserCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type SettingsTabKey = "profile" | "account" | "appearance";

type SettingsTab = {
  key: SettingsTabKey;
  label: string;
  description: string;
  content: ReactNode;
};

type SettingsTabsProps = {
  initialTab: SettingsTabKey;
  title: string;
  subtitle: string;
  tabs: SettingsTab[];
};

const TAB_ICONS = {
  profile: UserCircle,
  account: Lock,
  appearance: Paintbrush
} satisfies Record<SettingsTabKey, typeof UserCircle>;

export function SettingsTabs({ initialTab, title, subtitle, tabs }: SettingsTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  function selectTab(tab: SettingsTabKey) {
    setActiveTab(tab);
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  }

  const activePanel = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[280px_1fr]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardContent className="p-3">
            <div className="px-3 py-2">
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <div aria-label={title} className="mt-3 grid gap-1" role="tablist">
              {tabs.map((tab) => {
                const Icon = TAB_ICONS[tab.key];
                const selected = activeTab === tab.key;

                return (
                  <button
                    aria-controls={`settings-panel-${tab.key}`}
                    aria-selected={selected}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm transition-colors hover:bg-secondary/70",
                      selected ? "bg-secondary" : "text-muted-foreground"
                    )}
                    id={`settings-tab-${tab.key}`}
                    key={tab.key}
                    onClick={() => selectTab(tab.key)}
                    role="tab"
                    type="button"
                  >
                    <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                    <span className="min-w-0">
                      <span className="block font-medium text-foreground">{tab.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {tab.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </aside>

      <div className="min-w-0">
        <div
          aria-labelledby={`settings-tab-${activePanel.key}`}
          className="grid gap-5"
          id={`settings-panel-${activePanel.key}`}
          role="tabpanel"
          tabIndex={0}
        >
          {activePanel.content}
        </div>
      </div>
    </section>
  );
}
