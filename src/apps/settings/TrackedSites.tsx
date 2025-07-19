import { useStore } from "./state";
import { ReusableList } from "./ReusableList";
import { Section } from "./Section";

export function TrackedSites() {
  const trackedSites = useStore((state) => state.trackedSites);
  const addSite = useStore((state) => state.addSite);
  const removeSite = useStore((state) => state.removeSite);
  const inputError = useStore((state) => state.inputError);

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
      />
    </Section>
  );
}
