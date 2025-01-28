import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

interface DiffBadgeProps {
  diff: number;
}

export function DiffBadge({ diff }: DiffBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium gap-1 ${
        diff === 0
          ? "bg-blue-600/10 border-blue-600/20"
          : diff > 0
          ? "bg-green-600/10 border-green-600/20"
          : "bg-red-600/10 border-red-600/20"
      }`}
    >
      {diff !== 0 ? (
        <>
          {diff > 0 ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </>
      ) : (
        <ChevronsUpDown className="h-3 w-3" />
      )}
      {diff.toFixed(2)}%
    </Badge>
  );
} 