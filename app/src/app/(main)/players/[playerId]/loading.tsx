import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* Player stats cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <div className="mt-4">
              <Skeleton className="h-9 w-16" />
            </div>
            <Skeleton className="mt-2 h-4 w-full" />
          </div>
        ))}
      </div>

      {/* Commander performance cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="ml-auto">
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="ml-auto">
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance trend chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Recent tournament results table */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Table header */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" /> {/* Date */}
              <Skeleton className="h-5 w-48" /> {/* Tournament */}
              <Skeleton className="h-5 w-48" /> {/* Commander */}
              <Skeleton className="h-5 w-24" /> {/* Standing */}
              <Skeleton className="h-5 w-24" /> {/* Points */}
            </div>
            
            {/* Table rows */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-t">
                <Skeleton className="h-5 w-32" /> {/* Date */}
                <Skeleton className="h-5 w-48" /> {/* Tournament */}
                <Skeleton className="h-5 w-48" /> {/* Commander */}
                <Skeleton className="h-5 w-24" /> {/* Standing */}
                <Skeleton className="h-5 w-24" /> {/* Points */}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 