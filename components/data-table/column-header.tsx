import { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const isSorted = column.getIsSorted();

  return (
    <div className={cn("flex items-center", className)}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 hover:bg-accent"
        onClick={() => {
          // Cycle through: none -> asc -> desc -> none
          if (!isSorted) {
            column.toggleSorting(false); // asc
          } else if (isSorted === "asc") {
            column.toggleSorting(true); // desc
          } else {
            column.clearSorting(); // none
          }
        }}
      >
        <span>{title}</span>
        <div className="ml-1 w-4 h-4 flex items-center justify-center">
          {isSorted === "desc" ? (
            <ArrowDown className="h-4 w-4 transition-transform duration-200" />
          ) : isSorted === "asc" ? (
            <ArrowUp className="h-4 w-4 transition-transform duration-200" />
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
          )}
        </div>
      </Button>
    </div>
  );
}