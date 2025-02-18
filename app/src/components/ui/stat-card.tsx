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

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtext: string;
  trend?: {
    value: number;
    tooltipText: string;
  };
  valueFormat?: (value: string | number) => string;
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {infoTooltip && (
            <TooltipProvider delayDuration={50}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-default" />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{infoTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{valueFormat(value)}</div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{subtext}</span>
          {trend && <TrendBadge trend={trend.value} tooltipText={trend.tooltipText} />}
        </div>
      </CardContent>
    </Card>
  );
}
