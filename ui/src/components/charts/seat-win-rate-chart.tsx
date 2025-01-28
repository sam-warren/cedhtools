"use client";

import { TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
const chartData = [
  { seat: "1", winRate: 50 },
  { seat: "2", winRate: 40 },
  { seat: "3", winRate: 30 },
  { seat: "4", winRate: 20 },
];

const chartConfig = {
  winRate: {
    label: "Win Rate",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function SeatWinRateChart({ data, name }: { data: { seat: string; winRate: number }[], name: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Win Rate by Seat Position</CardTitle>
        <CardDescription>
          Showing win rate for decks with {name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px]">
          <BarChart
            data={data}
            layout="vertical"
            margin={{
              top: 0,
              right: 40,
              bottom: 0,
              left: 40
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="seat"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={60}
            />
            <XAxis 
              dataKey="winRate" 
              type="number" 
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar
              dataKey="winRate"
              fill="var(--color-winRate)"
              radius={4}
            >
              <LabelList
                dataKey="seat"
                position="insideLeft"
                offset={8}
                className="fill-[--color-label]"
                fontSize={12}
                formatter={(value: number) => `Seat ${value}`}
              />
              <LabelList
                dataKey="winRate"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
                formatter={(value: number) => `${value}%`}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          This deck is 10% more likely to win from seat 1
        </div>
        <div className="leading-none text-muted-foreground">
          This suggests that the deck moves faster than the average deck
        </div>
      </CardFooter>
    </Card>
  );
}
