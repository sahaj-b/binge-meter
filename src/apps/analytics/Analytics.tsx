import { Area, AreaChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@ui/chart";
const chartData = [
  { date: "2025-01-01", time: 10600 },
  { date: "2025-01-02", time: 9050 },
  { date: "2025-01-03", time: 23700 },
  { date: "2025-01-04", time: 7300 },
  { date: "2025-01-05", time: 9090 },
  { date: "2025-01-06", time: 21400 },
];
const chartConfig: ChartConfig = {
  time: {
    label: "Time",
  },
};

export default function Analytics() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[50px] w-1/2">
      <AreaChart accessibilityLayer data={chartData}>
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
          minTickGap={32}
          tickFormatter={formatDate}
          domain={["dataMin", "dataMax"]}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => formatTime(value)}
        />

        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={formatDate}
              valueFormatter={(value) => formatTime(value as number)}
              indicator="dot"
            />
          }
        />
        <Area
          dataKey="time"
          type="monotone"
          fill="url(#fillTime)"
          stroke="var(--primary)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  );
}

function formatDate(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(value: number) {
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  return `${hours}h ${minutes}m`;
}
