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
import type { ColumnDef } from "@tanstack/react-table";
import { Info, MoreHorizontal, Trophy } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/app-utils";

export type CommanderMeta = {
  position: number;
  name: string;
  colorIdentity: string;
  winRate: number;
  drawRate: number;
  popularity: number;
};

// Mock data for the commander meta table
export const mockData: CommanderMeta[] = [
  {
    position: 1,
    name: "Kenrith, the Returned King",
    colorIdentity: "{W}{U}{B}{R}{G}",
    winRate: 23.5,
    drawRate: 15.2,
    popularity: 342
  },
  {
    position: 2,
    name: "Thrasios, Triton Hero // Tymna the Weaver",
    colorIdentity: "{W}{U}{B}{G}",
    winRate: 22.8,
    drawRate: 14.9,
    popularity: 289
  },
  {
    position: 3,
    name: "Kraum, Ludevic's Opus // Tymna the Weaver",
    colorIdentity: "{W}{U}{B}{R}",
    winRate: 21.9,
    drawRate: 14.5,
    popularity: 256
  },
  {
    position: 4,
    name: "Minsc & Boo, Timeless Heroes",
    colorIdentity: "{R}{G}",
    winRate: 21.2,
    drawRate: 13.8,
    popularity: 198
  },
  {
    position: 5,
    name: "Malcolm, Keen-Eyed Navigator // Tana, the Bloodsower",
    colorIdentity: "{U}{R}{G}",
    winRate: 20.8,
    drawRate: 13.5,
    popularity: 167
  },
  {
    position: 6,
    name: "Najeela, the Blade-Blossom",
    colorIdentity: "{W}{U}{B}{R}{G}",
    winRate: 20.5,
    drawRate: 13.2,
    popularity: 154
  },
  {
    position: 7,
    name: "Urza, Lord High Artificer",
    colorIdentity: "{U}",
    winRate: 20.1,
    drawRate: 12.9,
    popularity: 145
  },
  {
    position: 8,
    name: "Kinnan, Bonder Prodigy",
    colorIdentity: "{U}{G}",
    winRate: 19.8,
    drawRate: 12.6,
    popularity: 132
  },
  {
    position: 9,
    name: "Krark, the Thumbless // Sakashima of a Thousand Faces",
    colorIdentity: "{U}{R}",
    winRate: 19.5,
    drawRate: 12.4,
    popularity: 128
  },
  {
    position: 10,
    name: "Abdel Adrian, Gorion's Ward // Candlekeep Sage",
    colorIdentity: "{W}{U}",
    winRate: 19.2,
    drawRate: 12.1,
    popularity: 121
  },
  {
    position: 11,
    name: "Tevesh Szat, Doom of Fools // Thrasios, Triton Hero",
    colorIdentity: "{U}{B}{G}",
    winRate: 18.9,
    drawRate: 11.9,
    popularity: 115
  },
  {
    position: 12,
    name: "Rograkh, Son of Rohgahh // Yoshimaru, Ever Faithful",
    colorIdentity: "{W}{R}",
    winRate: 18.6,
    drawRate: 11.7,
    popularity: 108
  },
  {
    position: 13,
    name: "Raffine, Scheming Seer",
    colorIdentity: "{W}{U}{B}",
    winRate: 18.3,
    drawRate: 11.5,
    popularity: 102
  },
  {
    position: 14,
    name: "Grist, the Hunger Tide",
    colorIdentity: "{B}{G}",
    winRate: 18.0,
    drawRate: 11.3,
    popularity: 98
  },
  {
    position: 15,
    name: "Magda, Brazen Outlaw",
    colorIdentity: "{R}",
    winRate: 17.8,
    drawRate: 11.1,
    popularity: 92
  },
  {
    position: 16,
    name: "Yuriko, the Tiger's Shadow",
    colorIdentity: "{U}{B}",
    winRate: 17.5,
    drawRate: 10.9,
    popularity: 89
  },
  {
    position: 17,
    name: "Winota, Joiner of Forces",
    colorIdentity: "{W}{R}",
    winRate: 17.2,
    drawRate: 10.7,
    popularity: 85
  },
  {
    position: 18,
    name: "Selvala, Heart of the Wilds",
    colorIdentity: "{G}",
    winRate: 16.9,
    drawRate: 10.5,
    popularity: 82
  },
  {
    position: 19,
    name: "Inalla, Archmage Ritualist",
    colorIdentity: "{U}{B}{R}",
    winRate: 16.6,
    drawRate: 10.3,
    popularity: 78
  },
  {
    position: 20,
    name: "Shorikai, Genesis Engine",
    colorIdentity: "{W}{U}",
    winRate: 16.3,
    drawRate: 10.1,
    popularity: 75
  }
];

export const columns: ColumnDef<CommanderMeta>[] = [
  {
    accessorKey: "position",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Standing" />,
    cell: ({ row }) => {
      const position = row.getValue<number>("position");
      if (position <= 3) {
        const trophyColors = {
          1: "text-yellow-400",
          2: "text-zinc-400",
          3: "text-amber-600"
        };
        return (
          <div className="w-12 flex items-center">
            <Trophy className={cn("h-4 w-4", trophyColors[position as keyof typeof trophyColors])} />
          </div>
        );
      }
      return <div className="w-12 font-medium">{position}</div>;
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
      <Link href={`/commanders/${row.original.position}`} className="hover:underline">
        {row.getValue("name")}
      </Link>
    )
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
    accessorKey: "popularity",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Popularity" />,
    cell: ({ row }) => <div>{row.getValue<number>("popularity")}</div>
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
              <Link href={`/commanders/${row.original.position}`} className="flex items-center">
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
