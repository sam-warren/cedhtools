"use client";

import { columns } from "@/components/tables/players-columns";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import type { Player } from "@/components/tables/players-columns";

interface Props {
  players: Player[];
}

export default function PlayersPage({ players }: Props) {
  return (
    <div className="container space-y-6">
      <PageHeader title="Players" description="View player rankings, tournament history, and performance statistics." />
      <DataTable columns={columns} data={players} enableRowSelection={false} />
    </div>
  );
}
