import { Label } from "@ui/label";
import { Switch } from "@ui/switch";
import { type OverlayConfig, setStorageData } from "../../core/store";
import { DurationPicker } from "../components/ui/duration-picker";

interface OverlaySettingsProps {
  config: OverlayConfig;
  onConfigUpdate: (updates: Partial<OverlayConfig>) => void;
}

export function OverlaySettings({
  config,
  onConfigUpdate,
}: OverlaySettingsProps) {
  function saveConfig(updatedConfig: OverlayConfig) {
    setStorageData({ overlayConfig: updatedConfig });
  }

  const handleConfigUpdate = (updates: Partial<OverlayConfig>) => {
    const updatedConfig = { ...config, ...updates };
    onConfigUpdate(updates);
    saveConfig(updatedConfig);
  };
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
              checked={!config.isHidden}
              onCheckedChange={(checked) =>
                handleConfigUpdate({ isHidden: !checked })
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
              totalMilliseconds={config.thresholdWarn}
              setTotalMilliseconds={(value) =>
                handleConfigUpdate({ thresholdWarn: value })
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
              totalMilliseconds={config.thresholdDanger}
              setTotalMilliseconds={(value) =>
                handleConfigUpdate({ thresholdDanger: value })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
