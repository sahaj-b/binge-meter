import { useStore } from "./state";
import { ReusableList } from "./ReusableList";

export function ProductivePages() {
  const productiveRules = useStore((state) => state.productiveRules);
  const addProductiveRule = useStore((state) => state.addProductiveRule);
  const removeProductiveRule = useStore((state) => state.removeProductiveRule);
  const error = useStore((state) => state.error);
  const trackedSites = useStore((state) => state.trackedSites);

  return (
    <div className="space-y-6 p-6 border rounded-lg bg-card/30">
      <div>
        <h2 className="text-lg font-semibold">Productive Pages</h2>
        <p className="text-sm text-muted-foreground">
          Define what content you consider productive.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h3 className="text-md font-medium mb-2">URLs</h3>
          <ReusableList
            items={productiveRules?.urls || []}
            onAddItem={(item) => addProductiveRule("urls", item)}
            onRemoveItem={(item) => removeProductiveRule("urls", item)}
            placeholder="example.com"
            error={error}
          />
        </div>
        {trackedSites?.includes("youtube.com") && (
          <div>
            <h3 className="text-md font-medium mb-2">Youtube Channels</h3>
            <ReusableList
              items={productiveRules?.ytChannels || []}
              onAddItem={(item) => addProductiveRule("ytChannels", item)}
              onRemoveItem={(item) => removeProductiveRule("ytChannels", item)}
              placeholder="@channelName"
              error={error}
            />
          </div>
        )}
        {trackedSites?.includes("reddit.com") && (
          <div>
            <h3 className="text-md font-medium mb-2">Subreddits</h3>
            <ReusableList
              items={productiveRules?.subreddits || []}
              onAddItem={(item) => addProductiveRule("subreddits", item)}
              onRemoveItem={(item) => removeProductiveRule("subreddits", item)}
              placeholder="r/subreddit"
              error={error}
            />
          </div>
        )}
      </div>
    </div>
  );
}
