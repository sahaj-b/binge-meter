import { Label } from "@ui/label";
import { Slider } from "@ui/slider";
import { Button } from "@ui/button";
import {
  type OverlayConfig,
  setStorageData,
  defaultOverlayConfig,
} from "@core/store";
import { ColorSection } from "./ColorSection";

interface OverlayStylesProps {
  config: OverlayConfig;
  onStyleChange: (updates: Partial<OverlayConfig>) => void;
}

export function OverlayStyles({ config, onStyleChange }: OverlayStylesProps) {
  async function resetToDefaults() {
    const updates = {
      blur: defaultOverlayConfig.blur,
      borderRadius: defaultOverlayConfig.borderRadius,
      colors: defaultOverlayConfig.colors,
      warnColors: defaultOverlayConfig.warnColors,
      dangerColors: defaultOverlayConfig.dangerColors,
    };
    onStyleChange(updates);
    await setStorageData({ overlayConfig: { ...config, ...updates } });
  }

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
                value={[config.borderRadius]}
                onValueChange={async (value) => {
                  onStyleChange({ borderRadius: value[0] });
                }}
                max={50}
                min={0}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8">
                {config.borderRadius}px
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Blur</Label>
            </div>
            <div className="flex items-center gap-3 w-48">
              <Slider
                value={[config.blur]}
                onValueChange={async (value) => {
                  const updates = { blur: value[0] };
                  onStyleChange(updates);
                  await setStorageData({
                    overlayConfig: { ...config, ...updates },
                  });
                }}
                max={15}
                min={0}
                step={0.2}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8">
                {config.blur.toFixed(1)}px
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <ColorSection
            title="Normal Colors"
            colors={config.colors}
            onColorChange={(colorKey, value) =>
              onStyleChange({ colors: { ...config.colors, [colorKey]: value } })
            }
          />

          <ColorSection
            title="Warning Colors"
            colors={config.warnColors}
            onColorChange={(colorKey, value) =>
              onStyleChange({
                warnColors: { ...config.warnColors, [colorKey]: value },
              })
            }
          />

          <ColorSection
            title="Danger Colors"
            colors={config.dangerColors}
            onColorChange={(colorKey, value) =>
              onStyleChange({
                dangerColors: { ...config.dangerColors, [colorKey]: value },
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
