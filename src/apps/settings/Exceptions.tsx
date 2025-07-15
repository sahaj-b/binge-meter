import { useStore } from "./state";
import { ReusableList } from "./ReusableList";

export function Exceptions() {
  const productiveRules = useStore((state) => state.productiveRules);
  const addProductiveRule = useStore((state) => state.addProductiveRule);
  const removeProductiveRule = useStore((state) => state.removeProductiveRule);
  const trackedSites = useStore((state) => state.trackedSites);
  const error = useStore((state) => state.error);
  const isYoutubeTracked = trackedSites?.includes("youtube.com");
  const isRedditTracked = trackedSites?.includes("reddit.com");

  return (
    <div className="space-y-6 p-6 border rounded-lg bg-card/30">
      <div>
        <h2 className="text-lg font-semibold">Exceptions (Productive Pages)</h2>
        <p className="text-sm text-muted-foreground">
          Define what content you consider productive inside Tracked Sites.
          <br />
          Using extension icon is more intuitive though
        </p>
      </div>
      <div className="flex gap-6">
        <ListContainer title="URLs">
          <ReusableList
            items={productiveRules?.urls || []}
            onAddItem={(item) => addProductiveRule("urls", item)}
            onRemoveItem={(item) => removeProductiveRule("urls", item)}
            placeholder="https://example.com/productive"
          />
        </ListContainer>
        {isYoutubeTracked && (
          <ListContainer title="Youtube Channels">
            <ReusableList
              items={productiveRules?.ytChannels || []}
              onAddItem={(item) => addProductiveRule("ytChannels", item)}
              onRemoveItem={(item) => removeProductiveRule("ytChannels", item)}
              placeholder="@channelID or ChannelName"
            />
          </ListContainer>
        )}
        {isRedditTracked && (
          <ListContainer title="Subreddits">
            <ReusableList
              items={productiveRules?.subreddits || []}
              onAddItem={(item) => addProductiveRule("subreddits", item)}
              onRemoveItem={(item) => removeProductiveRule("subreddits", item)}
              placeholder="SubredditName"
            />
          </ListContainer>
        )}
      </div>
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">ERROR: {error}</p>
        </div>
      )}
    </div>
  );
}

function ListContainer({
  title,
  children,
}: { title: string; children: React.ReactNode }) {
  return (
    <div className="basis-0 grow">
      <h3 className="text-lg mb-2">{title}</h3>
      {children}
    </div>
  );
}
