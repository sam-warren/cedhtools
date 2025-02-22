import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { CARD_TYPES, CARD_TYPE_ICONS } from "@/lib/constants/card";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeader title="Commander Cards" description="All cards played in this commander's decks">
        <div className="w-full lg:w-[400px]">
          <Skeleton className="h-10" />
        </div>
      </PageHeader>

      <div className="space-y-6">
        {CARD_TYPES.map((type) => (
          <Card key={type}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-8 w-48" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Table header skeleton */}
                <div className="flex items-center gap-4 px-4">
                  <Skeleton className="h-4 w-8" /> {/* Mana cost */}
                  <Skeleton className="h-4 w-32" /> {/* Name */}
                  <Skeleton className="h-4 w-24" /> {/* Type */}
                  <Skeleton className="h-4 w-16" /> {/* Inclusion */}
                  <Skeleton className="h-4 w-16" /> {/* Win Rate */}
                  <Skeleton className="h-4 w-16" /> {/* Draw Rate */}
                </div>

                {/* Table rows skeleton */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
