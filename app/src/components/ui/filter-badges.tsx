"use client";

import { Badge } from "@/components/ui/badge";
import { useFilterStore } from "@/stores/filter-store";
import { format } from "date-fns";
import { CalendarFold, Users, Medal } from "lucide-react";
import { DATE_PRESET } from "@/lib/constants/filters";

export function FilterBadges() {
  const { appliedState } = useFilterStore();
  const { dateRange, datePreset, tournamentSize, topCut } = appliedState;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {dateRange && datePreset !== DATE_PRESET.ALL_TIME && (
        <Badge variant="secondary" className="gap-2">
          <CalendarFold className="h-3 w-3" />
          {format(dateRange.from!, "MMM d, yyyy")} - {format(dateRange.to!, "MMM d, yyyy")}
        </Badge>
      )}
      {tournamentSize !== "All" && (
        <Badge variant="secondary" className="gap-2">
          <Users className="h-3 w-3" />
          {tournamentSize}
        </Badge>
      )}
      {topCut[0] !== "All" && (
        <Badge variant="secondary" className="gap-2">
          <Medal className="h-3 w-3" />
          {topCut.join(", ")}
        </Badge>
      )}
    </div>
  );
} 