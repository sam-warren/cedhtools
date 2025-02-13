"use client";

import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { TOURNAMENT_SIZE_OPTIONS } from "@/lib/constants/filters";
import { cn } from "@/lib/utils/app-utils";
import { TournamentSize } from "@/lib/types/filters";
import { Check, Users } from "lucide-react";
import React from "react";

interface FilterTournamentSizeProps {
  tournamentSize: TournamentSize;
  isTournamentSizeModified: () => boolean;
  setTournamentSize: (size: TournamentSize) => void;
  isMobile: boolean;
}

export function FilterTournamentSize({
  tournamentSize,
  isTournamentSizeModified,
  setTournamentSize,
  isMobile
}: FilterTournamentSizeProps) {
  return (
    <SidebarMenuItem>
      <Popover>
        <PopoverTrigger asChild>
          <SidebarMenuButton tooltip={`${tournamentSize} Players`} className="relative">
            <Users className="mr-2 h-4 w-4" />
            <span className="truncate">{tournamentSize} Players</span>
            {isTournamentSizeModified() && (
              <div className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500 transition-opacity duration-200 animate-in fade-in-0" />
            )}
          </SidebarMenuButton>
        </PopoverTrigger>
        <PopoverContent
          className="w-[200px] p-0"
          side={isMobile ? "bottom" : "right"}
          sideOffset={4}>
          <Command>
            <CommandList>
              <CommandGroup heading="Tournament Size">
                {TOURNAMENT_SIZE_OPTIONS.map((size) => (
                  <CommandItem
                    key={size}
                    onSelect={() => {
                      setTournamentSize(size as TournamentSize);
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
  );
} 