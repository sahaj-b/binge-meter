import type { AnalyticsData } from "@/shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/card";
import { Label, Pie, PieChart } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@ui/chart";
import { formatTimeMs } from "./utils";
import { daysMap, type TimeRange } from "./Analytics";
import { useMemo } from "react";

export function TopDistractingSites({
  analyticsData,
  timeRange,
}: {
  analyticsData: AnalyticsData;
  timeRange: TimeRange;
}) {
  const siteTimeMap: Record<string, number> = {};

  for (const dayData of Object.values(analyticsData)) {
    for (const [site, time] of Object.entries(dayData)) {
      if (site !== "total") siteTimeMap[site] = (siteTimeMap[site] ?? 0) + time;
    }
  }

  const topDistractingSites = Object.entries(siteTimeMap)
    .sort(([, timeA], [, timeB]) => timeB - timeA)
    .slice(0, 5);

  const chartData = topDistractingSites.map(([site, time], index) => ({
    site,
    time,
    fill: `var(--chart-${(index % 15) + 1})`,
  }));

  const chartConfig = {
    time: {
      label: "Time",
    },
    ...Object.fromEntries(
      topDistractingSites.map(([site], index) => [
        site,
        {
          label: site,
          color: `var(--chart-${index + 1})`,
        },
      ]),
    ),
  } satisfies ChartConfig;

  const totalTime = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.time, 0);
  }, [chartData]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center border-b flex justify-between">
        <CardTitle className="text-2xl">Top Distracting Sites</CardTitle>
        <div className="text-muted-foreground text-sm">
          {daysMap[timeRange][1]}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <div className="flex items-center justify-center flex-col md:space-x-12 sm:flex-row">
          <ChartContainer
            config={chartConfig}
            className="aspect-square h-[20rem]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    valueFormatter={(value) => formatTimeMs(value as number)}
                  />
                }
              />
              <Pie
                data={chartData}
                dataKey="time"
                nameKey="site"
                innerRadius={80}
                strokeWidth={2}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {formatTimeMs(totalTime)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            Total Time
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="flex flex-col gap-3 shrink">
            {chartData.map((entry, index) => (
              <div key={entry.site} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: `var(--chart-${index + 1})` }}
                />
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {entry.site}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatTimeMs(entry.time)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
