"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { WinRateBadge } from "@/components/ui/win-rate-badge";
import { InclusionRateBadge } from "@/components/ui/inclusion-rate-badge";
import Link from "next/link";

// Define the type for a card row
export type OtherCardData = {
  id: string;
  name: string;
  scryfallId: string;
  type: number;
  type_line: string | null;
  stats: {
    wins: number;
    losses: number;
    draws: number;
    entries: number;
    winRate: number;
    inclusionRate: number;
    winRateDiff: number;
  };
};

// Helper function removed and replaced with WinRateBadge component

export const otherCardsColumns = (
  commanderWinRate: number
): ColumnDef<OtherCardData>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Card Name" />
    ),
    cell: ({ row }) => {
      const scryfallId = row.original.scryfallId;

      return (
        <div className="flex items-center">
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
      <DataTableColumnHeader column={column} title="Type" />
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
      const inclusionRate = row.original.stats.inclusionRate;
      const entries = row.original.stats.entries;
      const cardName = row.original.name;

      return (
        <InclusionRateBadge
          value={inclusionRate}
          variant="outline"
          tooltipData={{
            cardName: cardName,
            decksIncluding: entries,
            totalDecks: Math.round(entries / (inclusionRate / 100)),
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
      const winRateDiff = row.original.stats.winRateDiff;
      const winRate = row.original.stats.winRate;
      const cardName = row.original.name;

      return (
        <WinRateBadge
          value={winRateDiff}
          variant="outline"
          useSimpleArrows={false}
          tooltipData={{
            cardName: cardName,
            cardWinRate: winRate,
            commanderWinRate: commanderWinRate,
          }}
        />
      );
    },
  },
];
