import { Label } from "@ui/label";
import { Switch } from "@ui/switch";
import { DurationPicker } from "../components/ui/duration-picker";
import { useStore } from "./state";

export function OverlaySettings() {
  const updateConfig = useStore((state) => state.updateConfig);
  const isHidden = useStore((state) => state.overlayConfig?.isHidden);
  const thresholdWarn =
    useStore((state) => state.overlayConfig?.thresholdWarn) ?? 0;
  const thresholdDanger =
    useStore((state) => state.overlayConfig?.thresholdDanger) ?? 0;
  return (
    <div className="space-y-6 p-6 border rounded-lg bg-card/30">
      <div>
        <h2 className="text-lg font-semibold">Overlay Settings</h2>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Show Overlay</Label>
            </div>
            <Switch
              checked={!isHidden}
              onCheckedChange={(checked) =>
                updateConfig({ isHidden: !checked }, true)
              }
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between">
            <div>
              <Label className="text-sm font-medium">Warning Threshold</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Use Warning colors when time exceeds this threshold
              </p>
            </div>
            <DurationPicker
              totalMilliseconds={thresholdWarn}
              setTotalMilliseconds={(value) =>
                updateConfig({ thresholdWarn: value }, true)
              }
            />
          </div>
          <div className="flex justify-between">
            <div>
              <Label className="text-sm font-medium">Danger Threshold</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Use Danger colors when time exceeds this threshold
              </p>
            </div>
            <DurationPicker
              totalMilliseconds={thresholdDanger}
              setTotalMilliseconds={(value) =>
                updateConfig({ thresholdDanger: value }, true)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
