"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

const chartData = [
  { seat: "1", winRate: 50 },
  { seat: "2", winRate: 40 },
  { seat: "3", winRate: 30 },
  { seat: "4", winRate: 20 }
];

const chartConfig = {
  winRate: {
    label: "Win Rate",
    color: "hsl(var(--chart-2))"
  }
} satisfies ChartConfig;

export function SeatWinRateChart({ data, name }: { data: { seat: string; winRate: number }[]; name: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Win Rate by Seat Position</CardTitle>
        <CardDescription>Seat position can have a major impact on win rate.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="max-h-[200px] min-h-[200px] w-full">
          <BarChart data={data} layout="horizontal">
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="seat"
              type="category"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `Seat ${value}`}
            />
            <YAxis dataKey="winRate" type="number" tickFormatter={(value) => `${value}%`} width={40} tickMargin={8} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <Bar dataKey="winRate" fill="var(--color-winRate)" radius={4}>
              <LabelList
                dataKey="winRate"
                position="center"
                className="fill-[--color-label]"
                fontSize={12}
                formatter={(value: number) => `${value}%`}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              This deck is 10% more likely to win in Seat 1
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">(date range)</div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
