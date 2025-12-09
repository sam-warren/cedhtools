import { Suspense } from "react";
import { CardCommanderDetail } from "@/components/cards/card-commander-detail";
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
    <div className="container mx-auto px-4 py-12 md:py-16">
      <Suspense fallback={<CardCommanderSkeleton />}>
        <CardCommanderDetail cardName={decodedName} commanderId={commanderId} />
      </Suspense>
    </div>
  );
}

function CardCommanderSkeleton() {
  return (
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
        </div>
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

