import type { AnalyticsData } from "@/shared/types";
import { formatDate, formatTimeMs } from "./utils";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/card";

export default function SitesSection({
  analyticsData,
  date,
}: { analyticsData: AnalyticsData; date: string }) {
  const todaysTime = analyticsData[date]?.total ?? 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl flex justify-center space-x-5">
          <div>{formatDate(date, false)}</div>
          <div className="text-primary">{formatTimeMs(todaysTime)}</div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 mb-2">
          {Object.entries(analyticsData[date] ?? {})
            .filter(([site]) => site !== "total")
            .sort(([, timeA], [, timeB]) => timeB - timeA)
            .map(([site, time]) => (
              <div
                key={site}
                className="bg-input/20 rounded-xl p-6 flex flex-col items-center justify-center space-y-4"
              >
                <div className="relative flex items-center justify-center">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 64 64">
                    <title>{site}</title>
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      className="text-input"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      className="text-primary transition-all duration-700"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${2 * Math.PI * 28 * (1 - (todaysTime > 0 ? time / todaysTime : 0))}`}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-lg font-semibold">
                      {formatTimeMs(time)}
                    </span>
                    {/* <span className="text-xs text-muted-foreground"> */}
                    {/*   {todaysTime > 0 */}
                    {/*     ? Math.round((time / todaysTime) * 100) */}
                    {/*     : 0} */}
                    {/*   % */}
                    {/* </span> */}
                  </div>
                </div>
                <span className="text-lg font-medium text-center">{site}</span>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
