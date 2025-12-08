"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { ManaCost } from "@/components/shared/mana-cost";
import type { CardWithStats } from "@/types/api";

interface CardGridProps {
  cards: CardWithStats[];
  showStats?: boolean;
  onCardClick?: (card: CardWithStats) => void;
}

export function CardGrid({
  cards,
  showStats = true,
  onCardClick,
}: CardGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <CardItem
          key={card.id}
          card={card}
          showStats={showStats}
          onClick={onCardClick ? () => onCardClick(card) : undefined}
        />
      ))}
    </div>
  );
}

interface CardItemProps {
  card: CardWithStats;
  showStats?: boolean;
  onClick?: () => void;
}

function CardItem({ card, showStats = true, onClick }: CardItemProps) {
  // Generate Scryfall image URL from card name
  const imageUrl = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(card.name)}&format=image&version=normal`;

  return (
    <div
      className={cn(
        "group relative",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <div className="relative aspect-[488/680] rounded-lg overflow-hidden bg-muted">
        <Image
          src={imageUrl}
          alt={card.name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
          unoptimized
        />

        {/* Hover overlay with name and mana cost */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between gap-1">
            <p className="text-white text-xs font-medium truncate">{card.name}</p>
            {card.mana_cost && <ManaCost cost={card.mana_cost} size="sm" />}
          </div>
        </div>
      </div>

      {showStats && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground truncate max-w-[60%]">
              {card.name}
            </span>
            <ManaCost cost={card.mana_cost} size="sm" />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Play rate</span>
            <span className="font-medium text-primary">
              {(card.play_rate * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function CardGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i}>
          <div className="aspect-[488/680] rounded-lg bg-muted animate-pulse" />
          <div className="mt-2 flex items-center justify-between">
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            <div className="h-3 w-8 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
