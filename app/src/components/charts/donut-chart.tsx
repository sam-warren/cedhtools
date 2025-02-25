"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";
import { cn } from "@/lib/utils/app-utils";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface DonutChartProps<T extends { name: string }> {
  data: T[];
  title: string;
  description?: string;
  valueKey: keyof T;
  footerMessage?: string;
  footerDescription?: string;
  centerLabel?: string;
  className?: string;
}

export function DonutChart<T extends { name: string }>({
  data,
  title,
  description,
  valueKey,
  footerMessage,
  footerDescription,
  centerLabel,
  className
}: DonutChartProps<T>) {
  const chartData = React.useMemo(() => {
    return data.map((item, index) => ({
      name: item.name,
      value: Number(item[valueKey]),
      fill: `hsl(var(--chart-${(index % 12) + 1}))`
    }));
  }, [data, valueKey]);

  const totalValue = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData]);

  const chartConfig = React.useMemo(() => {
    return chartData.reduce((acc, curr, index) => {
      acc[curr.name] = {
        label: curr.name,
        color: `hsl(var(--chart-${(index % 12) + 1}))`
      };
      return acc;
    }, {} as ChartConfig);
  }, [chartData]);

  return (
    <Card className={cn("flex h-full flex-col shadow-sm transition-shadow duration-200 hover:shadow-md", className)}>
      <CardHeader className="flex-none pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">{title}</CardTitle>
            {description && (
              <CardDescription className="text-zinc-500 dark:text-zinc-400">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        <ChartContainer config={chartConfig} className="h-full min-h-[200px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                          {totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                          {centerLabel || "Total"}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      {(footerMessage || footerDescription) && (
        <CardFooter className="flex-none flex-col items-start gap-2 text-sm">
          {footerMessage && <div className="flex gap-2 font-medium leading-none">{footerMessage}</div>}
          {footerDescription && <div className="leading-none text-muted-foreground">{footerDescription}</div>}
        </CardFooter>
      )}
    </Card>
  );
}
