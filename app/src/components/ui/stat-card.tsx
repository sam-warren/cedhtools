"use client";

import { LucideIcon, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendBadge } from "@/components/ui/trend-badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtext: string;
  trend?: {
    value: number;
    tooltipText: string;
  };
  valueFormat?: (value: string | number) => string | ReactNode;
  infoTooltip?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  subtext,
  trend,
  valueFormat = (val) => val.toString(),
  infoTooltip
}: StatCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{title}</CardTitle>
          {infoTooltip && (
            <TooltipProvider delayDuration={50}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 cursor-default text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300" />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{infoTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="rounded-full bg-zinc-100 p-2 dark:bg-zinc-800">
          <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex h-[64px] flex-col justify-between">
          <div className="bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-2xl font-bold text-transparent dark:from-zinc-100 dark:to-zinc-300">
            {valueFormat(value)}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">{subtext}</span>
            {trend && <TrendBadge trend={trend.value} tooltipText={trend.tooltipText} />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
