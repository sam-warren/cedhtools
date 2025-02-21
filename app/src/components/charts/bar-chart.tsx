"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils/app-utils";

interface BarChartProps<T extends Record<string, string | number>> {
  data: T[];
  title: string;
  description?: string;
  footerMessage?: string;
  footerDescription?: string;
  tooltipLabel?: string;
  dataKey: keyof T;
  xAxisKey: keyof T;
  valueFormatter?: (value: number) => string;
  className?: string;
  color?: string;
  height?: number;
  unit?: string;
}

export function BarChartComponent<T extends Record<string, string | number>>({
  data,
  title,
  description,
  footerMessage,
  footerDescription,
  tooltipLabel,
  dataKey,
  xAxisKey,
  valueFormatter = (value: number) => `${value.toFixed(1)}`,
  className,
  color = "hsl(var(--chart-2))",
  height = 200,
  unit = "%"
}: BarChartProps<T>) {
  const chartConfig = {
    [dataKey]: {
      label: tooltipLabel || title,
      color: color
    }
  } satisfies ChartConfig;

  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-md", className)}>
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
      <CardContent>
        <ChartContainer config={chartConfig} className={`h-[${height}px] w-full`}>
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 0,
              bottom: 0,
              left: 0
            }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey={String(xAxisKey)} tickLine={false} tickMargin={10} axisLine={false} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value, name) => (
                    <div className="space-y-1.5">
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
            <Bar dataKey={String(dataKey)} fill={color} radius={8}>
              <LabelList
                position="top"
                offset={12}
                className="text-foreground"
                fontSize={12}
                formatter={valueFormatter}
              />
            </Bar>
          </BarChart>
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
