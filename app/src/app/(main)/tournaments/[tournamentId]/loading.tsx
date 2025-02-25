import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* Tournament info cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
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

      {/* Tabs skeleton */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent className="px-1">
          <Tabs defaultValue="standings">
            <TabsList className="mb-4">
              <TabsTrigger value="standings" disabled>
                <Skeleton className="h-4 w-20" />
              </TabsTrigger>
              <TabsTrigger value="commanders" disabled>
                <Skeleton className="h-4 w-24" />
              </TabsTrigger>
            </TabsList>
            
            {/* Table skeleton */}
            <div className="rounded-lg">
              <div className="p-2">
                {/* Table header */}
                <div className="flex items-center justify-between py-3 px-4">
                  <Skeleton className="h-5 w-16" /> {/* Rank */}
                  <Skeleton className="h-5 w-48" /> {/* Player */}
                  <Skeleton className="h-5 w-48" /> {/* Commander */}
                  <Skeleton className="h-5 w-24" /> {/* Points */}
                </div>
                
                {/* Table rows */}
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3 px-4 border-t">
                    <Skeleton className="h-5 w-16" /> {/* Rank */}
                    <Skeleton className="h-5 w-48" /> {/* Player */}
                    <Skeleton className="h-5 w-48" /> {/* Commander */}
                    <Skeleton className="h-5 w-24" /> {/* Points */}
                  </div>
                ))}
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Chart skeletons */}
      <div className="grid gap-6 md:grid-cols-2">
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
      </div>
    </div>
  );
} 