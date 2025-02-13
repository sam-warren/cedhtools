"use client";

import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { TOP_CUT, TOP_CUT_OPTIONS } from "@/lib/constants/filters";
import { cn } from "@/lib/utils/app-utils";
import { TopCut } from "@/lib/types/filters";
import { Check, Medal } from "lucide-react";

interface FilterTopCutProps {
  topCut: TopCut[];
  isTopCutModified: () => boolean;
  setTopCut: (topCut: TopCut[]) => void;
  isMobile: boolean;
}

const sortTopCut = (topCut: TopCut[]): TopCut[] => {
  if (topCut.includes(TOP_CUT.ALL)) return [TOP_CUT.ALL];
  return [...topCut].sort();
};

export function FilterTopCut({ topCut, isTopCutModified, setTopCut, isMobile }: FilterTopCutProps) {
  return (
    <SidebarMenuItem>
      <Popover>
        <PopoverTrigger asChild>
          <SidebarMenuButton tooltip={topCut.length === 0 ? "Select top cut" : topCut.join(", ")} className="relative">
            <Medal className="mr-2 h-4 w-4" />
            <span className="truncate">{topCut.length === 0 ? "Select top cut" : topCut.join(", ")}</span>
            {isTopCutModified() && (
              <div className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500 transition-opacity duration-200 animate-in fade-in-0" />
            )}
          </SidebarMenuButton>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" side={isMobile ? "bottom" : "right"} sideOffset={4}>
          <Command>
            <CommandList>
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup heading="Top Cut">
                {TOP_CUT_OPTIONS.map((item) => (
                  <CommandItem
                    key={item}
                    onSelect={() => {
                      const newTopCut =
                        item === TOP_CUT.ALL
                          ? [TOP_CUT.ALL]
                          : topCut.includes(item)
                            ? sortTopCut(topCut.filter((i) => i !== item))
                            : sortTopCut([...topCut.filter((i) => i !== TOP_CUT.ALL), item as TopCut]);
                      setTopCut(newTopCut.length === 0 ? [TOP_CUT.ALL] : newTopCut);
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
  );
} 