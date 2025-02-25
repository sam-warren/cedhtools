"use client";

import { columns } from "@/components/tables/commanders-columns";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { DonutChart } from "@/components/charts/donut-chart";
import { RadialChart } from "@/components/charts/radial-chart";
import type { CommanderMeta } from "@/types/api/commanders";

interface Props {
  commanders: CommanderMeta[];
}

export default function CommandersPage({ commanders }: Props) {
  return (
    <div className="space-y-6">
      <PageHeader title="Commanders" description="View win rates, popularity, and statistics for cEDH commanders." />

      <div className="grid gap-4 md:grid-cols-2">
        <DonutChart
          data={commanders}
          title="Meta Share Distribution"
          description="Top 5 commanders by meta share"
          valueKey="metaShare"
          centerLabel="Meta Share %"
          footerMessage="Based on total tournament entries"
          footerDescription="A wide variety of commanders were played, with no one commander dominating the meta."
        />

        {commanders.length > 0 && (
          <RadialChart
            data={commanders[0]}
            title="Top Commander Performance"
            description={commanders[0].name}
            valueKey="winRate"
            maxValue={100}
            centerLabel="Win Rate %"
            footerMessage="This deck has been performing well in tournaments"
            footerDescription="This deck has been performing well in tournaments"
          />
        )}
      </div>

      <DataTable columns={columns} data={commanders} enableRowSelection={false} />
    </div>
  );
}
