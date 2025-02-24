"use client";

import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";
import { cn } from "@/lib/utils/app-utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "../ui/chart";

interface RadialChartProps<T extends { name: string }> {
  data: T;
  title: string;
  description?: string;
  valueKey: keyof T;
  maxValue?: number;
  footerMessage?: string;
  footerDescription?: string;
  centerLabel?: string;
  className?: string;
}

export function RadialChart<T extends { name: string }>({
  data,
  title,
  description,
  valueKey,
  maxValue = 100,
  footerMessage,
  footerDescription,
  centerLabel,
  className
}: RadialChartProps<T>) {
  const value = Number(data[valueKey]);
  const chartData = [
    {
      name: data.name,
      value,
      fill: "hsl(var(--chart-1))"
    }
  ];

  const chartConfig = {
    [valueKey]: {
      label: centerLabel || valueKey.toString(),
      color: "hsl(var(--chart-1))"
    }
  } satisfies ChartConfig;

  // Calculate the end angle based on the value percentage
  const endAngle = (value / maxValue) * 360;

  return (
    <Card className={cn("flex h-full flex-col shadow-sm transition-shadow duration-200 hover:shadow-md", className)}>
      <CardHeader className="flex-none pb-2">
        <div className="flex flex-col gap-2">
          <CardTitle className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">{title}</CardTitle>
          {description && <CardDescription className="text-zinc-500 dark:text-zinc-400">{description}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        <ChartContainer config={chartConfig} className="h-full min-h-[200px]">
          <RadialBarChart data={chartData} startAngle={0} endAngle={endAngle} innerRadius={80} outerRadius={110}>
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[86, 74]}
            />
            <RadialBar dataKey="value" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-4xl font-bold">
                          {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                          {centerLabel || valueKey.toString()}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      {(footerMessage || footerDescription) && (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          {footerMessage && <div className="flex gap-2 font-medium leading-none">{footerMessage}</div>}
          {footerDescription && <div className="leading-none text-muted-foreground">{footerDescription}</div>}
        </CardFooter>
      )}
    </Card>
  );
}
