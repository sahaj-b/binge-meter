import { Label } from "@ui/label";
import { Switch } from "@ui/switch";
import { DurationPicker } from "@ui/duration-picker";
import { useStore } from "./store";
import { Section } from "./Section";
import { DynamicList } from "./DynamicList";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui/tooltip";
import { HelpCircle } from "lucide-react";

export function BlockingSection() {
  const blockingSettings = useStore((state) => state.blockingSettings);
  const updateBlockingSettings = useStore(
    (state) => state.updateBlockingSettings,
  );
  const addBlockingException = useStore((state) => state.addBlockingException);
  const removeBlockingException = useStore(
    (state) => state.removeBlockingException,
  );
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
          <Label className="text-sm font-medium flex items-center gap-1">
            URL Exceptions
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="size-3 relative top-[0.5px]" />
              </TooltipTrigger>
              <TooltipContent>
                Use '<span className="text-primary">*</span>' as a wildcard to
                match anything
              </TooltipContent>
            </Tooltip>
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            These urls will not be blocked
          </p>
          <DynamicList
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
