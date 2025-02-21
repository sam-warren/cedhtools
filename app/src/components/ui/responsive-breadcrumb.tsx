"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis
} from "@/components/ui/breadcrumb";
import React from "react";
import type { ReactElement } from "react";
import { FilterBadges } from "@/components/ui/filter-badges";
import { useIsMobile } from "@/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFilterStore } from "@/stores/filter-store";
import { CalendarFold, Users, Medal, Filter } from "lucide-react";
import { format, parseISO } from "date-fns";
import { DATE_PRESET } from "@/lib/constants/filters";

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface ResponsiveBreadcrumbsProps {
  segments: BreadcrumbSegment[];
}

function MobileFilterContent() {
  const { appliedState } = useFilterStore();
  const { dateRange, datePreset, tournamentSize, topCut } = appliedState;

  const formatDate = (date: Date) => {
    return format(parseISO(date.toISOString()), "MMM d, yyyy");
  };

  return (
    <div className="flex flex-col gap-2 whitespace-nowrap">
      {dateRange && datePreset !== DATE_PRESET.ALL_TIME && (
        <div className="flex items-center gap-2">
          <CalendarFold className="h-3 w-3" />
          <span className="text-sm">
            {formatDate(dateRange.from!)} - {formatDate(dateRange.to!)}
          </span>
        </div>
      )}
      {tournamentSize !== "All" && (
        <div className="flex items-center gap-2">
          <Users className="h-3 w-3" />
          <span className="text-sm">{tournamentSize}</span>
        </div>
      )}
      {topCut[0] !== "All" && (
        <div className="flex items-center gap-2">
          <Medal className="h-3 w-3" />
          <span className="text-sm">{topCut.join(", ")}</span>
        </div>
      )}
      {datePreset === DATE_PRESET.ALL_TIME && tournamentSize === "All" && topCut[0] === "All" && (
        <span className="w-full text-right text-sm text-muted-foreground">No filters applied</span>
      )}
    </div>
  );
}

export function ResponsiveBreadcrumbs({ segments }: ResponsiveBreadcrumbsProps) {
  const isMobile = useIsMobile();

  if (!segments.length) return null;

  const parentSegment = segments.length > 1 ? segments[segments.length - 2] : { href: "/" };
  const currentSegment = segments[segments.length - 1];

  return (
    <div className="relative w-full">
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2">
        <Breadcrumb>
          <BreadcrumbList>
            {/* Mobile view - only last segment with ellipsis */}
            <div className="flex items-center md:hidden">
              <BreadcrumbLink href={parentSegment.href} className="-ml-2 flex items-center">
                <BreadcrumbEllipsis className="w-8" />
              </BreadcrumbLink>
              <BreadcrumbSeparator className="mx-2" />
              <span className="capitalize">{currentSegment.label}</span>
            </div>

            {/* Desktop: Full breadcrumb trail */}
            <div className="hidden md:flex md:items-center [&_li]:mx-1">
              {segments.map((segment, index) => {
                const isLast = index === segments.length - 1;

                return (
                  <React.Fragment key={segment.href || segment.label}>
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage className="capitalize">{segment.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={segment.href} className="capitalize">
                          {segment.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                  </React.Fragment>
                );
              })}
            </div>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      {isMobile ? (
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <Popover>
            <PopoverTrigger asChild>
              <button className="rounded-md p-2 hover:bg-accent">
                <Filter className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="end" className="w-fit min-w-[160px]">
              <MobileFilterContent />
            </PopoverContent>
          </Popover>
        </div>
      ) : (
        <div className="flex justify-end">
          <FilterBadges />
        </div>
      )}
    </div>
  );
}
