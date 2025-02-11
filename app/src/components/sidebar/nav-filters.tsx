"use client";

import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar";
import { DATE_PRESETS, TOP_CUT_OPTIONS, TOURNAMENT_SIZE_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useFilterStore } from "@/stores/filter-store";
import { format, isSameDay } from "date-fns";
import { CalendarFold, Check, Medal, Users } from "lucide-react";
import type { DateRange } from "react-day-picker";
import React from "react";
import { DatePreset, TopCut } from "@/types/filters";

export function NavFilters() {
  const { dateRange, datePreset, tournamentSize, topCut, setDateRange, setDatePreset, setTournamentSize, setTopCut } =
    useFilterStore();

  const [tournamentSizeOpen, setTournamentSizeOpen] = React.useState(false);
  const [presetSelectOpen, setPresetSelectOpen] = React.useState(false);

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
    setDateRange(DATE_PRESETS[preset as keyof typeof DATE_PRESETS]);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Filters</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <Popover>
            <PopoverTrigger asChild>
              <SidebarMenuButton
                tooltip={
                  datePreset !== "Custom"
                    ? datePreset
                    : dateRange?.from && dateRange?.to
                      ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
                      : "Filter by date"
                }>
                <CalendarFold className="mr-2 h-4 w-4" />
                <span className="truncate">
                  {datePreset !== "Custom"
                    ? datePreset
                    : dateRange?.from && dateRange?.to
                      ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
                      : "Filter by date"}
                </span>
              </SidebarMenuButton>
            </PopoverTrigger>
            <PopoverContent className="flex w-auto flex-col space-y-2 p-2" align="start">
              <div className="flex gap-2">
                <Select
                  open={presetSelectOpen}
                  onOpenChange={(open) => {
                    setPresetSelectOpen(open);
                    event?.stopPropagation();
                  }}
                  value={datePreset !== "Custom" ? datePreset : ""}
                  onValueChange={(value) => {
                    handleDatePresetChange(value);
                    event?.stopPropagation();
                  }}>
                  <SelectTrigger
                    onClick={(e) => e.stopPropagation()}
                    className={cn("flex-1", datePreset === "Custom" && "text-muted-foreground")}>
                    <SelectValue placeholder="Select a preset" />
                  </SelectTrigger>
                  <SelectContent position="popper" onCloseAutoFocus={(e) => e.preventDefault()}>
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
                    setDatePreset("Custom");
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
                />
              </div>
            </PopoverContent>
          </Popover>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <Popover open={tournamentSizeOpen} onOpenChange={setTournamentSizeOpen}>
            <PopoverTrigger asChild>
              <SidebarMenuButton tooltip={`${tournamentSize} Players`}>
                <Users className="mr-2 h-4 w-4" />
                <span className="truncate">{tournamentSize} Players</span>
              </SidebarMenuButton>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandList>
                  <CommandGroup heading="Tournament Size">
                    {TOURNAMENT_SIZE_OPTIONS.map((size) => (
                      <CommandItem
                        key={size}
                        onSelect={() => {
                          setTournamentSize(size);
                          setTournamentSizeOpen(false);
                        }}>
                        <Check className={cn("mr-2 h-4 w-4", tournamentSize === size ? "opacity-100" : "opacity-0")} />
                        {size}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <Popover>
            <PopoverTrigger asChild>
              <SidebarMenuButton tooltip={topCut.length === 0 ? "Select top cut" : topCut.join(", ")}>
                <Medal className="mr-2 h-4 w-4" />
                <span className="truncate">{topCut.length === 0 ? "Select top cut" : topCut.join(", ")}</span>
              </SidebarMenuButton>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandList>
                  <CommandEmpty>No options found.</CommandEmpty>
                  <CommandGroup heading="Top Cut">
                    {TOP_CUT_OPTIONS.map((item) => (
                      <CommandItem
                        key={item}
                        onSelect={() => {
                          const newTopCut =
                            item === "All"
                              ? ["All"]
                              : topCut.includes(item)
                                ? topCut.filter((i) => i !== item)
                                : [...topCut.filter((i) => i !== "All"), item];
                          setTopCut(newTopCut.length === 0 ? ["All"] : (newTopCut as TopCut[]));
                        }}>
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            topCut.includes(item) ? "bg-primary text-primary-foreground" : "opacity-50"
                          )}>
                          <Check className={cn("h-4 w-4", topCut.includes(item) ? "opacity-100" : "opacity-0")} />
                        </div>
                        {item}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
