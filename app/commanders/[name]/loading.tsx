import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="space-y-16">
        {/* Hero Section */}
        <section className="flex flex-col lg:flex-row gap-10">
          {/* Commander Image */}
          <Skeleton className="w-[180px] aspect-[488/680] rounded-lg flex-shrink-0" />

          {/* Commander Info */}
          <div className="flex-1 space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-10 w-96 max-w-full" />
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-x-12 gap-y-4">
              {[
                { label: "w-28", value: "w-12", sub: "w-20" },
                { label: "w-20", value: "w-16", sub: "w-24" },
                { label: "w-16", value: "w-20", sub: "w-28" },
              ].map((stat, i) => (
                <div key={i}>
                  <Skeleton className={`h-4 ${stat.label} mb-1`} />
                  <Skeleton className={`h-8 ${stat.value}`} />
                  <Skeleton className={`h-3 ${stat.sub} mt-1`} />
                </div>
              ))}
            </div>

            {/* Time Period Selector */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-40" />
            </div>
          </div>
        </section>

        {/* Performance Trends Section */}
        <section className="border-t pt-12">
          <Skeleton className="h-6 w-40 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-32 mb-4" />
                <Skeleton className="h-[180px] w-full rounded" />
              </div>
            ))}
          </div>
        </section>

        {/* Staple Cards Section */}
        <section className="border-t pt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Skeleton className="h-6 w-28 mb-2" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>

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
        </section>
      </div>
    </div>
  );
}
