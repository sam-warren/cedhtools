"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/shared/data-table/column-header";
import { WinRateBadge } from "@/components/ui/win-rate-badge";
import { InclusionRateBadge } from "@/components/ui/inclusion-rate-badge";
import Link from "next/link";

// Define the type for a card row
export type CardData = {
  id: string;
  name: string;
  scryfallId: string;
  type: number;
  quantity: number;
  stats: {
    wins: number;
    losses: number;
    draws: number;
    entries: number;
    winRate: number;
    inclusionRate: number;
    winRateDiff: number;
    confidence: number;
  } | null;
};

export const columns = (commanderWinRate: number): ColumnDef<CardData>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Card Name" />
    ),
    cell: ({ row }) => {
      const scryfallId = row.original.scryfallId;
      const hasQuantity = row.original.quantity > 1;

      return (
        <div className="flex items-center">
          {hasQuantity && (
            <div className="mr-2">
              <Badge variant="outline">{row.original.quantity}x</Badge>
            </div>
          )}
          <Link
            href={`https://scryfall.com/card/${scryfallId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {row.getValue("name")}
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "type_line",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Card Type" />
    ),
    cell: ({ row }) => {
      const typeValue = row.getValue("type_line") as number;
      return <div>{typeValue}</div>;
    },
  },
  {
    accessorKey: "stats.inclusionRate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Inclusion %" />
    ),
    cell: ({ row }) => {
      const inclusionRate = row.original.stats?.inclusionRate;
      const entries = row.original.stats?.entries;
      const cardName = row.original.name;

      if (inclusionRate === undefined) return <div>-</div>;

      return (
        <InclusionRateBadge
          value={inclusionRate}
          variant="outline"
          tooltipData={{
            cardName: cardName,
            decksIncluding: entries || 0,
            totalDecks: Math.round(entries ? (entries / (inclusionRate / 100)) : 0)
          }}
        />
      );
    },
  },
  {
    accessorKey: "stats.winRateDiff",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Impact on Win Rate" />
    ),
    cell: ({ row }) => {
      const winRateDiff = row.original.stats?.winRateDiff;
      const winRate = row.original.stats?.winRate;
      const cardName = row.original.name;
      const confidence = row.original.stats?.confidence;

      return winRateDiff !== undefined && winRate !== undefined ? (
        <WinRateBadge
          value={winRateDiff}
          variant="outline"
          useSimpleArrows={false}
          tooltipData={{
            cardName: cardName,
            cardWinRate: winRate,
            commanderWinRate: commanderWinRate,
            confidence: confidence || 0
          }}
        />
      ) : (
        <div>-</div>
      );
    },
  },
];
