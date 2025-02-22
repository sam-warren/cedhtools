"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/app-utils";
import { TrendingDown, TrendingUp } from "lucide-react";

interface TrendBadgeProps {
  trend: number;
  tooltipText?: string;
  className?: string;
}

export function TrendBadge({ trend, tooltipText, className }: TrendBadgeProps) {
  const badge = (
    <div
      className={cn(
        "flex cursor-default items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200 ease-in-out",
        trend > 0
          ? "bg-gradient-to-r from-green-500/10 to-green-500/5 text-green-600 hover:from-green-500/15 hover:to-green-500/10 dark:from-green-500/20 dark:to-green-500/10 dark:text-green-400"
          : "bg-gradient-to-r from-red-500/10 to-red-500/5 text-red-600 hover:from-red-500/15 hover:to-red-500/10 dark:from-red-500/20 dark:to-red-500/10 dark:text-red-400",
        className
      )}>
      {trend > 0 ? (
        <TrendingUp className="h-3.5 w-3.5 stroke-[2.5]" />
      ) : (
        <TrendingDown className="h-3.5 w-3.5 stroke-[2.5]" />
      )}
      <span className="font-semibold tracking-wide">
        {trend > 0 ? "+" : ""}
        {trend}%
      </span>
    </div>
  );

  if (tooltipText) {
    return (
      <TooltipProvider delayDuration={50}>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent side="top" className="border px-3 py-1.5 text-sm shadow-lg">
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
