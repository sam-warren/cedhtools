"use client";

import { Badge } from "@/components/ui/badge";
import { DATE_PRESET } from "@/lib/constants/filters";
import { useFilterStore } from "@/stores/filter-store";
import { format, parseISO } from "date-fns";
import { CalendarFold, Medal, Users } from "lucide-react";
import { useEffect, useState } from "react";

export function FilterBadges() {
  const { appliedState } = useFilterStore();
  const { dateRange, datePreset, tournamentSize, topCut } = appliedState;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything on the server side
  if (!mounted) {
    return null;
  }

  const formatDate = (date: Date) => {
    return format(parseISO(date.toISOString()), "MMM d, yyyy");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {dateRange && datePreset !== DATE_PRESET.ALL_TIME && (
        <Badge variant="secondary" className="gap-2">
          <CalendarFold className="h-3 w-3" />
          {formatDate(dateRange.from!)} - {formatDate(dateRange.to!)}
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
