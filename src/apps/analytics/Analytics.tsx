import type { AnalyticsData } from "@/shared/types";
import { useEffect, useState } from "react";
import { TotalBingeTime } from "./TotalBingeTimes";
import { BarChart3Icon } from "lucide-react";
import { Underline } from "@lib/utils";
import SitesSection from "./SitesSection";
import { TopDistractingSites } from "./TopDistractingSites";
import { getStorageData } from "@/shared/storage";

const daysMap = { "30d": 30, "7d": 7, "90d": 90, inf: -1 };
export type TimeRange = keyof typeof daysMap;

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  useEffect(() => {
    async function fetchAnalyticsData() {
      setLoading(true);
      const data = (await getStorageData(["analyticsData"])).analyticsData;
      setAnalyticsData(data);

      // setAnalyticsData(dummyData);
      // setLoading(false);
    }
    fetchAnalyticsData();
  }, []);

  const filteredData = Object.fromEntries(
    Object.entries(analyticsData).filter(([date]) => {
      if (timeRange === "inf") return true;

      const itemDate = new Date(date);
      const cutoffDate = new Date();

      const daysToSubtract = daysMap[timeRange];

      cutoffDate.setDate(cutoffDate.getDate() - daysToSubtract);
      return itemDate >= cutoffDate;
    }),
  );

  if (loading || !analyticsData || Object.keys(analyticsData).length === 0)
    return (
      <div className="flex min-h-screen items-center justify-center text-xl">
        Loading...
      </div>
    );

  const timeChartData = Object.entries(filteredData).map(([date, time]) => ({
    date,
    time: time.total,
  }));

  return (
    <div className="h-full max-w-[65rem] mx-auto p-8 flex flex-col space-y-5">
      <h1 className="mb-8 text-3xl text-foreground text-center font-bold tracking-wide flex items-center justify-center">
        <BarChart3Icon className="mr-2 text-muted-foreground" />
        Binge Meter <Underline text="Analytics" />
      </h1>
      <TotalBingeTime
        timeChartData={timeChartData}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />
      <SitesSection analyticsData={analyticsData} date={selectedDate} />
      <TopDistractingSites analyticsData={filteredData} timeRange={timeRange} />
    </div>
  );
}
