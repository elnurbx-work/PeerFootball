"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Power } from "lucide-react";
import { deactivateClubMetricDefinitionAction } from "@/actions/club.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClubMetricForm } from "@/components/clubs/club-metric-form";
import type { ClubMetricDefinitionDto } from "@/types/club.types";
import { useI18n } from "@/components/i18n/i18n-provider";

type ClubMetricsListProps = {
  clubId: string;
  metrics: ClubMetricDefinitionDto[];
  canManage: boolean;
};

export function ClubMetricsList({ clubId, metrics, canManage }: ClubMetricsListProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [editingMetricId, setEditingMetricId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const activeMetricCount = metrics.filter((metric) => metric.isActive).length;

  function deactivateMetric(metricId: string) {
    setMessage("");
    startTransition(async () => {
      const result = await deactivateClubMetricDefinitionAction(metricId);
      setMessage(result.message);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <div className="grid gap-4">
      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("clubs.metricsList.createTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="text-sm text-muted-foreground">{t("clubs.metricsList.activeCount", { count: activeMetricCount })}</p>
            {activeMetricCount < 6 ? <ClubMetricForm clubId={clubId} /> : null}
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{t("clubs.metricsList.title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          {metrics.map((metric) => (
            <div key={metric.id} className="rounded-md border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{metric.order}. {metric.name}</p>
                    <Badge variant={metric.isActive ? "default" : "secondary"}>
                      {metric.isActive ? t("clubs.guestList.active") : t("clubs.guestList.inactive")}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {metric.description ?? t("clubs.metricsList.noDescription")}
                  </p>
                </div>
                {canManage && metric.isActive ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingMetricId(editingMetricId === metric.id ? null : metric.id)}
                    >
                      <Pencil className="h-4 w-4" />
                      {t("clubs.guestList.edit")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => deactivateMetric(metric.id)}
                    >
                      <Power className="h-4 w-4" />
                      {t("clubs.guestList.deactivate")}
                    </Button>
                  </div>
                ) : null}
              </div>
              {editingMetricId === metric.id ? (
                <div className="mt-4 border-t pt-4">
                  <ClubMetricForm clubId={clubId} metric={metric} onDone={() => setEditingMetricId(null)} />
                </div>
              ) : null}
            </div>
          ))}
          {!metrics.length ? <p className="text-center text-sm text-muted-foreground">{t("clubs.metricsList.empty")}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
