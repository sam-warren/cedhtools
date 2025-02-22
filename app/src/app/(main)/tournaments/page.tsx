import { columns, mockData } from "@/components/tables/tournaments-columns";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";

export default function TournamentsPage() {
  return (
    <div className="container space-y-6">
      <PageHeader
        title="Tournaments"
        description="View tournament results, standings, and statistics for cEDH tournaments."
      />
      <DataTable columns={columns} data={mockData} enableRowSelection={false} />
    </div>
  );
}
