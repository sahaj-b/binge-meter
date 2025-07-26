import type { AnalyticsData } from "@/shared/types";
import { useState } from "react";
import { TimeAreaChart } from "./TimeAreaChart";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/select";

const daysMap = { "30d": 30, "7d": 7, "90d": 90, inf: -1 };

export function TotalBingeTimes({
  analyticsData,
}: { analyticsData: AnalyticsData }) {
  const [timeRange, setTimeRange] = useState<keyof typeof daysMap>("30d");
  const timeChartData = Object.entries(analyticsData).map(([date, time]) => ({
    date,
    time: time.total,
  }));

  const filteredData = timeChartData.filter((item) => {
    if (timeRange === "inf") return true;

    const itemDate = new Date(item.date);
    const cutoffDate = new Date();

    const daysToSubtract = daysMap[timeRange];

    cutoffDate.setDate(cutoffDate.getDate() - daysToSubtract);
    return itemDate >= cutoffDate;
  });

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="text-2xl">
          <CardTitle>Total Binge Times</CardTitle>
        </div>
        <Select
          value={timeRange}
          onValueChange={(val) => setTimeRange(val as keyof typeof daysMap)}
        >
          <SelectTrigger
            className="hidden w-[160px] sm:ml-auto sm:flex"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 7 days" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inf">All time</SelectItem>
            <SelectItem value="90d">Last 3 months</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <TimeAreaChart timeChartData={filteredData} />
      </CardContent>
    </Card>
  );
}
