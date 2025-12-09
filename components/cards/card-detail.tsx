"use client";

import { ColorIdentity } from "@/components/shared/color-identity";
import { ManaCost } from "@/components/shared/mana-cost";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CardDetail } from "@/types/api";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface CardDetailClientProps {
  card: CardDetail;
}

export function CardDetailClient({ card }: CardDetailClientProps) {
  const imageUrl = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(card.name)}&format=image&version=normal`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link href="/commanders" className="inline-block mb-6">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Commanders
          </Button>
        </Link>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Card Image */}
          <div className="flex-shrink-0">
            <div className="relative w-64 aspect-[488/680] rounded-lg overflow-hidden shadow-lg bg-muted">
              <Image
                src={imageUrl}
                alt={card.name}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>
          </div>

          {/* Card Info */}
          <div className="flex-1 space-y-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{card.name}</h1>
                {card.mana_cost && <ManaCost cost={card.mana_cost} size="lg" />}
              </div>
              {card.type_line && (
                <p className="text-muted-foreground mt-1">{card.type_line}</p>
              )}
            </div>

            {/* Commanders using this card */}
            {card.commanders && card.commanders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Used in {card.commanders.length} Commander{card.commanders.length !== 1 ? "s" : ""}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {card.commanders.slice(0, 10).map((commander) => (
                      <Link
                        key={commander.id}
                        href={`/cards/${encodeURIComponent(card.name)}/commanders/${commander.id}`}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <ColorIdentity colorId={commander.color_id} size="sm" />
                          <span className="font-medium">{commander.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            {commander.entries} decks
                          </span>
                          <span className="font-medium">
                            {(commander.win_rate * 100).toFixed(1)}% WR
                          </span>
                        </div>
                      </Link>
                    ))}
                    {card.commanders.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{card.commanders.length - 10} more commanders
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* External Links */}
            <div className="flex flex-wrap gap-3">
              <a
                href={`https://scryfall.com/search?q=${encodeURIComponent(card.name)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  View on Scryfall
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
              </a>
              <a
                href={`https://edhrec.com/cards/${card.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  View on EDHREC
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



