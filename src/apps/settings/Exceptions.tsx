import { useStore } from "./store";
import { ReusableList } from "./ReusableList";
import { Section } from "./Section";
import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui/tooltip";
import { HelpCircle } from "lucide-react";

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
      <div className="flex flex-col [@media(min-width:950px)]:flex-row gap-3">
        <ListContainer
          title={
            <div className="flex items-center gap-2">
              URLs{" "}
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="size-3" />
                </TooltipTrigger>
                <TooltipContent>
                  Use '<span className="text-primary">*</span>' as a wildcard to
                  match anything
                </TooltipContent>
              </Tooltip>
            </div>
          }
        >
          <ReusableList
            items={Object.entries(userRules?.urls ?? {})
              .reduce((acc, [key, value]) => {
                if (value[0] === "productive") acc.push(key);
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
            <ListContainer title="Subreddits">
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
}: { title: string | ReactNode; children: React.ReactNode }) {
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
