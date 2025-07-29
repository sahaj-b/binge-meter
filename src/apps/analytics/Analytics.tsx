import type { AnalyticsData } from "@/shared/types";
import { useEffect, useState } from "react";
import { TotalBingeTime } from "./TotalBingeTimes";
import { BarChart3Icon } from "lucide-react";
import { Underline } from "@lib/utils";
import SitesSection from "./SitesSection";
import { TopDistractingSites } from "./TopDistractingSites";

const dummyData = {
  "2025-07-16": {
    "reddit.com": 4320000,
    "youtube.com": 7200000,
    "facebook.com": 3600000,
    "instagram.com": 2700000,
    "twitter.com": 5400000,
    "tiktok.com": 6300000,
    total: 29520000,
  },
  "2025-07-17": {
    "x.com": 2160000,
    "reddit.com": 4500000,
    "youtube.com": 8100000,
    "netflix.com": 7200000,
    "spotify.com": 3240000,
    "discord.com": 4680000,
    total: 29880000,
  },
  "2025-07-18": {
    "reddit.com": 5400000,
    "youtube.com": 9000000,
    "twitch.tv": 4320000,
    "linkedin.com": 1800000,
    "github.com": 3600000,
    "stackoverflow.com": 2700000,
    total: 26820000,
  },
  "2025-07-19": {
    "x.com": 3600000,
    "reddit.com": 6300000,
    "youtube.com": 10800000,
    "amazon.com": 2700000,
    "ebay.com": 1800000,
    "wikipedia.org": 4500000,
    total: 29700000,
  },
  "2025-07-20": {
    "reddit.com": 7200000,
    "hello.com": 3600000,
    "youtube.com": 12600000,
    "gmail.com": 2160000,
    "whatsapp.com": 1980000,
    "telegram.org": 2520000,
    "slack.com": 4140000,
    total: 34200000,
  },
  "2025-07-21": {
    "reddit.com": 5940000,
    "youtube.com": 8640000,
    "pinterest.com": 3780000,
    "snapchat.com": 2700000,
    "zoom.us": 3600000,
    "microsoft.com": 4500000,
    total: 29160000,
  },
  "2025-07-22": {
    "google.com": 1825200,
    "bing.com": 1105200,
    "duckduckgo.com": 925200,
    total: 9855600,
  },
  "2025-07-23": {
    "reddit.com": 2700000,
    "youtube.com": 4320000,
    "hulu.com": 3600000,
    "disney.com": 2160000,
    "paramount.com": 1800000,
    total: 14580000,
  },
  "2025-07-24": {
    "x.com": 4500000,
    "reddit.com": 9720000,
    "youtube.com": 14400000,
    "hello.com": 3240000,
    "medium.com": 2700000,
    "substack.com": 1980000,
    "notion.so": 3600000,
    "figma.com": 2880000,
    total: 43020000,
  },
  "2025-07-25": {
    "reddit.com": 6480000,
    "youtube.com": 11520000,
    "x.com": 3240000,
    "paypal.com": 1800000,
    "stripe.com": 2160000,
    "shopify.com": 2700000,
    "wordpress.com": 3780000,
    total: 31680000,
  },
  "2025-07-26": {
    "reddit.com": 10800000,
    "youtube.com": 16200000,
    "hello.com": 4320000,
    "x.com": 5400000,
    "canva.com": 3600000,
    "adobe.com": 4680000,
    "dropbox.com": 2700000,
    "onedrive.com": 2520000,
    total: 50220000,
  },
  "2025-07-27": {
    "reddit.com": 7200000,
    "youtube.com": 10800000,
    "x.com": 3600000,
    "github.com": 1800000,
    "stackoverflow.com": 2700000,
    "quora.com": 2160000,
    total: 28800000,
  },
  "2025-07-28": {
    "reddit.com": 4320000,
    "youtube.com": 7200000,
    "x.com": 1800000,
    "linkedin.com": 3600000,
    "github.com": 2700000,
    "stackoverflow.com": 3240000,
    "quora.com": 2160000,
    total: 21600000,
  },
  "2025-07-29": {
    "reddit.com": 5400000,
    "youtube.com": 8100000,
    "x.com": 2700000,
    "linkedin.com": 1800000,
    "github.com": 3600000,
    "stackoverflow.com": 3240000,
    "quora.com": 2160000,
    total: 24300000,
  },
};

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
      // const data = (await getStorageData(["analyticsData"])).analyticsData;
      // setAnalyticsData(data);

      setAnalyticsData(dummyData);
      setLoading(false);
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
