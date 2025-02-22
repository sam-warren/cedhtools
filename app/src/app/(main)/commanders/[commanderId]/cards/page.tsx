"use client";

import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { columns } from "@/components/tables/commander-cards-columns";
import { CardSearch } from "@/components/ui/card-search";
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { NoData } from "@/components/ui/no-data";
import { useState, useMemo, createElement } from "react";
import { CARD_TYPES, CARD_TYPE_ICONS } from "@/lib/constants/card";
import { commanderData } from "@/lib/mock/commander-data";
import { Badge } from "@/components/ui/badge";
interface Props {
  params: {
    commanderId: string;
  };
}

export default function CommanderCardsPage({ params }: Props) {
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    if (!search) return commanderData.cards;
    const searchLower = search.toLowerCase();
    return commanderData.cards.filter((card) => card.name.toLowerCase().includes(searchLower));
  }, [search]);

  const cardsByType = useMemo(() => {
    const grouped = {} as Record<string, typeof commanderData.cards>;
    CARD_TYPES.forEach((type) => {
      grouped[type] = filteredData.filter((card) => card.type.includes(type));
    });
    return grouped;
  }, [filteredData]);

  return (
    <div className="space-y-6">
      <PageHeader title="Commander Cards" description="All cards played in Kinnan, Bonder Prodigy decks">
        <div className="w-full lg:w-[400px]">
          <CardSearch value={search} onChange={setSearch} />
        </div>
      </PageHeader>
      <div className="space-y-6">
        {filteredData.length === 0 ? (
          <NoData
            message="No cards found"
            suggestion="Try adjusting your search query or filters"
          />
        ) : CARD_TYPES.map((type) => {
          const typeData = cardsByType[type];
          if (typeData.length === 0) return null;

          return (
            <Card key={type}>
              <CardHeader className="pb-2">
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    {CARD_TYPE_ICONS[type] && createElement(CARD_TYPE_ICONS[type], { className: "h-5 w-5" })}
                    <CardTitle className="text-xl">{type === "Sorcery" ? "Sorceries" : `${type}s`}</CardTitle>
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
                  data={typeData}
                  enableRowSelection={false}
                  enableSearch={false}
                  enableViewOptions={false}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
