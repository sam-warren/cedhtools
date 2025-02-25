"use client";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { DATE_PRESET, DATE_PRESETS } from "@/lib/constants/filters";
import { DatePreset } from "@/types/filters";
import { cn } from "@/lib/utils/app-utils";
import { format, isSameDay } from "date-fns";
import { CalendarFold } from "lucide-react";
import type { DateRange } from "react-day-picker";

const MIN_DATE = new Date("2022-06-02");
const MAX_DATE = new Date();

interface FilterDateRangeProps {
  dateRange: DateRange | undefined;
  datePreset: DatePreset;
  isDateRangeModified: () => boolean;
  setDateRange: (range: DateRange | undefined) => void;
  setDatePreset: (preset: DatePreset) => void;
  isMobile: boolean;
}

export function FilterDateRange({
  dateRange,
  datePreset,
  isDateRangeModified,
  setDateRange,
  setDatePreset,
  isMobile
}: FilterDateRangeProps) {
  const handleDateRangeChange = (newRange: DateRange | undefined) => {
    if (!newRange) {
      setDateRange(undefined);
      setDatePreset("Custom");
      return;
    }

    if (!newRange.from || !newRange.to) {
      setDateRange(newRange);
      return;
    }

    setDateRange(newRange);

    // Check if the new range matches any preset
    const matchingPreset = Object.entries(DATE_PRESETS).find(
      ([_, range]) =>
        newRange.from &&
        newRange.to &&
        isSameDay(range.from as Date, newRange.from as Date) &&
        isSameDay(range.to as Date, newRange.to as Date)
    );

    setDatePreset(matchingPreset ? (matchingPreset[0] as DatePreset) : "Custom");
  };

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset as DatePreset);
    const newRange = DATE_PRESETS[preset as keyof typeof DATE_PRESETS];
    setDateRange(newRange);
  };

  return (
    <SidebarMenuItem>
      <Popover>
        <PopoverTrigger asChild>
          <SidebarMenuButton
            tooltip={
              datePreset !== DATE_PRESET.CUSTOM
                ? datePreset
                : dateRange?.from && dateRange?.to
                  ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
                  : "Filter by date"
            }
            className="relative">
            <CalendarFold className="mr-2 h-4 w-4" />
            <span className="truncate">
              {datePreset !== DATE_PRESET.CUSTOM
                ? datePreset
                : dateRange?.from && dateRange?.to
                  ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
                  : "Filter by date"}
            </span>
            {isDateRangeModified() && (
              <div className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500 transition-opacity duration-200 animate-in fade-in-0" />
            )}
          </SidebarMenuButton>
        </PopoverTrigger>
        <PopoverContent
          className="mb-6 flex w-auto flex-col space-y-2 p-2"
          align="start"
          side={isMobile ? "bottom" : "right"}
          sideOffset={4}>
          <div className="flex items-center justify-center gap-2 p-2">
            <CalendarFold className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
                : "No date range selected"}
            </p>
          </div>
          <div className="flex gap-2">
            <Select
              value={datePreset !== DATE_PRESET.CUSTOM ? datePreset : ""}
              onValueChange={(value) => {
                handleDatePresetChange(value);
              }}>
              <SelectTrigger
                className={cn("relative flex-1", datePreset === DATE_PRESET.CUSTOM && "text-muted-foreground")}>
                <SelectValue placeholder="Select a preset" />
              </SelectTrigger>
              <SelectContent
                position={isMobile ? "item-aligned" : "popper"}
                side={isMobile ? "bottom" : undefined}
                align={isMobile ? "center" : "start"}
                sideOffset={4}
                className="z-[100]"
                avoidCollisions={false}>
                <SelectGroup>
                  {Object.keys(DATE_PRESETS).map((preset) => (
                    <SelectItem key={preset} value={preset}>
                      {preset}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <button
              onClick={() => {
                setDatePreset(DATE_PRESET.CUSTOM);
                setDateRange(undefined);
              }}
              className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
              Clear
            </button>
          </div>

          <div className="rounded-md border">
            <Calendar
              mode="range"
              defaultMonth={dateRange?.to ?? new Date()}
              selected={dateRange}
              onSelect={handleDateRangeChange}
              numberOfMonths={1}
              fromDate={MIN_DATE}
              toDate={MAX_DATE}
              fixedWeeks
            />
          </div>
        </PopoverContent>
      </Popover>
    </SidebarMenuItem>
  );
}
