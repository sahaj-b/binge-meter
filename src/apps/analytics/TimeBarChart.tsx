import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@ui/chart";
import { formatDate, formatTimeMs } from "./utils";
import { useState } from "react";

const chartConfig: ChartConfig = {
  time: {
    label: "Time",
  },
};

export type TimeChartData = {
  date: string;
  time: number; // ms
}[];

export function TimeBarChart({
  timeChartData,
  selectedDate,
  setSelectedDate,
}: {
  timeChartData: TimeChartData;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}) {
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const selectedTime = timeChartData.find(
    (entry) => entry.date === selectedDate,
  )?.time;
  return (
    <div className="min-h-[50px] relative">
      {hoveredTime != null && (
        <div className="absolute inset-0 flex justify-center pointer-events-none z-0">
          <div className="text-8xl font-bold text-muted-foreground/20 select-none">
            {formatTimeMs(hoveredTime)}
          </div>
        </div>
      )}
      <ChartContainer config={chartConfig}>
        <BarChart accessibilityLayer data={timeChartData}>
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => formatDate(value)}
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
                labelFormatter={(value) => formatDate(value)}
                valueFormatter={(value) => formatTimeMs(value as number)}
              />
            }
          />
          <Bar
            dataKey="time"
            className="cursor-pointer"
            animationDuration={700}
            fill="var(--primary)"
            radius={10}
            onClick={(data) => setSelectedDate(data.date)}
            onMouseEnter={(data) => setHoveredTime(data.time ?? null)}
            onMouseLeave={() => setHoveredTime(selectedTime ?? null)}
          >
            {timeChartData.map((entry) => (
              <Cell
                key={entry.date}
                className={
                  entry.date === selectedDate
                    ? "fill-primary/50 hover:fill-primary/40"
                    : "fill-primary hover:fill-primary/80"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
