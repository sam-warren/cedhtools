"use client";

import { columns } from "@/components/tables/tournaments-columns";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import type { Tournament } from "@/components/tables/tournaments-columns";

interface Props {
  tournaments: Tournament[];
}

export default function TournamentsPage({ tournaments }: Props) {
  return (
    <div className="container space-y-6">
      <PageHeader
        title="Tournaments"
        description="View tournament results, standings, and statistics for cEDH tournaments."
      />
      <DataTable columns={columns} data={tournaments} enableRowSelection={false} />
    </div>
  );
}
