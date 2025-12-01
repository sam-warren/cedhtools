"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { cn } from "@/lib/utils";

interface Commander {
  id: string;
  name: string;
  entries: number;
  winRate: number;
}

interface DeckAnalysisFormProps {
  variant?: "default" | "sidebar";
}

export function DeckAnalysisForm({ variant = "default" }: DeckAnalysisFormProps) {
  const [open, setOpen] = React.useState(false);
  const [commanderOpen, setCommanderOpen] = React.useState(false);
  const [commanders, setCommanders] = React.useState<Commander[]>([]);
  const [loadingCommanders, setLoadingCommanders] = React.useState(false);
  const [selectedCommander, setSelectedCommander] = React.useState<Commander | null>(null);
  const [commanderSearch, setCommanderSearch] = React.useState("");
  const [deckList, setDeckList] = React.useState("");
  const [deckName, setDeckName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
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

  // Initial fetch
  React.useEffect(() => {
    if (open && commanders.length === 0) {
      setCommanderSearch('');
    }
  }, [open, commanders.length]);

  const handleSubmit = async () => {
    if (!selectedCommander) {
      setError('Please select a commander');
      return;
    }

    if (!deckList.trim()) {
      setError('Please enter your deck list');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/decks/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commanderId: selectedCommander.id,
          deckList: deckList,
          deckName: deckName || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze deck');
      }

      const data = await response.json();
      
      // Store analysis result in session storage for the results page
      sessionStorage.setItem('deckAnalysis', JSON.stringify(data));
      
      // Navigate to results page
      setOpen(false);
      router.push('/deck/analysis');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCommander(null);
    setDeckList("");
    setDeckName("");
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
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
              "flex-1",
              variant === "default" ? "inline-flex" : "hidden lg:inline-flex"
            )}
          >
            Analyze deck...
          </span>
          {variant === "sidebar" && (
            <span className="inline-flex font-mono lg:hidden">Search...</span>
          )}
          <kbd className="pointer-events-none absolute right-1.5 top-1/2 hidden h-6 -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Analyze Your Deck</DialogTitle>
          <DialogDescription>
            Select your commander and paste your deck list to see how your cards
            perform in tournament play.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Commander Selection */}
          <div className="grid gap-2">
            <Label htmlFor="commander">Commander(s)</Label>
            <Popover open={commanderOpen} onOpenChange={setCommanderOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={commanderOpen}
                  className="w-full justify-between"
                >
                  {selectedCommander
                    ? selectedCommander.name
                    : "Select commander..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[550px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Search commanders..." 
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
                        <CommandGroup>
                          {commanders.map((commander) => (
                            <CommandItem
                              key={commander.id}
                              value={commander.id}
                              onSelect={() => {
                                setSelectedCommander(commander);
                                setCommanderOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedCommander?.id === commander.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{commander.name}</span>
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
          </div>

          {/* Deck Name (optional) */}
          <div className="grid gap-2">
            <Label htmlFor="deckName">Deck Name (optional)</Label>
            <Input
              id="deckName"
              placeholder="My Awesome Deck"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
            />
          </div>

          {/* Deck List */}
          <div className="grid gap-2">
            <Label htmlFor="deckList">
              Mainboard (99 cards)
              <span className="text-muted-foreground ml-2 text-xs font-normal">
                One card per line: &quot;1 Card Name&quot; or &quot;Card Name&quot;
              </span>
            </Label>
            <Textarea
              id="deckList"
              placeholder={`1 Sol Ring
1 Mana Crypt
1 Chrome Mox
1 Rhystic Study
...`}
              className="min-h-[200px] font-mono text-sm"
              value={deckList}
              onChange={(e) => setDeckList(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Paste your deck list from MTGO, Arena, or any deck builder.
              Do not include commanders - they are selected above.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || !selectedCommander || !deckList.trim()}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Deck'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

