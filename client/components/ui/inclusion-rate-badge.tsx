"use client";

import {
  Sparkles,
  CheckCircle,
  CircleAlert,
  AlertCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type InclusionRateBadgeProps = {
  value: number;
  variant?: "default" | "outline" | "secondary" | "destructive";
  size?: "xs" | "sm";
  className?: string;
  tooltipData?: {
    cardName: string;
    decksIncluding: number;
    totalDecks: number;
  };
};

export function InclusionRateBadge({
  value,
  variant = "outline",
  size = "xs",
  className,
  tooltipData,
}: InclusionRateBadgeProps) {
  // Format the value as percentage
  const formattedValue = `${value.toFixed(1)}%`;

  // Determine icon, color, and label based on inclusion rate brackets
  const getIconAndColor = () => {
    if (value >= 95) {
      return {
        Icon: Sparkles,
        colorClass: "text-blue-500",
        label: "Staple"
      };
    } else if (value >= 70) {
      return {
        Icon: CheckCircle,
        colorClass: "text-green-500",
        label: "Very Popular"
      };
    } else if (value >= 30) {
      return {
        Icon: CircleAlert,
        colorClass: "text-orange-500",
        label: "Somewhat Popular"
      };
    } else {
      return {
        Icon: AlertCircle,
        colorClass: "text-red-500",
        label: "Not Popular"
      };
    }
  };

  const { Icon, colorClass, label } = getIconAndColor();

  const badge = (
    <Badge
      variant={variant}
      className={cn(
        "flex gap-1 items-center whitespace-nowrap cursor-default",
        size === "xs" ? "text-xs rounded-md" : "text-sm rounded-lg",
        colorClass,
        className
      )}
    >
      <Icon className={size === "xs" ? "size-3" : "size-4"} />
      {formattedValue}
    </Badge>
  );

  // If tooltipData is provided, wrap the badge in a tooltip
  if (tooltipData) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-xs bg-popover text-popover-foreground border-border [&>:last-child]:hidden"
          >
            <div className="text-xs space-y-1 mb-2">
              <p className="font-medium">{tooltipData.cardName}</p>
              <div className="grid grid-cols-2 gap-x-2">
                <span className="text-muted-foreground">Decks including this card:</span>
                <span className="font-medium">
                  {tooltipData.decksIncluding}
                </span>
                <span className="text-muted-foreground">Total decks:</span>
                <span className="font-medium">
                  {tooltipData.totalDecks}
                </span>
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium">
                  {label}
                </span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // If no tooltipData, just return the badge
  return badge;
} 