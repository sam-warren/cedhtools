import { columns } from "@/components/tables/commanders-columns";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { getCommanders } from "@/services/commanders";

export default async function CommandersPage() {
  const commanders = await getCommanders();

  return (
    <div className="space-y-6">
      <PageHeader title="Commanders" description="View win rates, popularity, and statistics for cEDH commanders." />
      <DataTable columns={columns} data={commanders} enableRowSelection={false} />
    </div>
  );
}
