"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { DataTableColumnHeader } from "../column-header";
import { ManaCost } from "@/components/shared/mana-cost";
import type { CardWithStats } from "@/types/api";

/**
 * Format a delta value with +/- sign, but only if the rounded value is non-zero.
 * Handles edge cases like -0.00 which should display as 0.00.
 */
function formatDelta(value: number, decimals: number): string {
  const formatted = value.toFixed(decimals);
  // Check if the formatted string represents zero (handles both "0.00" and "-0.00")
  const isZero = parseFloat(formatted) === 0;
  if (isZero) {
    // Return absolute zero without sign
    return (0).toFixed(decimals);
  }
  return (value > 0 ? "+" : "") + formatted;
}

export function createStapleCardsColumns(
  commanderId: number
): ColumnDef<CardWithStats>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Card" />
      ),
      cell: ({ row }) => {
        const card = row.original;
        return (
          <div className="min-w-0">
            <Link
              href={`/cards/${encodeURIComponent(card.name)}/commanders/${commanderId}`}
              className="font-medium hover:underline hover:text-primary"
            >
              {card.name}
            </Link>
            {card.type_line && (
              <p className="text-xs text-muted-foreground truncate">
                {card.type_line}
              </p>
            )}
          </div>
        );
      },
      size: 320,
      filterFn: (row, id, value) => {
        const name = row.getValue(id) as string;
        const typeLine = row.original.type_line || "";
        const searchValue = value.toLowerCase();
        return (
          name.toLowerCase().includes(searchValue) ||
          typeLine.toLowerCase().includes(searchValue)
        );
      },
      // Card name column takes remaining space (no fixed size)
    },
    {
      accessorKey: "mana_cost",
      header: "Mana Cost",
      cell: ({ row }) => <ManaCost cost={row.original.mana_cost} size="sm" />,
      enableSorting: false,
      size: 100,
    },
    {
      accessorKey: "play_rate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Play Rate" className="justify-end" />
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {(row.original.play_rate * 100).toFixed(1)}%
        </div>
      ),
      size: 110,
    },
    {
      accessorKey: "win_rate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Win Rate" className="justify-end" />
      ),
      cell: ({ row }) => (
        <div className="text-right">
          {(row.original.win_rate * 100).toFixed(1)}%
        </div>
      ),
      size: 110,
    },
    {
      accessorKey: "win_rate_delta",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="WR Δ" className="justify-end" />
      ),
      cell: ({ row }) => {
        const delta = row.original.win_rate_delta;
        const deltaPercent = delta * 100;
        return (
          <div
            className={`text-right ${
              delta > 0.02
                ? "text-green-500"
                : delta < -0.02
                  ? "text-red-500"
                  : "text-muted-foreground"
            }`}
          >
            {formatDelta(deltaPercent, 2)}%
          </div>
        );
      },
      size: 90,
    },
    {
      accessorKey: "conversion_score_delta",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Conv. Δ" className="justify-end" />
      ),
      cell: ({ row }) => {
        const delta = row.original.conversion_score_delta;
        // Handle NaN or undefined
        if (delta == null || isNaN(delta)) {
          return <div className="text-right text-muted-foreground">—</div>;
        }
        return (
          <div
            className={`text-right ${
              delta > 5
                ? "text-green-500"
                : delta < -5
                  ? "text-red-500"
                  : "text-muted-foreground"
            }`}
          >
            {formatDelta(delta, 0)}
          </div>
        );
      },
      size: 90,
    },
  ];
}