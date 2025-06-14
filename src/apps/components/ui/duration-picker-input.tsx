import { Input } from "@ui/input";
import { cn } from "@lib/utils";
import React from "react";
import {
  type DurationPickerType,
  getArrowDurationByType,
  getDurationByType,
  setDurationByType,
} from "./duration-picker-utils";

export interface DurationPickerInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  picker: DurationPickerType;
  totalMilliseconds: number;
  setTotalMilliseconds: (milliseconds: number) => void;
  onRightFocus?: () => void;
  onLeftFocus?: () => void;
  suffix?: string;
  ref?: React.Ref<HTMLInputElement>;
}

const DurationPickerInput = ({
  className,
  type = "tel",
  value,
  id,
  name,
  totalMilliseconds = 0,
  setTotalMilliseconds,
  onChange,
  onKeyDown,
  picker,
  onLeftFocus,
  onRightFocus,
  suffix,
  ref,
  ...props
}: DurationPickerInputProps) => {
  const [flag, setFlag] = React.useState<boolean>(false);

  /**
   * allow the user to enter the second digit within 2 seconds
   * otherwise start again with entering first digit
   */
  React.useEffect(() => {
    if (flag) {
      const timer = setTimeout(() => {
        setFlag(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [flag]);

  const calculatedValue = React.useMemo(() => {
    return getDurationByType(totalMilliseconds, picker);
  }, [totalMilliseconds, picker]);

  const calculateNewValue = (key: string) => {
    return !flag ? "0" + key : calculatedValue.slice(1, 2) + key;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab") return;
    e.preventDefault();
    if (e.key === "ArrowRight") onRightFocus?.();
    if (e.key === "ArrowLeft") onLeftFocus?.();
    if (["ArrowUp", "ArrowDown"].includes(e.key)) {
      const step = e.key === "ArrowUp" ? 1 : -1;
      const newValue = getArrowDurationByType(totalMilliseconds, step, picker);
      if (flag) setFlag(false);
      const newTotalMs = setDurationByType(totalMilliseconds, newValue, picker);
      setTotalMilliseconds(newTotalMs);
    }
    if (e.key >= "0" && e.key <= "9") {
      const newValue = calculateNewValue(e.key);
      if (flag) onRightFocus?.();
      setFlag((prev) => !prev);
      const newTotalMs = setDurationByType(totalMilliseconds, newValue, picker);
      setTotalMilliseconds(newTotalMs);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Input
        ref={ref}
        id={id || picker}
        name={name || picker}
        className={cn(
          "w-[48px] text-center font-mono text-base tabular-nums caret-transparent",
          className,
        )}
        value={value || calculatedValue}
        onChange={(e) => {
          e.preventDefault();
          onChange?.(e);
        }}
        type={type}
        inputMode="decimal"
        onKeyDown={(e) => {
          onKeyDown?.(e);
          handleKeyDown(e);
        }}
        {...props}
      />
      <span className="text-sm text-muted-foreground">{suffix}</span>
    </div>
  );
};

DurationPickerInput.displayName = "DurationPickerInput";

export { DurationPickerInput };
