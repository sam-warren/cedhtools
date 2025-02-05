"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Info, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { DataTableColumnHeader } from "@/components/ui/column-header";
import { ManaCost } from "@/components/icons/mana-symbol";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

export type Commander = {
  id: string;
  name: string;
  winRate: number;
  metaShare: number;
  tournamentWins: number;
  top4s: number;
  top16s: number;
  entries: number;
  colorIdentity: string;
};

export const columns: ColumnDef<Commander>[] = [
  {
    accessorKey: "colorIdentity",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Color Identity" />,
    cell: ({ row }) => {
      const colorIdentity = row.getValue<string>("colorIdentity");
      return <ManaCost cost={colorIdentity} />;
    }
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Commander" />,
    cell: ({ row }) => (
      <Link href={`/commanders/${row.original.id}`} className="hover:underline">
        {row.getValue("name")}
      </Link>
    )
  },
  {
    accessorKey: "winRate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Win Rate" />,
    cell: ({ row }) => `${row.getValue<number>("winRate").toFixed(2)}%`
  },
  {
    accessorKey: "metaShare",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Meta Share" />,
    cell: ({ row }) => `${row.getValue<number>("metaShare").toFixed(2)}%`
  },
  {
    accessorKey: "tournamentWins",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tournament Wins" />
  },
  {
    accessorKey: "top4s",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Top 4s" />
  },
  {
    accessorKey: "top16s",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Top 16s" />
  },
  {
    accessorKey: "entries",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Entries" />
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
            <DropdownMenuItem onClick={() => router.push(`/commanders/1`)}>
              <Info className="h-4 w-4" />
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];
