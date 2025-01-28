"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ManaCost } from "@/components/icons/mana-symbol";

export type DeckCard = {
  name: string;
  manaCost: string;
  type:
    | "Creature"
    | "Battle"
    | "Planeswalker"
    | "Enchantment"
    | "Instant"
    | "Sorcery"
    | "Artifact"
    | "Land";
  winRate: number;
};

export const cardColumns: ColumnDef<DeckCard>[] = [
  {
    accessorKey: "manaCost",
    header: "Mana Cost",
    cell: ({ row }) => <ManaCost cost={row.getValue("manaCost")} />,
  },
  {
    accessorKey: "name",
    header: "Name",
  },

  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "winRate",
    header: "Win Rate",
    cell: ({ row }) => `${row.getValue<number>("winRate")}%`,
  },
];
