"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { DataTableColumnHeader } from "../column-header";
import { ManaCost } from "@/components/shared/mana-cost";
import type { CardWithStats } from "@/types/api";

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
          <div>
            <Link
              href={`/cards/${encodeURIComponent(card.name)}/commanders/${commanderId}`}
              className="font-medium hover:underline hover:text-primary"
            >
              {card.name}
            </Link>
            {card.type_line && (
              <p className="text-xs text-muted-foreground truncate max-w-[280px]">
                {card.type_line}
              </p>
            )}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const name = row.getValue(id) as string;
        const typeLine = row.original.type_line || "";
        const searchValue = value.toLowerCase();
        return (
          name.toLowerCase().includes(searchValue) ||
          typeLine.toLowerCase().includes(searchValue)
        );
      },
    },
    {
      accessorKey: "mana_cost",
      header: "Mana Cost",
      cell: ({ row }) => <ManaCost cost={row.original.mana_cost} size="sm" />,
      enableSorting: false,
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
    },
    {
      accessorKey: "win_rate_delta",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="WR Δ" className="justify-end" />
      ),
      cell: ({ row }) => {
        const delta = row.original.win_rate_delta;
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
            {delta >= 0 ? "+" : ""}
            {(delta * 100).toFixed(1)}%
          </div>
        );
      },
    },
    {
      accessorKey: "conversion_rate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Conversion" className="justify-end" />
      ),
      cell: ({ row }) => (
        <div className="text-right">
          {(row.original.conversion_rate * 100).toFixed(1)}%
        </div>
      ),
    },
  ];
}