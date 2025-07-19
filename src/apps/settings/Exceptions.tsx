import { useStore } from "./state";
import { ReusableList } from "./ReusableList";
import { Section } from "./Section";

export function Exceptions() {
  const productiveRules = useStore((state) => state.productiveRules);
  const addProductiveRule = useStore((state) => state.addProductiveRule);
  const removeProductiveRule = useStore((state) => state.removeProductiveRule);
  const trackedSites = useStore((state) => state.trackedSites);
  const isYoutubeTracked = trackedSites?.includes("youtube.com");
  const isRedditTracked = trackedSites?.includes("reddit.com");

  return (
    <Section
      title="Exceptions (Productive Pages)"
      description={
        <>
          Define what content you consider productive inside Tracked Sites.
          <br />
          Using extension icon is more intuitive though
        </>
      }
    >
      <div className="flex flex-col lg:flex-row gap-3">
        <ListContainer title="URLs">
          <ReusableList
            items={[...(productiveRules?.urls ?? [])].reverse()}
            onAddItem={(item) => addProductiveRule("urls", item)}
            onRemoveItem={(item) => removeProductiveRule("urls", item)}
            placeholder="https://example.com/productive"
          />
        </ListContainer>
        {isYoutubeTracked && (
          <>
            <Seperator />
            <ListContainer title="Youtube Channels">
              <ReusableList
                items={[...(productiveRules?.ytChannels ?? [])].reverse()}
                onAddItem={(item) => addProductiveRule("ytChannels", item)}
                onRemoveItem={(item) =>
                  removeProductiveRule("ytChannels", item)
                }
                placeholder="@channelID or ChannelName"
              />
            </ListContainer>
          </>
        )}
        {isRedditTracked && (
          <>
            <Seperator />
            <ListContainer title="Subreddits">
              <ReusableList
                items={[...(productiveRules?.subreddits ?? [])].reverse()}
                onAddItem={(item) => addProductiveRule("subreddits", item)}
                onRemoveItem={(item) =>
                  removeProductiveRule("subreddits", item)
                }
                placeholder="SubredditName"
              />
            </ListContainer>
          </>
        )}
      </div>
    </Section>
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

function Seperator() {
  return <div className="min-h-full w-px bg-muted" />;
}
