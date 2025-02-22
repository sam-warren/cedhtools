import { columns, mockData } from "@/components/tables/commanders-columns";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";

export default function CommandersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Commanders" description="View win rates, popularity, and statistics for cEDH commanders." />
      <DataTable columns={columns} data={mockData} enableRowSelection={false} />
    </div>
  );
}
