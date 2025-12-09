import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="space-y-12">
        <div className="flex flex-col lg:flex-row gap-10">
          <Skeleton className="w-44 aspect-[488/680] rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-6">
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-72" />
            </div>
            <div className="flex gap-12">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
            <Skeleton className="h-9 w-48" />
          </div>
        </div>
        <div className="border-t pt-12">
          <Skeleton className="h-6 w-24 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-[180px] w-full" />
            <Skeleton className="h-[180px] w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

