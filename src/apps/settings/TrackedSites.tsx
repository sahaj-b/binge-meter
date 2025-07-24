import { useStore } from "./state";
import { ReusableList } from "./ReusableList";
import { Section } from "./Section";
import { Toggle } from "@ui/toggle";
import { Slash } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../components/ui/tooltip";

export function TrackedSites() {
  const trackedSites = useStore((state) => state.trackedSites);
  const addSite = useStore((state) => state.addSite);
  const removeSite = useStore((state) => state.removeSite);
  const inputError = useStore((state) => state.inputError);
  const aiEnabled = useStore((state) => state.aiEnabled);
  const aiDisabledSites = useStore((state) => state.aiDisabledSites);
  const toggleAiDisabledSite = useStore((state) => state.toggleAiDisabledSite);

  return (
    <Section
      title="Tracked Sites"
      description="You can always add current site by clicking the extension icon"
    >
      {inputError && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{inputError}</p>
        </div>
      )}
      <ReusableList
        items={[...(trackedSites ?? [])].reverse()}
        onAddItem={addSite}
        onRemoveItem={removeSite}
        placeholder="youtube.com (no www.)"
        actions={(item) =>
          aiEnabled && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  {/* wrapper div coz tooltip is hijacking toggle data-state/slot */}
                  <Toggle
                    size="sm"
                    pressed={aiDisabledSites?.includes(item)}
                    onPressedChange={() => toggleAiDisabledSite(item)}
                    className="text-muted-foreground/50 hover:bg-input/30 data-[state=on]:text-destructive data-[state=on]:bg-destructive/10"
                  >
                    <span className="text-sm relative">
                      AI
                      <Slash className="size-4 absolute top-0.5 -left-0.5 rotate-90" />
                    </span>
                  </Toggle>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">
                Disable AI classification for this site
              </TooltipContent>
            </Tooltip>
          )
        }
      />
    </Section>
  );
}
