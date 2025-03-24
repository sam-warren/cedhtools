"use client";

import {
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type WinRateBadgeProps = {
  value: number;
  variant?: "default" | "outline" | "secondary" | "destructive";
  useSimpleArrows?: boolean;
  size?: "xs" | "sm";
  className?: string;
  showZeroValue?: boolean;
  tooltipData?: {
    cardName: string;
    cardWinRate: number;
    commanderWinRate: number;
  };
};

export function WinRateBadge({
  value,
  variant = "outline",
  useSimpleArrows = false,
  size = "xs",
  className,
  showZeroValue = true,
  tooltipData,
}: WinRateBadgeProps) {
  // Format the value with sign and percentage if applicable
  const formattedValue =
    value !== 0 || showZeroValue
      ? `${value > 0 ? "+" : ""}${value.toFixed(2)}%`
      : "";

  // Determine icon to use based on value and arrow style preference
  const Icon =
    value > 0
      ? useSimpleArrows
        ? ArrowUp
        : TrendingUp
      : value < 0
      ? useSimpleArrows
        ? ArrowDown
        : TrendingDown
      : ChevronsUpDown;

  // Determine color classes based on value
  const colorClass =
    value > 0 ? "text-green-500" : value < 0 ? "text-red-500" : "text-blue-500";

  // Only render if there's a non-zero value or showZeroValue is true
  if (value === 0 && !showZeroValue) return null;

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
                <span className="text-muted-foreground">With card:</span>
                <span className="font-medium">
                  {tooltipData.cardWinRate.toFixed(2)}%
                </span>
                <span className="text-muted-foreground">Overall:</span>
                <span className="font-medium">
                  {tooltipData.commanderWinRate.toFixed(2)}%
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
