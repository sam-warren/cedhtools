import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { columns, mockData } from "@/components/tables/tournament-columns";

export default function TournamentsPage() {
  return (
    <div className="container space-y-6">
      <PageHeader 
        title="Tournaments" 
        description="View tournament results, standings, and statistics for cEDH tournaments."
        showFilters
      />
      <DataTable columns={columns} data={mockData} enableRowSelection={false} />
    </div>
  );
}
