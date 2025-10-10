import { Button } from "@ui/button";
import { Label } from "@ui/label";
import { Slider } from "@ui/slider";
import { ColorSection } from "./ColorSection";
import { Section } from "./Section";
import { useStore } from "./store";

export function OverlayStyles() {
  const resetToDefaults = useStore((state) => state.resetStylesToDefault);
  const updateStyles = useStore((state) => state.updateStyles);
  const config = useStore((state) => state.overlayConfig);
  if (!config) {
    return null;
  }
  return (
    <Section
      title="Overlay Styles"
      description="Customize the appearance of the overlay"
      rightElement={
        <Button
          variant="outline"
          size="sm"
          className="hover:text-red-400"
          onClick={resetToDefaults}
        >
          Reset to default
        </Button>
      }
      id="overlay-styles-header"
    >
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
                  updateStyles({ borderRadius: value[0] });
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
                onValueChange={(value) => {
                  updateStyles({ blur: value[0] });
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

        <div className="flex flex-col [@media(min-width:950px)]:flex-row gap-4">
          <ColorSection type="normal" colors={config.colors} />
          <ColorSection type="warning" colors={config.warnColors} />
          <ColorSection type="danger" colors={config.dangerColors} />
        </div>
      </div>
    </Section>
  );
}
