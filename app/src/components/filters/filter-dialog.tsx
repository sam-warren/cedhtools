"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

export function FilterDialog() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(2022, 0, 20),
    to: addDays(new Date(2022, 0, 20), 20)
  });

  const [datePreset, setDatePreset] = React.useState<string>("All Time");
  const [tournamentSize, setTournamentSize] = React.useState<string>("All");
  const [topCut, setTopCut] = React.useState<string[]>(["All"]);

  const topCutOptions = ["Top 4", "Top 10", "Top 16", "Top 40", "Top 64", "All"];

  return (
    <div className="grid gap-4">
      {/* Date Range Picker (unchanged) */}
      <div className="space-y-2">
        <h4 className="font-medium leading-none">Date Range</h4>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="z-[60] w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Date Preset Picker (unchanged) */}
      <div className="space-y-2">
        <h4 className="font-medium leading-none">Date Preset</h4>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              {datePreset} <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandGroup>
                {["3 months", "6 months", "1 year", "Post-ban", "Pre-Ban", "All Time"].map((item) => (
                  <CommandItem key={item} onSelect={() => setDatePreset(item)}>
                    <Check className={cn("mr-2 h-4 w-4", datePreset === item ? "opacity-100" : "opacity-0")} />
                    {item}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Tournament Size Picker (unchanged) */}
      <div className="space-y-2">
        <h4 className="font-medium leading-none">Tournament Size</h4>
        <div className="flex space-x-2">
          {["30+", "60+", "120+", "All"].map((size) => (
            <Button
              key={size}
              variant={tournamentSize === size ? "default" : "outline"}
              onClick={() => setTournamentSize(size)}
              className="flex-1">
              {size}
            </Button>
          ))}
        </div>
      </div>

      {/* Updated Top Cut Picker */}
      <div className="space-y-2">
        <h4 className="font-medium leading-none">Top Cut</h4>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              {topCut.length === 0 ? "Select top cut" : <>{topCut.join(", ")}</>}
              <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
            </Button>
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
      </div>
    </div>
  );
}
