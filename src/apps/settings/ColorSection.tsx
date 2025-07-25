import { Label } from "@ui/label";
import { Slider } from "@ui/slider";
import { ColorInput } from "./ColorInput";
import { extractAlphaFromHex, updateHexOpacity } from "./utils";
import { useEffect, useState } from "react";
import { useStore } from "./store";

interface ColorSectionProps {
  type: "normal" | "warning" | "danger";
  colors: {
    fg: string;
    bg: string;
    borderColor: string;
  };
}

export function ColorSection({ type, colors }: ColorSectionProps) {
  const onColorChange = useStore((state) => state.onColorChange);
  const [backgroundOpacity, setBackgroundOpacity] = useState(1);
  const title = type.charAt(0).toUpperCase() + type.slice(1) + " Colors";

  useEffect(() => {
    setBackgroundOpacity(extractAlphaFromHex(colors.bg));
  }, [colors.bg]);

  return (
    <div className="p-4 border rounded-lg bg-card/60 flex-1">
      <Label className="text-sm font-medium">{title}</Label>
      <div className="space-y-3 mt-3">
        <ColorInput
          label="Text"
          value={colors.fg}
          onChange={(value) => onColorChange(type, "fg", value)}
          placeholder="#ffffff"
        />

        <ColorInput
          label="Background"
          value={colors.bg}
          onChange={(value) => onColorChange(type, "bg", value)}
          opacity={backgroundOpacity}
          placeholder="#000000"
        />

        <ColorInput
          label="Border"
          value={colors.borderColor}
          onChange={(value) => onColorChange(type, "borderColor", value)}
          placeholder="#ffffff"
        />

        <div className="flex items-center gap-3 pt-2">
          <Label className="text-xs text-muted-foreground w-20">Opacity</Label>

          <Slider
            value={[backgroundOpacity]}
            onValueChange={(value) => {
              onColorChange(type, "bg", updateHexOpacity(colors.bg, value[0]));
            }}
            max={1}
            min={0}
            step={0.01}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}
