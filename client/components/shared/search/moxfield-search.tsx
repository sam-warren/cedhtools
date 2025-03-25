"use client";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { cn } from "@/lib/utils";

interface MoxfieldSearchProps {
  variant?: "default" | "sidebar";
}

export function MoxfieldSearch({ variant = "default" }: MoxfieldSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const router = useRouter();

  // Debug logging for search value changes
  React.useEffect(() => {
    console.log("Search value changed:", searchValue);
  }, [searchValue]);

  const exampleDecks = [
    {
      name: "Grind Them Into Dust - Kinnan Midrange Control",
      id: "OYpsy84lZU-HPrQiW9hmdQ",
      description: "Kinnan Midrange Control with Primer 💚💙",
    },
    {
      name: "Turbo Fool [TOODEEP]",
      id: "JgnfXot2GUWxikaVUDDeDg",
      description: "Fast combo deck",
    },
    {
      name: "[cEDH] Good Soup",
      id: "XtOruYVVu0CDmDzqaKTtkA",
      description: "Competitive EDH deck",
    },
  ];

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative w-full justify-start text-sm text-muted-foreground",
          variant === "default"
            ? "h-14 max-w-3xl text-base sm:pr-12"
            : "h-9 sm:pr-12"
        )}
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="mr-2 h-4 w-4" />
        <span
          className={cn(
            "flex-1",
            variant === "default" ? "inline-flex" : "hidden lg:inline-flex"
          )}
        >
          Search deck...
        </span>
        {variant === "sidebar" && (
          <span className="inline-flex font-mono lg:hidden">Search...</span>
        )}
        <kbd className="pointer-events-none absolute right-1.5 top-1/2 hidden h-6 -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Paste Moxfield URL..."
          value={searchValue}
          onValueChange={setSearchValue}
        />
        <CommandList>
          {searchValue && searchValue.includes("moxfield.com/decks/") && (
            <CommandItem
              onSelect={() => {
                runCommand(() => {
                  const deckId = searchValue
                    .split("/decks/")[1]
                    ?.split(/[/?#]/)[0];
                  if (deckId) {
                    router.push(`/deck/${encodeURIComponent(deckId)}`);
                  }
                });
              }}
            >
              <div className="flex flex-col">
                <span>Search for deck: {searchValue}</span>
                <span className="text-xs text-muted-foreground">
                  Press enter to analyze
                </span>
              </div>
            </CommandItem>
          )}
          <CommandEmpty>
            {!searchValue.includes("moxfield.com/decks/") &&
              "No results found."}
          </CommandEmpty>
          <CommandGroup heading="Example Decks">
            {exampleDecks.map((deck) => (
              <CommandItem
                key={deck.id}
                onSelect={() => {
                  runCommand(() => {
                    router.push(`/deck/${encodeURIComponent(deck.id)}`);
                  });
                }}
              >
                <div className="flex flex-col">
                  <span>{deck.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {deck.description}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
