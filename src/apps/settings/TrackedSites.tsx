import { Button } from "@ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@ui/dialog";
import { Toggle } from "@ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui/tooltip";
import { Slash, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { DynamicList } from "./DynamicList";
import { Section } from "./Section";
import { useStore } from "./store";

export function TrackedSites() {
  const trackedSites = useStore((state) => state.trackedSites);
  const addSite = useStore((state) => state.addSite);
  const removeSite = useStore((state) => state.removeSite);
  const inputError = useStore((state) => state.inputError);
  const aiEnabled = useStore((state) => state.aiEnabled);
  const aiDisabledSites = useStore((state) => state.aiDisabledSites);
  const toggleAiDisabledSite = useStore((state) => state.toggleAiDisabledSite);
  const trackAllSites = useStore((state) => state.trackAllSites);
  const setTrackAllSites = useStore((state) => state.setTrackAllSites);

  const [dialogOpen, setDialogOpen] = useState(false);

  const trackAllSitesDialog = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Track All Sites
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-medium">Track All Sites</h3>
          <p className="text-sm text-muted-foreground">
            This will track time spent on ALL websites, not just the ones you've
            added.
          </p>
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
            <TriangleAlert className="size-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm space-y-2">
              <p className="font-medium text-amber-500">Warning</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>
                  AI classification will run on <strong>every</strong> page you
                  visit
                </li>
                <li>This will significantly increase AI API usage and costs</li>
                <li>
                  Your tracked sites list will be ignored (but not deleted)
                </li>
              </ul>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setTrackAllSites(true);
                setDialogOpen(false);
              }}
            >
              Enable
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const rightElement = trackAllSites ? (
    <Button variant="outline" size="sm" onClick={() => setTrackAllSites(false)}>
      Stop Tracking All Sites
    </Button>
  ) : (
    trackAllSitesDialog
  );

  return (
    <Section
      title="Tracked Sites"
      description="You can always add current site by clicking the extension icon"
      rightElement={rightElement}
    >
      {inputError && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{inputError}</p>
        </div>
      )}
      {trackAllSites && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-md">
          <p className="text-sm text-muted-foreground">
            Track All Sites is enabled. The list below is currently being
            ignored.
          </p>
        </div>
      )}
      <DynamicList
        items={[...(trackedSites ?? [])].reverse()}
        onAddItem={addSite}
        onRemoveItem={removeSite}
        placeholder="youtube.com (no www.)"
        disabled={trackAllSites ?? false}
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
