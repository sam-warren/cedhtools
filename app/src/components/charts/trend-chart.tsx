"use client";

import { TrendingUp, TrendingDown, Filter } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { useFilterStore } from "@/stores/filter-store";
import { format, differenceInMonths, parseISO, isWithinInterval } from "date-fns";
import { TOP_CUT, TOURNAMENT_SIZE, DATE_PRESET } from "@/lib/constants/filters";
import { NoData } from "@/components/ui/no-data";
import { FilterBadges } from "@/components/ui/filter-badges";

interface TrendChartProps<T extends Record<string, string | number>> {
  data: T[];
  title: string;
  dataKey: keyof T;
  xAxisKey: keyof T;
  trendFormat?: (value: number) => string;
  valueFormatter?: (value: number) => string;
  showFilters?: boolean;
}

export function TrendChart<T extends Record<string, string | number>>({
  data,
  title,
  dataKey,
  xAxisKey,
  trendFormat = (value: number) => `${Math.abs(value).toFixed(1)}%`,
  valueFormatter = (value: number) => `${value}%`,
  showFilters = true
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
      label: title,
      color: "hsl(var(--chart-1))"
    }
  };

  // Calculate trend from the start to end of the filtered period
  const firstValue = Number(filteredData[0][dataKey]);
  const lastValue = Number(filteredData[filteredData.length - 1][dataKey]);
  const trend = lastValue - firstValue;
  const trendPercentage = (trend / firstValue) * 100;

  // Determine date formatting based on range
  const getTickFormatter = () => {
    if (!dateRange?.from || !dateRange?.to) return (value: string) => format(parseISO(value), "MMM yyyy");

    const monthsDiff = differenceInMonths(dateRange.to, dateRange.from);

    if (monthsDiff <= 6) {
      // Weekly format for 6 months or less
      return (value: string) => format(parseISO(value), "MMM d");
    } else if (monthsDiff <= 12) {
      // Monthly format with year for 7-12 months
      return (value: string) => format(parseISO(value), "MMM yyyy");
    } else {
      // Just month and year for longer periods
      return (value: string) => format(parseISO(value), "MMM yyyy");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {showFilters && <FilterBadges />}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <ChartContainer config={chartConfig} className="aspect-[5/1] w-full">
          <AreaChart data={filteredData} margin={{ top: 20, right: 12, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id={`${String(dataKey)}Gradient`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={`var(--color-${String(dataKey)})`} stopOpacity={0.3} />
                <stop offset="95%" stopColor={`var(--color-${String(dataKey)})`} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey={String(xAxisKey)}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={getTickFormatter()}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={valueFormatter}
              domain={[(dataMin: number) => Math.floor(dataMin * 0.95), (dataMax: number) => Math.ceil(dataMax * 1.05)]}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(value) => format(parseISO(String(value)), "MMM d, yyyy")}
                />
              }
            />
            <Area
              type="monotone"
              dataKey={String(dataKey)}
              stroke={`var(--color-${String(dataKey)})`}
              strokeWidth={2}
              fill={`url(#${String(dataKey)}Gradient)`}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex items-center justify-end text-sm">
        <div className="flex items-center gap-2 font-medium">
          {trend > 0 ? (
            <>
              Trending up by {trendFormat(trendPercentage)} <TrendingUp className="h-4 w-4 text-green-500" />
            </>
          ) : (
            <>
              Trending down by {trendFormat(Math.abs(trendPercentage))}{" "}
              <TrendingDown className="h-4 w-4 text-red-500" />
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
