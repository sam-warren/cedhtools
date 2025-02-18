import { FilterBadges } from "@/components/ui/filter-badges";
import { cn } from "@/lib/utils/app-utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  showFilters?: boolean;
  className?: string;
}

export function PageHeader({ 
  title, 
  description, 
  children, 
  showFilters = false,
  className 
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
            {title}
          </h1>
          {description && (
            <p className="text-base text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>
        {children && (
          <div className="flex items-center gap-4">
            {children}
          </div>
        )}
      </div>
      {showFilters && (
        <div className="">
          <FilterBadges />
        </div>
      )}
    </div>
  );
}
