import { useState } from "react";
import { Button } from "@ui/button";
import { Input } from "@ui/input";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { useStore } from "./state";

export function TrackedSites() {
  const [newSite, setNewSite] = useState("");
  const [isAddingLoading, setIsAddingLoading] = useState(false);
  const [removingLoadingSet, setRemovingLoadingSet] = useState<Set<string>>(
    new Set(),
  );
  const [error, setError] = useState<string | null>(null);
  const trackedSites = useStore((state) => state.trackedSites);
  const addSite = useStore((state) => state.addSite);
  const removeSite = useStore((state) => state.removeSite);

  async function handleAddSite() {
    setIsAddingLoading(true);
    setError(null);
    await addSite(newSite).catch((err) => {
      setIsAddingLoading(false);
      setError(err instanceof Error ? err.message : "Failed to add site");
    });
    setNewSite("");
    setIsAddingLoading(false);
  }

  async function handleRemoveSite(site: string) {
    setRemovingLoadingSet((prev) => new Set(prev).add(site));
    setError(null);
    await removeSite(site).catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to remove site");
    });
    setRemovingLoadingSet((prev) => {
      const newSet = new Set(prev);
      newSet.delete(site);
      return newSet;
    });
  }

  return (
    <div className="space-y-6 p-6 border rounded-lg bg-card/30">
      <div>
        <h2 className="text-lg font-semibold">Tracked Sites</h2>
        <p className="text-sm text-muted-foreground">
          You can always add current site by clicking the extension icon
        </p>
      </div>
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">ERROR: {error}</p>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="youtube.com (no www.)"
            className="text-sm"
            value={newSite}
            onChange={(e) => setNewSite(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddSite()}
            disabled={isAddingLoading}
          />
          <Button
            onClick={handleAddSite}
            size="icon"
            disabled={isAddingLoading}
          >
            {isAddingLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus />
            )}
          </Button>
        </div>

        <div className="space-y-2">
          {trackedSites?.map((site) => (
            <div
              key={site}
              className="flex items-center justify-between py-2 px-3 bg-muted/60 rounded-md"
            >
              <span className="text-sm">{site}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveSite(site)}
                className="hover:bg-destructive/10 hover:text-destructive"
                disabled={removingLoadingSet.has(site)}
              >
                {removingLoadingSet.has(site) ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
