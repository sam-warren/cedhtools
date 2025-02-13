import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";

interface DiffBadgeProps {
  diff: number;
}

export function DiffBadge({ diff }: DiffBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`gap-1 text-xs font-medium ${
        diff === 0
          ? "border-blue-600/20 bg-blue-600/10"
          : diff > 0
            ? "border-green-600/20 bg-green-600/10"
            : "border-red-600/20 bg-red-600/10"
      }`}>
      {diff !== 0 ? (
        <>{diff > 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}</>
      ) : (
        <ChevronsUpDown className="h-3 w-3" />
      )}
      {diff.toFixed(2)}%
    </Badge>
  );
}
