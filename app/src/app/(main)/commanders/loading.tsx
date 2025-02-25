import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Commanders" 
        description="View win rates, popularity, and statistics for cEDH commanders." 
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* Chart skeleton for Meta Share Distribution */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5 pb-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
          <div className="flex h-[300px] items-center justify-center">
            <Skeleton className="h-[250px] w-[250px] rounded-full" />
          </div>
          <div className="pt-4">
            <Skeleton className="h-4 w-full" />
          </div>
        </div>

        {/* Chart skeleton for Top Commander Performance */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5 pb-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex h-[300px] items-center justify-center">
            <Skeleton className="h-[250px] w-[250px] rounded-full" />
          </div>
          <div className="pt-4">
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>

      {/* DataTable skeleton */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between pb-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-t">
              <Skeleton className="h-6 w-48" />
              <div className="flex space-x-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 