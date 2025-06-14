import React from "react";
import { DurationPickerInput } from "./duration-picker-input";
import { cn } from "@lib/utils";

export interface DurationPickerProps {
  totalMilliseconds: number;
  setTotalMilliseconds: (milliseconds: number) => void;
  className?: string;
  disabled?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

const DurationPicker = ({
  totalMilliseconds,
  setTotalMilliseconds,
  className,
  disabled,
  ref,
}: DurationPickerProps) => {
  const minuteRef = React.useRef<HTMLInputElement>(null);
  const hourRef = React.useRef<HTMLInputElement>(null);
  const secondRef = React.useRef<HTMLInputElement>(null);

  return (
    <div ref={ref} className={cn("flex items-center gap-2", className)}>
      <DurationPickerInput
        ref={hourRef}
        picker="hours"
        totalMilliseconds={totalMilliseconds}
        setTotalMilliseconds={setTotalMilliseconds}
        disabled={disabled}
        onRightFocus={() => minuteRef.current?.focus()}
        suffix="h"
      />

      <DurationPickerInput
        ref={minuteRef}
        picker="minutes"
        totalMilliseconds={totalMilliseconds}
        setTotalMilliseconds={setTotalMilliseconds}
        disabled={disabled}
        onLeftFocus={() => hourRef.current?.focus()}
        onRightFocus={() => secondRef.current?.focus()}
        suffix="m"
      />

      <DurationPickerInput
        ref={secondRef}
        picker="seconds"
        totalMilliseconds={totalMilliseconds}
        setTotalMilliseconds={setTotalMilliseconds}
        disabled={disabled}
        onLeftFocus={() => minuteRef.current?.focus()}
        suffix="s"
      />
    </div>
  );
};

export { DurationPicker };
