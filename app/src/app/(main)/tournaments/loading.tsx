import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";

export default function Loading() {
  return (
    <div className="container space-y-6">
      <PageHeader
        title="Tournaments"
        description="View tournament results, standings, and statistics for cEDH tournaments."
      />
      
      {/* DataTable skeleton */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between pb-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          
          {/* Table header */}
          <div className="flex items-center justify-between py-3 border-t">
            <Skeleton className="h-5 w-20" /> {/* Date */}
            <Skeleton className="h-5 w-48" /> {/* Name */}
            <Skeleton className="h-5 w-32" /> {/* Location */}
            <Skeleton className="h-5 w-24" /> {/* Players */}
            <Skeleton className="h-5 w-24" /> {/* Format */}
          </div>
          
          {/* Table rows */}
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-4 border-t">
              <Skeleton className="h-5 w-20" /> {/* Date */}
              <Skeleton className="h-5 w-48" /> {/* Name */}
              <Skeleton className="h-5 w-32" /> {/* Location */}
              <Skeleton className="h-5 w-24" /> {/* Players */}
              <Skeleton className="h-5 w-24" /> {/* Format */}
            </div>
          ))}
          
          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
} 