import { Badge } from "@/components/ui/badge";
import { Flame, Sparkles, CircleAlert, TriangleAlert } from "lucide-react";

interface InclusionRateBadgeProps {
  rate: number;
}

export function InclusionRateBadge({ rate }: InclusionRateBadgeProps) {
  const getInclusionConfig = (rate: number) => {
    if (rate >= 90) {
      return {
        label: "Staple",
        icon: Sparkles,
        classes: "bg-violet-600/10 border-violet-600/20",
      };
    } else if (rate >= 20) {
      return {
        label: "Popular",
        icon: Flame,
        classes: "bg-amber-600/10 border-amber-600/20",
      };
    } else {
      return {
        label: "Fringe",
        icon: TriangleAlert,
        classes: "bg-red-600/10 border-red-600/20",
      };
    }
  };

  const config = getInclusionConfig(rate);
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium gap-1 ${config.classes}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
