import { Suspense } from "react";
import { CardCommanderDetail } from "./card-commander-detail";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  params: Promise<{ name: string; commanderId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  return {
    title: `${decodedName} Stats`,
    description: `View performance statistics for ${decodedName} in competitive EDH.`,
  };
}

export default async function CardCommanderPage({ params }: PageProps) {
  const { name, commanderId } = await params;
  const decodedName = decodeURIComponent(name);

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<CardCommanderSkeleton />}>
        <CardCommanderDetail cardName={decodedName} commanderId={commanderId} />
      </Suspense>
    </div>
  );
}

function CardCommanderSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6">
        <Skeleton className="w-full md:w-64 h-80 rounded-lg" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

