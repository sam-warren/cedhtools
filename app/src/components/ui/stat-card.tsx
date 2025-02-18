"use client";

import { LucideIcon, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendBadge } from "@/components/ui/trend-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</CardTitle>
          {infoTooltip && (
            <TooltipProvider delayDuration={50}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-default transition-colors" />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{infoTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-2">
          <Icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col h-[64px] justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            {valueFormat(value)}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">{subtext}</span>
            {trend && <TrendBadge trend={trend.value} tooltipText={trend.tooltipText} />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
