import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CommanderDetail } from "./commander-detail";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  return {
    title: decodedName,
    description: `View tournament statistics, staple cards, and deck analysis for ${decodedName} in competitive EDH.`,
  };
}

export default async function CommanderPage({ params }: PageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<CommanderDetailSkeleton />}>
        <CommanderDetail commanderName={decodedName} />
      </Suspense>
    </div>
  );
}

function CommanderDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6">
        <Skeleton className="w-full md:w-64 h-64 rounded-lg" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
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

      {/* Cards section */}
      <div>
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="aspect-[488/680]" />
          ))}
        </div>
      </div>
    </div>
  );
}
