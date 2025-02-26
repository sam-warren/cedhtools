"use client";

import { useMemo, useState, createElement } from "react";
import { NoData } from "@/components/ui/no-data";
import { CARD_TYPES, CARD_TYPE_ICONS } from "@/lib/constants/card";
import { DonutChart } from "@/components/charts/donut-chart";
import type { CommanderDetails } from "@/types/entities/commanders";
import { columns, CommanderCardDisplay } from "@/components/tables/commander-cards-columns";
import { PageHeader } from "@/components/ui/page-header";
import { CardSearch } from "@/components/ui/card-search";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { CommanderCard } from "@/types/entities/cards";

interface Props {
  commanderDetails: CommanderDetails;
}

export default function CommanderCardsPage({ commanderDetails }: Props) {
  const [search, setSearch] = useState("");

  // Assume API returns complete card data with performance metrics
  const commanderCards = useMemo<CommanderCard[]>(() => {
    // Cast the API response to include full card details
    return commanderDetails.cardAnalysis.cards as CommanderCard[];
  }, [commanderDetails.cardAnalysis.cards]);

  // This filtering logic needs to be client-side for real-time search
  const filteredData = useMemo(() => {
    if (!search) return commanderCards;
    const searchLower = search.toLowerCase();
    return commanderCards.filter((cardEntry) => cardEntry.card.name.toLowerCase().includes(searchLower));
  }, [search, commanderCards]);

  const cardsByType = useMemo(() => {
    const grouped = {} as Record<string, CommanderCard[]>;
    CARD_TYPES.forEach((type) => {
      grouped[type] = filteredData.filter((cardEntry) =>
        cardEntry.card.typeLine.toLowerCase().includes(type.toLowerCase())
      );
    });
    return grouped;
  }, [filteredData]);

  const typeDistribution = useMemo(() => {
    return CARD_TYPES.map((type) => ({
      name: type === "Sorcery" ? "Sorceries" : `${type}s`,
      count: cardsByType[type]?.length || 0,
      icon: CARD_TYPE_ICONS[type],
      type: type
    }))
      .filter((type) => type.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [cardsByType]);

  const scrollToTable = (type: string) => {
    const element = document.getElementById(`table-${type}`);
    if (element) {
      const offset = 60;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Commander Cards" description={`All cards played in ${commanderDetails.name} decks`}>
        <div className="w-full lg:w-[400px]">
          <CardSearch value={search} onChange={setSearch} />
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <DonutChart
            data={typeDistribution}
            title="Card Type Distribution"
            description="Breakdown of card types in the deck"
            valueKey="count"
            centerLabel="Cards"
            footerMessage="Based on current selection"
          />
        </div>
        <div className="lg:col-span-3">
          <Card className="h-full shadow-sm transition-shadow duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Card Type Breakdown</CardTitle>
              <CardDescription>Distribution of card types in {commanderDetails.name} decks</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {typeDistribution.map((type) => (
                  <div
                    key={type.name}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    onClick={() => scrollToTable(type.type)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        scrollToTable(type.type);
                      }
                    }}>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{type.name}</div>
                      <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-bold tabular-nums">{type.count}</div>
                        <div className="text-sm text-muted-foreground">
                          ({((type.count / filteredData.length) * 100).toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="text-sm">
              <div className="flex gap-2 font-medium leading-none">
                {filteredData.length} unique card{filteredData.length > 1 ? "s" : ""} are played across all{" "}
                {commanderDetails.name} decks.
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div className="space-y-6">
        {filteredData.length === 0 ? (
          <NoData message="No cards found" suggestion="Try adjusting your search query or filters" />
        ) : (
          CARD_TYPES.map((type) => {
            const typeData = cardsByType[type];
            if (typeData.length === 0) return null;
            const typeLabel = type === "Sorcery" ? "Sorceries" : `${type}s`;

            return (
              <Card key={type} id={`table-${type}`}>
                <CardHeader className="pb-2">
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      {CARD_TYPE_ICONS[type] && createElement(CARD_TYPE_ICONS[type], { className: "h-5 w-5" })}
                      <CardTitle className="text-xl">{typeLabel}</CardTitle>
                    </div>
                    <CardDescription className="text-sm">
                      <Badge className="inline-flex items-center gap-1">
                        {typeData.length} card{typeData.length > 1 ? "s" : ""}
                      </Badge>
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <DataTable
                    columns={columns}
                    data={typeData.map(
                      (cardEntry): CommanderCardDisplay => ({
                        id: cardEntry.card.id,
                        name: cardEntry.card.name,
                        type: cardEntry.card.typeLine,
                        manaCost: cardEntry.card.manaCost || "",
                        inclusion: cardEntry.inclusion,
                        winRate: cardEntry.winRate || 0,
                        drawRate: cardEntry.drawRate || 0
                      })
                    )}
                    enableRowSelection={false}
                    enableSearch={false}
                    enableViewOptions={false}
                  />
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
