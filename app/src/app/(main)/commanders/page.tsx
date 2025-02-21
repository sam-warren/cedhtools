import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { columns, mockData } from "@/components/tables/commander-meta-columns";

export default function CommandersPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Commanders" description="View win rates, popularity, and statistics for cEDH commanders." />
      <DataTable columns={columns} data={mockData} enableRowSelection={false} />
    </div>
  );
}
