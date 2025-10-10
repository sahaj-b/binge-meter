import { Label } from "@ui/label";
import { Section } from "./Section";
import { useStore } from "./store";
import { TimeSelector } from "./TimeSelector";

export function MiscSettings() {
  const resetTime = useStore((state) => state.resetTime);
  const setResetTime = useStore((state) => state.setResetTime);
  const miscError = useStore((state) => state.miscError);

  return (
    <Section title="Misc" description="Other miscellaneous settings">
      <div className="flex items-center justify-between space-x-4">
        <Label htmlFor="reset-time">Daily Reset Time</Label>
        <TimeSelector
          hours={resetTime?.hours}
          minutes={resetTime?.minutes}
          onTimeChange={(hours, minutes) => {
            setResetTime({ hours, minutes });
          }}
        />
      </div>
      {miscError && <div className="text-destructive text-sm">{miscError}</div>}
    </Section>
  );
}
