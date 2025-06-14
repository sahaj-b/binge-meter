import { Label } from "@ui/label";
import { Slider } from "@ui/slider";
import { ColorInput } from "./ColorInput";
import { extractAlphaFromHex, updateHexOpacity } from "./utils";
import { useEffect, useState } from "react";

interface ColorSectionProps {
  title: string;
  colors: {
    fg: string;
    bg: string;
    borderColor: string;
  };
  onColorChange: (colorKey: "fg" | "bg" | "borderColor", value: string) => void;
}

// the color handling is kinda funky
// when loading from storage:
// BG: extract the 'alpha' part from the hex and convert it to opacity(slider)
// FG/border: remove the alpha part
// when saving:
// BG: add opacity to inputValue
// FG/border: extract the alpha part FROM DEFAULT COLORS and append it to input value

export function ColorSection({
  title,
  colors,
  onColorChange,
}: ColorSectionProps) {
  const [backgroundOpacity, setBackgroundOpacity] = useState(1);

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
          onChange={(value) => onColorChange("fg", value)}
          placeholder="#ffffff"
        />

        <ColorInput
          label="Background"
          value={colors.bg}
          onChange={(value) => onColorChange("bg", value)}
          placeholder="#000000"
        />

        <ColorInput
          label="Border"
          value={colors.borderColor}
          onChange={(value) => onColorChange("borderColor", value)}
          placeholder="#ffffff"
        />

        <div className="flex items-center gap-3 pt-2">
          <Label className="text-xs text-muted-foreground w-20">Opacity</Label>

          <Slider
            value={[backgroundOpacity]}
            onValueChange={(value) => {
              onColorChange("bg", updateHexOpacity(colors.bg, value[0]));
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
