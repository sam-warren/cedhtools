"use client";

import { ManaCost } from "@/components/icons/mana-symbol";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/column-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/app-utils";
import type { ColumnDef } from "@tanstack/react-table";
import { Info, MoreHorizontal, Trophy } from "lucide-react";
import Link from "next/link";
import type { CommanderStats } from "@/types/entities/commanders";

export const columns: ColumnDef<CommanderStats>[] = [
  {
    accessorKey: "standing",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Standing" />,
    cell: ({ row }) => {
      const standing = row.getValue<number>("standing");
      if (standing <= 3) {
        const trophyColors = {
          1: "text-yellow-400",
          2: "text-zinc-400",
          3: "text-amber-600"
        };
        return (
          <div className="flex w-12 items-center">
            <Trophy className={cn("h-4 w-4", trophyColors[standing as keyof typeof trophyColors])} />
          </div>
        );
      }
      return <div className="w-12 font-medium">{standing}</div>;
    }
  },
  {
    accessorKey: "colorIdentity",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Colors" />,
    cell: ({ row }) => {
      const colorIdentity = row.getValue<string>("colorIdentity");
      return <ManaCost cost={colorIdentity} />;
    }
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Commander" />,
    cell: ({ row }) => (
      <Link href={`/commanders/${row.original.}`} className="hover:underline">
        {row.getValue("name")}
      </Link>
    )
  },
  {
    accessorKey: "metaShare",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Meta Share" />,
    cell: ({ row }) => <div>{row.getValue<number>("metaShare").toFixed(2)}%</div>
  },
  {
    accessorKey: "winRate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Win Rate" />,
    cell: ({ row }) => <div>{row.getValue<number>("winRate").toFixed(1)}%</div>
  },
  {
    accessorKey: "drawRate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Draw Rate" />,
    cell: ({ row }) => <div>{row.getValue<number>("drawRate").toFixed(1)}%</div>
  },
  {
    accessorKey: "entries",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Entries" />,
    cell: ({ row }) => <div>{row.getValue<number>("entries")}</div>
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
              <Link href={`/commanders/${row.original.standing}`} className="flex items-center">
                <Info className="mr-2 h-4 w-4" />
                Show Details
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];
