import { Label } from "@ui/label";
import { Switch } from "@ui/switch";
import { DurationPicker } from "@ui/duration-picker";
import { useStore } from "./store";
import { Section } from "./Section";
import { ReusableList } from "./ReusableList";

export function BlockingSection() {
  const {
    blockingSettings,
    updateBlockingSettings,
    addBlockingException,
    removeBlockingException,
  } = useStore();

  if (!blockingSettings) return null;

  const { enabled, timeLimit, urlExceptions } = blockingSettings;

  return (
    <Section
      title="Blocking"
      description="Block distracting sites after a certain time limit"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Enable Blocking</Label>
          <Switch
            checked={enabled}
            onCheckedChange={(checked) =>
              updateBlockingSettings({ enabled: checked })
            }
          />
        </div>

        <div className="flex justify-between">
          <div>
            <Label className="text-sm font-medium">Time Limit</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Block sites after this much time has been spent
            </p>
          </div>
          <DurationPicker
            totalMilliseconds={timeLimit}
            setTotalMilliseconds={(value) =>
              updateBlockingSettings({ timeLimit: value })
            }
          />
        </div>

        <div>
          <Label className="text-sm font-medium">URL Exceptions</Label>
          <p className="text-xs text-muted-foreground mb-2">
            These urls will not be blocked
          </p>
          <ReusableList
            items={urlExceptions}
            onAddItem={addBlockingException}
            onRemoveItem={removeBlockingException}
            placeholder="https://google.com"
          />
        </div>
      </div>
    </Section>
  );
}
