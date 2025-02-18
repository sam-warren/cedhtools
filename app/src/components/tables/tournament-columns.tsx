"use client";

import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/column-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import { Info, MoreHorizontal } from "lucide-react";
import Link from "next/link";

export type Tournament = {
  id: string;
  name: string;
  date: string;
  players: number;
  swissRounds: number;
  topCut: number;
  winner: string;
  winningCommander: string;
};

// Mock data for the tournament table
export const mockData: Tournament[] = [
  {
    id: "t123",
    name: "cEDH Weekly Championship",
    date: "2024-03-15",
    players: 64,
    swissRounds: 6,
    topCut: 8,
    winner: "John Smith",
    winningCommander: "Kinnan, Bonder Prodigy"
  },
  {
    id: "t124",
    name: "March Madness cEDH",
    date: "2024-03-10",
    players: 128,
    swissRounds: 7,
    topCut: 16,
    winner: "Jane Doe",
    winningCommander: "Najeela, the Blade-Blossom"
  },
  {
    id: "t125",
    name: "Winter Championship 2024",
    date: "2024-02-28",
    players: 96,
    swissRounds: 6,
    topCut: 8,
    winner: "Mike Johnson",
    winningCommander: "Tymna, The Weaver // Thrasios, Triton Hero"
  },
  {
    id: "t126",
    name: "Regional Qualifier #1",
    date: "2024-02-15",
    players: 48,
    swissRounds: 5,
    topCut: 8,
    winner: "Sarah Wilson",
    winningCommander: "Minsc & Boo, Timeless Heroes"
  },
  {
    id: "t127",
    name: "Monthly Championship",
    date: "2024-02-01",
    players: 72,
    swissRounds: 6,
    topCut: 8,
    winner: "David Brown",
    winningCommander: "Kraum // Tymna"
  }
];

export const columns: ColumnDef<Tournament>[] = [
  {
    accessorKey: "date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"));
      return date.toLocaleDateString();
    }
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tournament" />,
    cell: ({ row }) => (
      <Link href={`/tournaments/${row.original.id}`} className="hover:underline">
        {row.getValue("name")}
      </Link>
    )
  },
  {
    accessorKey: "players",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Players" />
  },
  {
    accessorKey: "swissRounds",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Swiss Rounds" />
  },
  {
    accessorKey: "topCut",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Top Cut" />,
    cell: ({ row }) => `Top ${row.getValue<number>("topCut")}`
  },
  {
    accessorKey: "winner",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Winner" />,
    cell: ({ row }) => (
      <Link href={`/players/${row.getValue<string>("winner").toLowerCase().replace(" ", "-")}`} className="hover:underline">
        {row.getValue<string>("winner")}
      </Link>
    )
  },
  {
    accessorKey: "winningCommander",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Winning Commander" />,
    cell: ({ row }) => (
      <Link href={`/commanders/${row.original.id.replace("t", "c")}`} className="hover:underline">
        {row.getValue<string>("winningCommander")}
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
              <Link href={`/tournaments/${row.original.id}`} className="flex items-center">
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