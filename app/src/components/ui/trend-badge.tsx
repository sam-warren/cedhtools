"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/app-utils";

interface TrendBadgeProps {
  trend: number;
  tooltipText?: string;
  className?: string;
}

export function TrendBadge({ trend, tooltipText, className }: TrendBadgeProps) {
  const badge = (
    <div
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-default",
        trend > 0 
          ? "bg-green-500/10 text-green-500"
          : "bg-red-500/10 text-red-500",
        className
      )}
    >
      {trend > 0 ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {trend > 0 ? "+" : ""}{trend}%
    </div>
  );

  if (tooltipText) {
    return (
      <TooltipProvider delayDuration={50}>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
} 