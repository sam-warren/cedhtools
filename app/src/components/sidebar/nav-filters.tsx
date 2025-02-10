"use client";

import { format, isSameDay, subMonths, subYears } from "date-fns";
import { CalendarFold, Check, Medal, Users } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define preset date ranges
const datePresets: Record<string, DateRange> = {
  "3 months": {
    from: subMonths(new Date(), 3),
    to: new Date()
  },
  "6 months": {
    from: subMonths(new Date(), 6),
    to: new Date()
  },
  "1 year": {
    from: subYears(new Date(), 1),
    to: new Date()
  },
  "Post-ban": {
    from: new Date(2024, 8, 23), // September 23, 2023
    to: new Date()
  },
  "Pre-Ban": {
    from: new Date(2022, 5, 1), // June 1, 2022
    to: new Date(2024, 8, 23) // September 23, 2023
  },
  "All Time": {
    from: new Date(2022, 5, 1), // June 1, 2022
    to: new Date()
  }
};

export function NavFilters() {
  const [dateRange, setDateRange] = React.useState<DateRange>(datePresets["Post-ban"]);
  const [datePreset, setDatePreset] = React.useState<string>("Post-ban");
  const [tournamentSize, setTournamentSize] = React.useState<string>("30+");
  const [topCut, setTopCut] = React.useState<string[]>(["Top 10", "Top 16"]);

  const topCutOptions = ["Top 4", "Top 10", "Top 16", "Top 40", "Top 64", "All"];

  const handleDateRangeChange = (newRange: DateRange | undefined) => {
    if (!newRange?.from || !newRange?.to) return;

    setDateRange(newRange);

    // Check if the new range matches any preset
    const matchingPreset = Object.entries(datePresets).find(
      ([_, range]) =>
        newRange.from &&
        newRange.to &&
        isSameDay(range.from as Date, newRange.from as Date) &&
        isSameDay(range.to as Date, newRange.to as Date)
    );

    setDatePreset(matchingPreset ? matchingPreset[0] : "Custom");
  };

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    if (preset !== "Custom") {
      setDateRange(datePresets[preset as keyof typeof datePresets]);
    }
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
                    : dateRange.from && dateRange.to
                      ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
                      : "Select dates"
                }>
                <CalendarFold className="mr-2 h-4 w-4" />
                <span className="truncate">
                  {datePreset !== "Custom"
                    ? datePreset
                    : dateRange.from && dateRange.to
                      ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
                      : "Select dates"}
                </span>
              </SidebarMenuButton>
            </PopoverTrigger>
            <PopoverContent className="flex w-auto flex-col space-y-2 p-2" align="start">
              <Select value={datePreset} onValueChange={(value) => handleDatePresetChange(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select preset" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {Object.keys(datePresets).map((preset) => (
                    <SelectItem key={preset} value={preset}>
                      {preset}
                    </SelectItem>
                  ))}
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              <div className="rounded-md border">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange.to}
                  selected={dateRange}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={1}
                />
              </div>
            </PopoverContent>
          </Popover>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <Popover>
            <PopoverTrigger asChild>
              <SidebarMenuButton tooltip={`${tournamentSize} Players`}>
                <Users className="mr-2 h-4 w-4" />
                <span className="truncate">{tournamentSize} Players</span>
              </SidebarMenuButton>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandList>
                  <CommandGroup>
                    {["30+", "60+", "120+", "All"].map((size) => (
                      <CommandItem
                        key={size}
                        onSelect={() => {
                          setTournamentSize(size);
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
                  <CommandGroup>
                    {topCutOptions.map((item) => (
                      <CommandItem
                        key={item}
                        onSelect={() => {
                          setTopCut((prev) => {
                            if (item === "All") {
                              return ["All"];
                            }
                            const newTopCut = prev.includes(item)
                              ? prev.filter((i) => i !== item)
                              : [...prev.filter((i) => i !== "All"), item];
                            return newTopCut.length === 0 ? ["All"] : newTopCut;
                          });
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
