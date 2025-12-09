"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ColorIdentity } from "@/components/shared/color-identity";
import {
  getRecentDecks,
  removeRecentDeck,
  formatRelativeTime,
  type RecentDeck,
} from "@/lib/storage";
import { Clock, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface RecentDecksProps {
  className?: string;
}

export function RecentDecks({ className }: RecentDecksProps) {
  const [decks, setDecks] = useState<RecentDeck[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDecks(getRecentDecks());
  }, []);

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    removeRecentDeck(id);
    setDecks(getRecentDecks());
  };

  // Don't render on server or if no decks
  if (!mounted || decks.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        <span>Recent</span>
      </div>
      <div className="space-y-2">
        {decks.slice(0, 5).map((deck) => (
          <div
            key={deck.id}
            className="flex items-center gap-3 group"
          >
            <ColorIdentity colorId={deck.colorId} size="sm" />
            <Link
              href={`/analyze/${deck.id}`}
              className="flex-1 hover:underline"
            >
              <span className="font-medium">{deck.commanderName}</span>
              <span className="text-muted-foreground ml-2 text-sm">
                {formatRelativeTime(deck.timestamp)}
              </span>
            </Link>
            <button
              onClick={(e) => handleRemove(e, deck.id)}
              className="p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
