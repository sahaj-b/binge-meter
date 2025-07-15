import { useStore } from "./state";
import { ReusableList } from "./ReusableList";

export function TrackedSites() {
  const trackedSites = useStore((state) => state.trackedSites);
  const addSite = useStore((state) => state.addSite);
  const removeSite = useStore((state) => state.removeSite);
  const inputError = useStore((state) => state.inputError);

  return (
    <div className="space-y-6 p-6 border rounded-lg bg-card/30">
      <div>
        <h2 className="text-lg font-semibold">Tracked Sites</h2>
        <p className="text-sm text-muted-foreground">
          You can always add current site by clicking the extension icon
        </p>
      </div>
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
      />
    </div>
  );
}
