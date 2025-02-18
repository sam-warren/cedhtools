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
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-default transition-all duration-200 ease-in-out",
        trend > 0 
          ? "bg-gradient-to-r from-green-500/10 to-green-500/5 text-green-600 dark:from-green-500/20 dark:to-green-500/10 dark:text-green-400 hover:from-green-500/15 hover:to-green-500/10"
          : "bg-gradient-to-r from-red-500/10 to-red-500/5 text-red-600 dark:from-red-500/20 dark:to-red-500/10 dark:text-red-400 hover:from-red-500/15 hover:to-red-500/10",
        className
      )}
    >
      {trend > 0 ? (
        <TrendingUp className="h-3.5 w-3.5 stroke-[2.5]" />
      ) : (
        <TrendingDown className="h-3.5 w-3.5 stroke-[2.5]" />
      )}
      <span className="font-semibold tracking-wide">
        {trend > 0 ? "+" : ""}{trend}%
      </span>
    </div>
  );

  if (tooltipText) {
    return (
      <TooltipProvider delayDuration={50}>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent 
            side="top"
            className="bg-white dark:bg-gray-800 px-3 py-1.5 text-sm shadow-lg border border-gray-100 dark:border-gray-700"
          >
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
} 