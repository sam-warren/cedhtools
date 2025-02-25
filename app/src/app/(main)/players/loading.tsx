import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";

export default function Loading() {
  return (
    <div className="container space-y-6">
      <PageHeader 
        title="Players" 
        description="View player rankings, tournament history, and performance statistics." 
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
            <Skeleton className="h-5 w-10" /> {/* Rank */}
            <Skeleton className="h-5 w-40" /> {/* Name */}
            <Skeleton className="h-5 w-24" /> {/* Tournaments */}
            <Skeleton className="h-5 w-24" /> {/* Wins */}
            <Skeleton className="h-5 w-24" /> {/* Win Rate */}
            <Skeleton className="h-5 w-24" /> {/* ELO */}
          </div>
          
          {/* Table rows */}
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-4 border-t">
              <Skeleton className="h-5 w-10" /> {/* Rank */}
              <Skeleton className="h-5 w-40" /> {/* Name */}
              <Skeleton className="h-5 w-24" /> {/* Tournaments */}
              <Skeleton className="h-5 w-24" /> {/* Wins */}
              <Skeleton className="h-5 w-24" /> {/* Win Rate */}
              <Skeleton className="h-5 w-24" /> {/* ELO */}
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