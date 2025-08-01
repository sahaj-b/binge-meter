import { Switch } from "@ui/switch";
import { Label } from "@ui/label";
import usePopupStore from "./store";

export function TogglesSection() {
  const overlayHidden = usePopupStore((state) => state.overlayHidden);
  const aiEnabled = usePopupStore((state) => state.aiEnabled);
  const toggleOverlay = usePopupStore((state) => state.toggleOverlay);
  const toggleAI = usePopupStore((state) => state.toggleAI);
  const hasAPIKey = usePopupStore((state) => state.hasAPIKey);
  return (
    <div className="p-3 bg-card/60 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Label htmlFor="overlay-toggle">Show Overlay</Label>
        </div>
        <Switch
          id="overlay-toggle"
          checked={!overlayHidden}
          onCheckedChange={toggleOverlay}
        />
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="ai-toggle">Enable AI Classification</Label>
        </div>
        <Switch id="ai-toggle" checked={aiEnabled} onCheckedChange={toggleAI} />
      </div>
      {!hasAPIKey && aiEnabled && (
        <p className="text-sm text-red-500 mt-2">
          API key is required. Set it in the settings
        </p>
      )}
    </div>
  );
}
