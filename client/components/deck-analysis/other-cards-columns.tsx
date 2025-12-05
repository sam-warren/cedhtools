"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/data-table/column-header";
import { WinRateBadge } from "@/components/ui/win-rate-badge";
import { InclusionRateBadge } from "@/components/ui/inclusion-rate-badge";

// Define the type for a card row
export type OtherCardData = {
  id: string;
  name: string;
  stats: {
    wins: number;
    losses: number;
    draws: number;
    entries: number;
    winRate: number;
    inclusionRate: number;
    winRateDiff: number;
    confidence: number;
  };
};

export const otherCardsColumns = (
  commanderWinRate: number
): ColumnDef<OtherCardData>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Card Name" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex items-center font-medium">
          {row.getValue("name")}
        </div>
      );
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
      const confidence = row.original.stats.confidence;

      return (
        <WinRateBadge
          value={winRateDiff}
          variant="outline"
          useSimpleArrows={false}
          tooltipData={{
            cardName: cardName,
            cardWinRate: winRate,
            commanderWinRate: commanderWinRate,
            confidence: confidence
          }}
        />
      );
    },
  },
];
