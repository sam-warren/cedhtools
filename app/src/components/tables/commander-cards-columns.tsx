"use client";

import { ManaCost } from "@/components/icons/mana-symbol";
import { DataTableColumnHeader } from "@/components/ui/column-header";
import type { ColumnDef, Row } from "@tanstack/react-table";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CommanderCard } from "@/types/entities/cards";

// Define a display type for the table that flattens the CommanderCard data structure
export type CommanderCardDisplay = {
  id: string;
  name: string;
  manaCost: string;
  type: string;
  inclusion: number;
  winRate: number;
  drawRate: number;
};

const CardNameCell = ({ row }: { row: Row<CommanderCardDisplay> }) => {
  const params = useParams();
  // Safely access the commanderId, defaulting to an empty string if null
  const commanderId = params?.commanderId as string || "";
  
  return (
    <Link href={`/commanders/${commanderId}/cards/${row.original.id}`} className="font-medium hover:underline">
      {row.getValue("name")}
    </Link>
  );
};

export const columns: ColumnDef<CommanderCardDisplay>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Card" />,
    cell: CardNameCell
  },
  {
    accessorKey: "manaCost",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cost" />,
    cell: ({ row }) => {
      const manaCost = row.getValue<string>("manaCost");
      if (!manaCost) return null;
      return <ManaCost cost={manaCost} />;
    }
  },
  {
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => <div className="text-sm text-muted-foreground">{row.getValue<string>("type")}</div>
  },
  {
    accessorKey: "inclusion",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Inclusion %" />,
    cell: ({ row }) => {
      const percentage = (row.getValue<number>("inclusion") * 100).toFixed(1);
      return <div className="font-medium">{percentage}%</div>;
    }
  },
  {
    accessorKey: "winRate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Win %" />,
    cell: ({ row }) => {
      const percentage = (row.getValue<number>("winRate") * 100).toFixed(1);
      return <div className="font-medium">{percentage}%</div>;
    }
  },
  {
    accessorKey: "drawRate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Draw %" />,
    cell: ({ row }) => {
      const percentage = (row.getValue<number>("drawRate") * 100).toFixed(1);
      return <div className="font-medium">{percentage}%</div>;
    }
  }
];
