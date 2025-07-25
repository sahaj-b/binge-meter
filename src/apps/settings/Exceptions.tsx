import { useStore } from "./state";
import { ReusableList } from "./ReusableList";
import { Section } from "./Section";

export function Exceptions() {
  const userRules = useStore((state) => state.userRules);
  const updateUserRule = useStore((state) => state.updateUserRule);
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
            items={Object.entries(userRules?.urls ?? {})
              .reduce((acc, [key, value]) => {
                if (value === "productive") acc.push(key);
                return acc;
              }, [] as string[])
              .reverse()}
            onAddItem={(item) => updateUserRule("urls", item, false)}
            onRemoveItem={(item) => updateUserRule("urls", item, true)}
            placeholder="https://example.com/productive"
          />
        </ListContainer>
        {isYoutubeTracked && (
          <>
            <Seperator />
            <ListContainer title="Youtube Channels">
              <ReusableList
                items={[...(userRules?.productiveYtChannels ?? [])].reverse()}
                onAddItem={(item) =>
                  updateUserRule("productiveYtChannels", item, false)
                }
                onRemoveItem={(item) =>
                  updateUserRule("productiveYtChannels", item, true)
                }
                placeholder="@channelID or ChannelName"
              />
            </ListContainer>
          </>
        )}
        {isRedditTracked && (
          <>
            <Seperator />
            <ListContainer title="productiveSubreddits">
              <ReusableList
                items={[...(userRules?.productiveSubreddits ?? [])].reverse()}
                onAddItem={(item) =>
                  updateUserRule("productiveSubreddits", item, false)
                }
                onRemoveItem={(item) =>
                  updateUserRule("productiveSubreddits", item, true)
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
