"use client";

import React from "react";
import { CartesianGrid, XAxis, YAxis, AreaChart, Area } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { useFilterStore } from "@/src/stores/filter-store";

export default function PopularityChart({
  data,
  name,
}: {
  data: any;
  name: string;
}) {
  const chartConfig = {
    popularity: {
      label: "Popularity",
      color: "hsl(var(--chart-5))",
      formatter: (value: number) => `${value.toFixed(1)}%`,
    },
  };

  const { formattedDateRange } = useFilterStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Popularity Over Time</CardTitle>
        <CardDescription>
          Historical popularity trends for {name}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="min-h-[200px] max-h-[200px] w-full"
        >
          <AreaChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              height={40}
              tickFormatter={(value) => format(value, "MMM dd")}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              width={40}
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="fillPopularity" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-popularity)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-popularity)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="popularity"
              type="monotone"
              fill="url(#fillPopularity)"
              fillOpacity={0.4}
              stroke="var(--color-popularity)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              Trending down by 3.8% this month{" "}
              <TrendingDown className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              {formattedDateRange}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
