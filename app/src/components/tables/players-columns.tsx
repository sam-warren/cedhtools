"use client";

import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/column-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Player } from "@/types/api/players";
import type { ColumnDef } from "@tanstack/react-table";
import { Info, MoreHorizontal } from "lucide-react";
import Link from "next/link";

// Mock data for the player table
export const mockData: Player[] = [
  {
    id: "p123",
    name: "John Smith",
    entries: 25,
    wins: 45,
    losses: 22,
    draws: 8,
    byes: 2,
    topCuts: 8,
    winRate: 62.5,
    drawRate: 11.1,
    mostPlayedCommander: "Kinnan, Bonder Prodigy"
  },
  {
    id: "p124",
    name: "Jane Doe",
    entries: 30,
    wins: 58,
    losses: 25,
    draws: 7,
    byes: 3,
    topCuts: 12,
    winRate: 65.2,
    drawRate: 7.9,
    mostPlayedCommander: "Najeela, the Blade-Blossom"
  },
  {
    id: "p125",
    name: "Mike Johnson",
    entries: 20,
    wins: 35,
    losses: 21,
    draws: 6,
    byes: 1,
    topCuts: 6,
    winRate: 58.7,
    drawRate: 10.0,
    mostPlayedCommander: "Tymna, The Weaver // Thrasios, Triton Hero"
  },
  {
    id: "p126",
    name: "Sarah Wilson",
    entries: 15,
    wins: 25,
    losses: 18,
    draws: 4,
    byes: 1,
    topCuts: 4,
    winRate: 55.3,
    drawRate: 8.9,
    mostPlayedCommander: "Minsc & Boo, Timeless Heroes"
  },
  {
    id: "p127",
    name: "David Brown",
    entries: 28,
    wins: 52,
    losses: 28,
    draws: 6,
    byes: 2,
    topCuts: 9,
    winRate: 61.8,
    drawRate: 7.1,
    mostPlayedCommander: "Kraum // Tymna"
  }
];

export const columns: ColumnDef<Player>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Player" />,
    cell: ({ row }) => (
      <Link href={`/players/${row.original.id}`} className="hover:underline">
        {row.getValue("name")}
      </Link>
    )
  },
  {
    accessorKey: "entries",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Entries" />
  },
  {
    accessorKey: "wins",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Wins" />
  },
  {
    accessorKey: "losses",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Losses" />
  },
  {
    accessorKey: "draws",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Draws" />
  },
  {
    accessorKey: "byes",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Byes" />
  },
  {
    accessorKey: "topCuts",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Top Cuts" />
  },
  {
    accessorKey: "winRate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Win Rate" />,
    cell: ({ row }) => `${row.getValue<number>("winRate").toFixed(1)}%`
  },
  {
    accessorKey: "drawRate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Draw Rate" />,
    cell: ({ row }) => `${row.getValue<number>("drawRate").toFixed(1)}%`
  },
  {
    accessorKey: "mostPlayedCommander",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Most Played Commander" />,
    cell: ({ row }) => (
      <Link href={`/commanders/${row.original.id.replace("p", "c")}`} className="hover:underline">
        {row.getValue<string>("mostPlayedCommander")}
      </Link>
    )
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/players/${row.original.id}`} className="flex items-center">
                <Info className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];
