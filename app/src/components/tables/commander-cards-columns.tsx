"use client";

import { ManaCost } from "@/components/icons/mana-symbol";
import { DataTableColumnHeader } from "@/components/ui/column-header";
import type { ColumnDef, Row } from "@tanstack/react-table";
import Link from "next/link";
import { useParams } from "next/navigation";

export type CommanderCard = {
  id: string;
  name: string;
  manaCost: string;
  type: string;
  inclusion: number;
  winRate: number;
  drawRate: number;
};

const CardNameCell = ({ row }: { row: Row<CommanderCard> }) => {
  const params = useParams();
  const commanderId = params.commanderId as string;
  return (
    <Link href={`/commanders/${commanderId}/cards/${row.original.id}`} className="font-medium hover:underline">
      {row.getValue("name")}
    </Link>
  );
};

export const columns: ColumnDef<CommanderCard>[] = [
  {
    accessorKey: "manaCost",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Mana Cost" />,
    cell: ({ row }) => (
      <div className="font-medium">
        <ManaCost cost={row.getValue("manaCost")} />
      </div>
    )
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Card Name" />,
    cell: ({ row }) => <CardNameCell row={row} />
  },
  {
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => <div>{row.getValue("type")}</div>
  },
  {
    accessorKey: "inclusion",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Inclusion %" />,
    cell: ({ row }) => <div>{row.getValue("inclusion")}%</div>
  },
  {
    accessorKey: "winRate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Win Rate" />,
    cell: ({ row }) => <div>{row.getValue("winRate")}%</div>
  },
  {
    accessorKey: "drawRate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Draw Rate" />,
    cell: ({ row }) => <div>{row.getValue("drawRate")}%</div>
  }
];
