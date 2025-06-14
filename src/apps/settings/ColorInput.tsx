import { Input } from "@ui/input";
import { Label } from "@ui/label";
import { useEffect, useState } from "react";

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ColorInput({
  label,
  value,
  onChange,
  placeholder = "#",
}: ColorInputProps) {
  const [isValid, setIsValid] = useState(true);
  const [input, setInput] = useState(value);
  const [debounceRef, setDebounceRef] = useState<NodeJS.Timeout | null>(null);
  useEffect(() => {
    handleTextChange(value);
  }, [value]);

  const handleTextChange = (inputVal: string) => {
    setIsValid(true);
    if (!inputVal.startsWith("#")) {
      inputVal = "#" + inputVal;
    }
    inputVal = inputVal.slice(0, 7);
    if (!/^#[0-9A-Fa-f]{6}$/.test(inputVal)) setIsValid(false);
    setInput(inputVal);
  };

  function handleBlur(inputVal: string) {
    inputVal = inputVal.trim();
    if (inputVal && !inputVal.startsWith("#")) {
      inputVal = "#" + inputVal;
    }
    inputVal = inputVal.slice(0, 7);
    onChange(inputVal);
  }

  function debouncedOnChange(inputVal: string) {
    if (debounceRef) {
      clearTimeout(debounceRef);
    }
    setDebounceRef(
      setTimeout(() => {
        onChange(inputVal);
      }, 10),
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Label className="text-xs text-muted-foreground w-20">{label}</Label>
      <Input
        aria-invalid={!isValid}
        type="text"
        spellCheck="false"
        className={"w-20 h-8 px-2 text-xs font-mono "}
        value={input}
        onChange={(e) => handleTextChange(e.target.value)}
        onBlur={(e) => handleBlur(e.target.value)}
        placeholder={placeholder}
        maxLength={7}
      />
      <div className="relative">
        <Input
          type="color"
          className="w-10 h-8 p-0 border-0 rounded-md color-picker"
          value={input}
          onChange={(e) => debouncedOnChange(e.target.value)}
        />
      </div>
    </div>
  );
}
