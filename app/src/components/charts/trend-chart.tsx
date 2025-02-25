"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { NoData } from "@/components/ui/no-data";
import { TrendBadge } from "@/components/ui/trend-badge";
import { cn } from "@/lib/utils/app-utils";
import { useFilterStore } from "@/stores/filter-store";
import { differenceInMonths, format, isWithinInterval, parseISO } from "date-fns";
import { Calendar } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface TrendChartProps<T extends Record<string, string | number>> {
  data: T[];
  title: string;
  description?: string;
  tooltipLabel?: string;
  dataKey: keyof T;
  xAxisKey: keyof T;
  valueFormatter?: (value: number) => string;
  showFilters?: boolean;
  className?: string;
  unit?: string;
  color?: string;
}

export function TrendChart<T extends Record<string, string | number>>({
  data,
  title,
  description,
  tooltipLabel,
  dataKey,
  xAxisKey,
  valueFormatter = (value: number) => `${value.toFixed(1)}`,
  showFilters = false,
  className,
  unit = "%",
  color = "hsl(var(--chart-1))"
}: TrendChartProps<T>) {
  const { appliedState } = useFilterStore();
  const { dateRange, datePreset } = appliedState;

  // Filter data based on date range
  const filteredData = data
    .filter((item) => {
      if (!dateRange?.from || !dateRange?.to) return true;
      const itemDate = parseISO(String(item[xAxisKey]));
      return isWithinInterval(itemDate, { start: dateRange.from, end: dateRange.to });
    })
    .sort((a, b) => {
      const dateA = parseISO(String(a[xAxisKey]));
      const dateB = parseISO(String(b[xAxisKey]));
      return dateA.getTime() - dateB.getTime();
    });

  // Check if we have valid data to display
  if (!filteredData || filteredData.length === 0) {
    return (
      <NoData message="No data available for this time period" suggestion="Try selecting a different date range" />
    );
  }

  if (filteredData.length === 1) {
    return (
      <NoData
        message="Not enough data points to show a trend"
        suggestion="Try expanding your date range to see more data"
      />
    );
  }

  const chartConfig = {
    [dataKey]: {
      label: tooltipLabel || title,
      color: color
    }
  };

  // Calculate trend from the start to end of the filtered period
  const firstValue = Number(filteredData[0][dataKey]);
  const lastValue = Number(filteredData[filteredData.length - 1][dataKey]);
  const trend = lastValue - firstValue;
  const trendPercentage = (trend / firstValue) * 100;

  // Calculate Y-axis ticks based on data
  const maxValue = Math.max(...filteredData.map((item) => Number(item[dataKey])));
  const maxTick = Math.ceil(maxValue / 10) * 10;
  const yAxisTicks = Array.from({ length: maxTick / 10 + 1 }, (_, i) => i * 10);

  // Determine date formatting based on range
  const getTickFormatter = () => {
    if (!dateRange?.from || !dateRange?.to) return (value: string) => format(parseISO(value), "MMM yyyy");

    const monthsDiff = differenceInMonths(dateRange.to, dateRange.from);

    if (monthsDiff <= 3) {
      // Compact MM/DD format for 3 months or less
      return (value: string) => format(parseISO(value), "M/d");
    } else if (monthsDiff <= 6) {
      // MM/DD format for 4-6 months
      return (value: string) => format(parseISO(value), "M/d");
    } else if (monthsDiff <= 12) {
      // Monthly format with year for 7-12 months
      return (value: string) => format(parseISO(value), "MMM yyyy");
    } else {
      // Just month and year for longer periods
      return (value: string) => format(parseISO(value), "MMM yyyy");
    }
  };

  // Calculate minTickGap based on date range
  const getMinTickGap = () => {
    if (!dateRange?.from || !dateRange?.to) return 20;
    const monthsDiff = differenceInMonths(dateRange.to, dateRange.from);
    if (monthsDiff <= 3) return 8;
    if (monthsDiff <= 6) return 12;
    return 20;
  };

  // Get first and last dates for the range
  const firstDate = format(parseISO(String(filteredData[0][xAxisKey])), "MMMM d, yyyy");
  const lastDate = format(parseISO(String(filteredData[filteredData.length - 1][xAxisKey])), "MMMM d, yyyy");

  return (
    <Card className={cn("flex h-full flex-col shadow-sm transition-shadow duration-200 hover:shadow-md", className)}>
      <CardHeader className="flex-none pb-2">
        <div className="flex flex-col gap-2">
          <CardTitle className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">{title}</CardTitle>
          {description && (
            <CardDescription className="text-zinc-500 dark:text-zinc-400">{description}</CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ChartContainer config={chartConfig} className="h-full min-h-[200px]">
          <AreaChart
            data={filteredData}
            margin={{ top: 15, right: 0, bottom: 0, left: -15 }}
            width={100}
            height={100}
            style={{ minHeight: 0 }}>
            <defs>
              <linearGradient id={`${String(dataKey)}Gradient`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="rgb(226, 232, 240)"
              className="dark:stroke-zinc-700"
            />
            <XAxis
              dataKey={String(xAxisKey)}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={getMinTickGap()}
              tickFormatter={getTickFormatter()}
              stroke="rgb(148, 163, 184)"
              className="dark:stroke-zinc-400"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              tickFormatter={(value) => `${valueFormatter(value)}${unit}`}
              ticks={yAxisTicks}
              domain={[0, maxTick]}
              stroke="rgb(148, 163, 184)"
              className="dark:stroke-zinc-400"
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value, name, item) => (
                    <div className="space-y-1.5">
                      <div className="font-medium">{format(parseISO(String(item.payload.date)), "MMMM d, yyyy")}</div>
                      <div className="flex items-baseline gap-2">
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                          style={
                            {
                              "--color-bg": color
                            } as React.CSSProperties
                          }
                        />
                        {chartConfig[name as keyof typeof chartConfig]?.label || name}
                        <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                          {valueFormatter(Number(value))}
                          {unit && <span className="font-normal text-muted-foreground">{unit}</span>}
                        </div>
                      </div>
                    </div>
                  )}
                  className="rounded-lg px-3 py-2 shadow-lg"
                />
              }
            />
            <Area
              type="monotone"
              dataKey={String(dataKey)}
              stroke={color}
              strokeWidth={2}
              fill={`url(#${String(dataKey)}Gradient)`}
              className="dark:stroke-indigo-400"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-none border-t py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {firstDate} - {lastDate}
          </span>
        </div>
        <div className="ml-auto flex items-center">
          <TrendBadge
            trend={Number(trendPercentage.toFixed(1))}
            tooltipText={`Trending ${trend > 0 ? "up" : "down"} by ${Math.abs(trendPercentage).toFixed(1)}% this period (${firstValue}${unit} to ${lastValue}${unit})`}
          />
        </div>
      </CardFooter>
    </Card>
  );
}
