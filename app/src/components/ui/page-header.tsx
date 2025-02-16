import { FilterBadges } from "@/components/ui/filter-badges";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  showFilters?: boolean;
}

export function PageHeader({ title, description, children, showFilters = false }: PageHeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        {children && <div className="flex items-center gap-4">{children}</div>}
      </div>
      {showFilters && <FilterBadges />}
    </div>
  );
}
