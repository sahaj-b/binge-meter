import { useState, useEffect } from "react";
import { Label } from "@ui/label";
import { Slider } from "@ui/slider";
import { Button } from "@ui/button";
import {
  type OverlayConfig,
  setStorageData,
  defaultStorageData,
} from "@core/store";
import { ColorSection } from "./ColorSection";
import { addAlphaToHex, updateHexOpacity } from "./utils";

const defaultOverlayConfig = defaultStorageData.overlayConfig;

interface OverlayStylesProps {
  config: OverlayConfig;
  onConfigUpdate: (updates: Partial<OverlayConfig>) => void;
}

export function OverlayStyles({ config, onConfigUpdate }: OverlayStylesProps) {
  const [normalBackgroundOpacity, setNormalBackgroundOpacity] = useState(1);
  const [warnBackgroundOpacity, setWarnBackgroundOpacity] = useState(1);
  const [dangerBackgroundOpacity, setDangerBackgroundOpacity] = useState(1);

  useEffect(() => {
    if (config) {
      setNormalBackgroundOpacity(extractOpacityFromColor(config.colors.bg));
      setWarnBackgroundOpacity(extractOpacityFromColor(config.warnColors.bg));
      setDangerBackgroundOpacity(
        extractOpacityFromColor(config.dangerColors.bg),
      );
    }
  }, [config]);

  const extractOpacityFromColor = (color: string): number => {
    if (color.startsWith("#") && color.length === 9) {
      return parseInt(color.slice(-2), 16) / 255;
    }
    return 1;
  };

  async function resetToDefaults() {
    const updates = {
      blur: defaultOverlayConfig.blur,
      borderRadius: defaultOverlayConfig.borderRadius,
      colors: defaultOverlayConfig.colors,
      warnColors: defaultOverlayConfig.warnColors,
      dangerColors: defaultOverlayConfig.dangerColors,
    };
    onConfigUpdate(updates);
    await setStorageData({ overlayConfig: { ...config, ...updates } });
  }

  async function updateColors(
    colorType: "colors" | "warnColors" | "dangerColors",
    colorKey: "fg" | "bg" | "borderColor",
    value: string,
  ) {
    let finalValue = value;

    if (colorKey === "fg" || colorKey === "borderColor") {
      const defaultAlpha = defaultOverlayConfig[colorType][colorKey].slice(-2);
      if (defaultOverlayConfig[colorType][colorKey].length === 9) {
        finalValue = addAlphaToHex(value, defaultAlpha);
      }
    } else if (colorKey === "bg") {
      finalValue = updateHexOpacity(value, normalBackgroundOpacity);
    }

    const updates = {
      [colorType]: {
        ...config[colorType],
        [colorKey]: finalValue,
      },
    };
    onConfigUpdate(updates);
    await setStorageData({ overlayConfig: { ...config, ...updates } });
  }

  const handleOpacityChange = async (
    colorType: "colors" | "warnColors" | "dangerColors",
    value: number,
  ) => {
    if (colorType === "colors") {
      setNormalBackgroundOpacity(value);
    } else if (colorType === "warnColors") {
      setWarnBackgroundOpacity(value);
    } else {
      setDangerBackgroundOpacity(value);
    }
  };

  return (
    <div className="space-y-6 p-6 border rounded-lg bg-card/30">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Overlay Styles</h2>
        <Button
          variant="outline"
          size="sm"
          className="hover:text-destructive"
          onClick={resetToDefaults}
        >
          Reset to default
        </Button>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Border Radius</Label>
            </div>
            <div className="flex items-center gap-3 w-48">
              <Slider
                value={[config.borderRadius || 8]}
                onValueChange={async (value) => {
                  const updates = { borderRadius: value[0] };
                  onConfigUpdate(updates);
                  await setStorageData({
                    overlayConfig: { ...config, ...updates },
                  });
                }}
                max={40}
                min={0}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8">
                {config.borderRadius || 8}px
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Blur</Label>
            </div>
            <div className="flex items-center gap-3 w-48">
              <Slider
                value={[config.blur || 0]}
                onValueChange={async (value) => {
                  const updates = { blur: value[0] };
                  onConfigUpdate(updates);
                  await setStorageData({
                    overlayConfig: { ...config, ...updates },
                  });
                }}
                max={20}
                min={0}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8">
                {config.blur || 0}px
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <ColorSection
            title="Normal Colors"
            colors={config.colors}
            backgroundOpacity={normalBackgroundOpacity}
            onColorChange={(colorKey, value) =>
              updateColors("colors", colorKey, value)
            }
            onOpacityChange={(_, value) => handleOpacityChange("colors", value)}
          />

          <ColorSection
            title="Warning Colors"
            colors={config.warnColors}
            backgroundOpacity={warnBackgroundOpacity}
            onColorChange={(colorKey, value) =>
              updateColors("warnColors", colorKey, value)
            }
            onOpacityChange={(_, value) =>
              handleOpacityChange("warnColors", value)
            }
          />

          <ColorSection
            title="Danger Colors"
            colors={config.dangerColors}
            backgroundOpacity={dangerBackgroundOpacity}
            onColorChange={(colorKey, value) =>
              updateColors("dangerColors", colorKey, value)
            }
            onOpacityChange={(_, value) =>
              handleOpacityChange("dangerColors", value)
            }
          />
        </div>
      </div>
    </div>
  );
}
