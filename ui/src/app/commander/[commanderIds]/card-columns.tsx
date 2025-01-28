"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ManaCost } from "@/components/icons/mana-symbol";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/ui/column-header";

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
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="w-4 h-4"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="w-4 h-4"
      />
    ),
  },
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Win Rate" />
    ),
    cell: ({ row }) => `${row.getValue<number>("winRate")}%`,
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
            <DropdownMenuItem
              onClick={() => router.push(`/commander/1/card/1`)}
            >
              View
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
