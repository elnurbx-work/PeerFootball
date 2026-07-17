"use client";

import { MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";

type TeamCardProps = {
  team: {
    name: string;
    description: string;
    membersCount: number;
    location: string;
  };
};

export function TeamCard({ team }: TeamCardProps) {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground">
            {team.name.charAt(0)}
          </div>
          <CardTitle>{team.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">{team.description}</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            <Users className="h-3.5 w-3.5" />
            {t("common.membersCount", { count: team.membersCount })}
          </Badge>
          <Badge variant="secondary">
            <MapPin className="h-3.5 w-3.5" />
            {team.location}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
