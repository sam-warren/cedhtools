import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="space-y-12">
        {/* Hero Section */}
        <section className="flex flex-col lg:flex-row gap-10">
          {/* Commander Image */}
          <Skeleton className="w-[180px] aspect-[488/680] rounded-lg shrink-0" />

          {/* Commander Info */}
          <div className="flex-1 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-10 w-80 max-w-full" />
              <Skeleton className="h-5 w-28 mt-2" />
            </div>

            {/* Deck Stats */}
            <div className="flex flex-wrap gap-x-12 gap-y-4">
              {[
                { label: "w-24", value: "w-20", sub: "w-36" },
                { label: "w-28", value: "w-12", sub: "w-24" },
                { label: "w-28", value: "w-16", sub: "w-32" },
                { label: "w-32", value: "w-14", sub: "w-32" },
              ].map((stat, i) => (
                <div key={i}>
                  <Skeleton className={`h-4 ${stat.label} mb-1`} />
                  <Skeleton className={`h-8 ${stat.value}`} />
                  <Skeleton className={`h-3 ${stat.sub} mt-1`} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Insights Section */}
        <section className="border-t pt-10">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border rounded-lg p-5 space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <div className="space-y-2 pt-2">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Card Tables Section */}
        <section className="border-t pt-10">
          {/* Tab Navigation */}
          <div className="flex items-center gap-6 mb-6">
            <div className="pb-2 border-b-2 border-foreground">
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="pb-2">
              <Skeleton className="h-5 w-36" />
            </div>
          </div>

          {/* Description */}
          <Skeleton className="h-4 w-[480px] max-w-full mb-4" />

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              <Skeleton className="h-9 w-full sm:w-64" />
              <Skeleton className="h-9 w-44" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 px-4 text-left">
                    <Skeleton className="h-4 w-16" />
                  </th>
                  <th className="h-10 px-4 text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </th>
                  <th className="h-10 px-4 text-right">
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </th>
                  <th className="h-10 px-4 text-right">
                    <Skeleton className="h-4 w-24 ml-auto" />
                  </th>
                  <th className="h-10 px-4 text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...Array(10)].map((_, i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="h-12 px-4">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    <td className="h-12 px-4">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </td>
                    <td className="h-12 px-4">
                      <Skeleton className="h-4 w-14 ml-auto" />
                    </td>
                    <td className="h-12 px-4">
                      <Skeleton className="h-4 w-14 ml-auto" />
                    </td>
                    <td className="h-12 px-4">
                      <Skeleton className="h-4 w-10 ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between py-4">
            <Skeleton className="h-4 w-40" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-4 w-20 mx-2" />
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>

          {/* Unknown Cards Section */}
          <div className="mt-8 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-3 w-[480px] max-w-full mb-3" />
            <div className="flex flex-wrap gap-2">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-24 rounded" />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
