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
import {
  ExternalLink,
  Info,
  Layers,
  MoreHorizontal,
  Trophy,
  User,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/ui/column-header";
import { DiffBadge } from "@/components/badges/diff-badge";
import Link from "next/link";

export type Deck = {
  name: string;
  player: string;
  standing: string;
  wins: number;
  draws: number;
  losses: number;
  moxfieldUrl: string;
  tournament: string;
};

export const deckColumns: ColumnDef<Deck>[] = [
  {
    accessorKey: "name",
    header: "Deck Name",
  },
  {
    accessorKey: "player",
    header: "Player",
  },
  {
    accessorKey: "tournament",
    header: "Tournament",
  },
  {
    accessorKey: "standing",
    header: "Standing",
  },
  {
    accessorKey: "wins",
    header: "Wins",
  },
  {
    accessorKey: "draws",
    header: "Draws",
  },
  {
    accessorKey: "losses",
    header: "Losses",
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
            <DropdownMenuItem onClick={() => router.push(`/decks/1234567890`)}>
              <Layers className="h-4 w-4" />
              View Deck
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Trophy className="h-4 w-4" />
              View Tournament
            </DropdownMenuItem>
            <DropdownMenuItem>
              <User className="h-4 w-4" />
              View Player
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link
                href="https://moxfield.com/decks/Z_gxTa2YxEy3vBIdHmSd5g"
                target="_blank"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View deck on Moxfield
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
