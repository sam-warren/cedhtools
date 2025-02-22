import { columns, mockData } from "@/components/tables/players-columns";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";

export default function PlayersPage() {
  return (
    <div className="container space-y-6">
      <PageHeader title="Players" description="View player rankings, tournament history, and performance statistics." />
      <DataTable columns={columns} data={mockData} enableRowSelection={false} />
    </div>
  );
}
