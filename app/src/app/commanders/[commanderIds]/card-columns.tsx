"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ManaCost } from "@/components/icons/mana-symbol";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import {
  DropdownMenu,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, ExternalLink, Eye, Info, MoreHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/ui/column-header";
import { DiffBadge } from "@/components/badges/diff-badge";
import Link from "next/link";

export type DeckCard = {
  name: string;
  manaCost: string;
  type: "Creature" | "Battle" | "Planeswalker" | "Enchantment" | "Instant" | "Sorcery" | "Artifact" | "Land";
  winRate: number;
  winRateDiff: number;
  inclusionRate: number;
};

export const cardColumns: ColumnDef<DeckCard>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="h-4 w-4"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="h-4 w-4"
      />
    )
  },
  {
    accessorKey: "manaCost",
    header: "Mana Cost",
    cell: ({ row }) => <ManaCost cost={row.getValue("manaCost")} />
  },
  {
    accessorKey: "name",
    header: "Name"
  },

  {
    accessorKey: "type",
    header: "Type"
  },

  {
    accessorKey: "inclusionRate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Inclusion Rate" />,
    cell: ({ row }) => `${row.getValue<number>("inclusionRate")}%`
  },
  {
    accessorKey: "winRateDiff",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Win Rate" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <DiffBadge diff={row.getValue<number>("winRateDiff")} />
      </div>
    )
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const router = useRouter();
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push(`/commanders/1/cards/1`)}>
              <Info className="h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="https://www.scryfall.com/random" target="_blank" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                View on Scryfall
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];
