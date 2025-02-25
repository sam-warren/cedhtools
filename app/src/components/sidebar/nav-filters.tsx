"use client";

import { FilterApply } from "@/components/filters/filter-apply";
import { FilterDateRange } from "@/components/filters/filter-date-range";
import { FilterTopCut } from "@/components/filters/filter-top-cut";
import { FilterTournamentSize } from "@/components/filters/filter-tournament-size";
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, useSidebar } from "@/components/ui/sidebar";
import { useFilterStore } from "@/stores/filter-store";
import { useCallback, useState } from "react";

export function NavFilters() {
  const {
    dateRange,
    datePreset,
    tournamentSize,
    topCut,
    isDateRangeModified,
    isTournamentSizeModified,
    isTopCutModified,
    hasModifiedFilters,
    setDateRange,
    setDatePreset,
    setTournamentSize,
    setTopCut,
    applyFilters
  } = useFilterStore();
  const { isMobile, open } = useSidebar();
  const [isLoading, setIsLoading] = useState(false);

  const handleApplyFilters = useCallback(async () => {
    setIsLoading(true);
    await applyFilters();
    setIsLoading(false);
  }, [applyFilters]);

  return (
    <SidebarGroup className="gap-1">
      <SidebarGroupLabel>Filters</SidebarGroupLabel>
      <SidebarMenu className="mt-0">
        <div className="flex flex-col gap-2">
          <FilterDateRange
            dateRange={dateRange}
            datePreset={datePreset}
            isDateRangeModified={isDateRangeModified}
            setDateRange={setDateRange}
            setDatePreset={setDatePreset}
            isMobile={isMobile}
          />
          <FilterTournamentSize
            tournamentSize={tournamentSize}
            isTournamentSizeModified={isTournamentSizeModified}
            setTournamentSize={setTournamentSize}
            isMobile={isMobile}
          />
          <FilterTopCut topCut={topCut} isTopCutModified={isTopCutModified} setTopCut={setTopCut} isMobile={isMobile} />
          <FilterApply
            isLoading={isLoading}
            hasModifiedFilters={hasModifiedFilters}
            applyFilters={handleApplyFilters}
            open={open}
          />
        </div>
      </SidebarMenu>
    </SidebarGroup>
  );
}
