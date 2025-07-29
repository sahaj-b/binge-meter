import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/select";

interface TimeSelectorProps {
  hours?: number;
  minutes?: number;
  onTimeChange: (hours: number, minutes: number) => void;
}

export function TimeSelector({
  hours = 0,
  minutes = 0,
  onTimeChange,
}: TimeSelectorProps) {
  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const period = hours >= 12 ? "PM" : "AM";

  const handleHourChange = (value: string) => {
    const hour = Number.parseInt(value);
    const adjustedHour =
      period === "PM" && hour !== 12
        ? hour + 12
        : hour === 12 && period === "AM"
          ? 0
          : hour;
    onTimeChange(adjustedHour, minutes);
  };

  const handleMinuteChange = (value: string) => {
    const minute = Number.parseInt(value);
    onTimeChange(hours, minute);
  };

  const handlePeriodChange = (value: string) => {
    let newHours = hours;
    if (value === "PM" && hours < 12) {
      newHours = hours + 12;
    } else if (value === "AM" && hours >= 12) {
      newHours = hours - 12;
    }
    onTimeChange(newHours, minutes);
  };

  return (
    <div className="flex space-x-2">
      <Select value={hour12.toString()} onValueChange={handleHourChange}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
            <SelectItem key={hour} value={hour.toString()}>
              {hour}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={minutes.toString().padStart(2, "0")}
        onValueChange={handleMinuteChange}
      >
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 4 }, (_, i) => i * 15).map((seconds) => (
            <SelectItem
              key={seconds.toString().padStart(2, "0")}
              value={seconds.toString().padStart(2, "0")}
            >
              {seconds.toString().padStart(2, "0")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={period} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

