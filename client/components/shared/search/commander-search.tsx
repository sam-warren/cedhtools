"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SearchIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { cn } from "@/lib/utils";

interface Commander {
  id: string;
  name: string;
  entries: number;
  winRate: number;
}

interface CommanderSearchProps {
  variant?: "default" | "sidebar";
}

export function CommanderSearch({ variant = "default" }: CommanderSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [commanders, setCommanders] = React.useState<Commander[]>([]);
  const [loadingCommanders, setLoadingCommanders] = React.useState(false);
  const [commanderSearch, setCommanderSearch] = React.useState("");
  const router = useRouter();

  // Fetch commanders when search changes
  React.useEffect(() => {
    const fetchCommanders = async () => {
      setLoadingCommanders(true);
      try {
        const params = new URLSearchParams();
        if (commanderSearch) {
          params.set('search', commanderSearch);
        }
        params.set('limit', '50');
        params.set('minEntries', '5');

        const response = await fetch(`/api/commanders?${params}`);
        if (response.ok) {
          const data = await response.json();
          setCommanders(data.commanders);
        }
      } catch (err) {
        console.error('Error fetching commanders:', err);
      } finally {
        setLoadingCommanders(false);
      }
    };

    // Debounce search
    const timeout = setTimeout(fetchCommanders, 300);
    return () => clearTimeout(timeout);
  }, [commanderSearch]);

  // Initial fetch when opened
  React.useEffect(() => {
    if (open && commanders.length === 0) {
      setCommanderSearch('');
    }
  }, [open, commanders.length]);

  const handleSelect = (commander: Commander) => {
    setOpen(false);
    router.push(`/commander/${commander.id}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "relative w-full justify-start text-sm text-muted-foreground",
            variant === "default"
              ? "h-14 max-w-3xl text-base sm:pr-12"
              : "h-9 sm:pr-12"
          )}
        >
          <SearchIcon className="mr-2 h-4 w-4" />
          <span
            className={cn(
              "flex-1 text-left",
              variant === "default" ? "inline-flex" : "hidden lg:inline-flex"
            )}
          >
            Search...
          </span>
          {variant === "sidebar" && (
            <span className="inline-flex font-mono lg:hidden">Search...</span>
          )}
          <kbd className="pointer-events-none absolute right-1.5 top-1/2 hidden h-6 -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[550px] p-0" 
        align="start"
        sideOffset={8}
      >
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Type a commander name..." 
            value={commanderSearch}
            onValueChange={setCommanderSearch}
          />
          <CommandList>
            {loadingCommanders ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Loading...</span>
              </div>
            ) : (
              <>
                <CommandEmpty>No commander found.</CommandEmpty>
                <CommandGroup heading="Commanders">
                  {commanders.map((commander) => (
                    <CommandItem
                      key={commander.id}
                      value={commander.id}
                      onSelect={() => handleSelect(commander)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col flex-1">
                        <span className="font-medium">{commander.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {commander.entries} entries · {commander.winRate}% win rate
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

