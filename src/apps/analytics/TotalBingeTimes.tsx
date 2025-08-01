import { TimeBarChart } from "./TimeBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/select";
import { daysMap, type TimeRange } from "./Analytics";

export function TotalBingeTime({
  timeChartData,
  timeRange,
  setTimeRange,
  selectedDate,
  setSelectedDate,
}: {
  timeChartData: { date: string; time: number }[];
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}) {
  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="text-2xl">
          <CardTitle>Total Binge Times</CardTitle>
        </div>
        <Select
          value={timeRange}
          onValueChange={(val) => setTimeRange(val as TimeRange)}
        >
          <SelectTrigger
            className="hidden w-[160px] sm:ml-auto sm:flex"
            aria-label="Select a value"
          >
            <SelectValue placeholder={daysMap["7d"][1]} />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(daysMap).map(([days, [_, label]]) => (
              <SelectItem key={days} value={days}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <TimeBarChart
          timeChartData={timeChartData}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      </CardContent>
    </Card>
  );
}
