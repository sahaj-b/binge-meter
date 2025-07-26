import { Area, AreaChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@ui/chart";
import { formatDate, formatTimeMs } from "./utils";

const chartConfig: ChartConfig = {
  time: {
    label: "Time",
  },
};

export type TimeChartData = {
  date: string;
  time: number; // ms
}[];

export function TimeAreaChart({
  timeChartData,
}: { timeChartData: TimeChartData }) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[50px]">
      <AreaChart accessibilityLayer data={timeChartData}>
        <defs>
          <linearGradient id="fillTime" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={formatDate}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => formatTimeMs(value)}
        />

        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={formatDate}
              valueFormatter={(value) => formatTimeMs(value as number)}
              indicator="dot"
            />
          }
        />
        <Area
          dataKey="time"
          type="monotone"
          fill="url(#fillTime)"
          stroke="var(--primary)"
          animationDuration={700}
        />
      </AreaChart>
    </ChartContainer>
  );
}
