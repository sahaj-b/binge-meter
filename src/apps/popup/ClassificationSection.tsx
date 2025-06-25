import { useState, useEffect } from "react";
import type { Metadata } from "@/shared/types";
import { isDistracting } from "@/shared/utils";
import {
  markURLAs,
  markSubredditAs,
  markChannelAs,
} from "@/apps/lib/browserService";
import { Button } from "@ui/button";

export function ClassificationSection({
  metadata,
}: {
  metadata: Metadata | null;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCurrentlyDistracting, setIsCurrentlyDistracting] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    console.log("metadata", metadata);
    async function checkCurrentStatus() {
      if (!metadata) return;

      try {
        const distracting = await isDistracting(metadata);
        setIsCurrentlyDistracting(distracting);
      } catch (error) {
        console.error("Failed to check current status:", error);
      }
    }

    checkCurrentStatus();
  }, [metadata]);

  const handleMarkAs = async (targetUrl: string, markDistracting: boolean) => {
    if (!metadata) return;

    setIsLoading(true);
    try {
      if (isYouTube) await markChannelAs(targetUrl, markDistracting);
      else if (isReddit) await markSubredditAs(targetUrl, markDistracting);
      else await markURLAs(targetUrl, markDistracting);
      const newDistractingStatus = await isDistracting(metadata);
      setIsCurrentlyDistracting(newDistractingStatus);
    } catch (error) {
      console.error("Failed to mark content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!metadata) return null;

  const isYouTube = metadata.youtube?.channelId;
  const isReddit = metadata.reddit?.subreddit;

  let targetUrl = metadata.url;
  let displayEle = <span>Mark page as</span>;

  if (isYouTube && metadata.youtube?.channelId) {
    targetUrl = metadata.youtube.channelId;
    const channelName = metadata.youtube.channelName || "Unknown Channel";
    const truncatedName = truncateText(channelName);
    displayEle = (
      <span>
        Mark channel <b>{truncatedName}</b> as
      </span>
    );
  } else if (isReddit && metadata.reddit?.subreddit) {
    targetUrl = metadata.reddit.subreddit;
    const subredditName = metadata.reddit.subreddit;
    const truncatedName = truncateText(subredditName);
    displayEle = (
      <span>
        Mark <b>r/{truncatedName}</b> as
      </span>
    );
  }

  displayEle = (
    <>
      {displayEle}
      <span
        className={
          "-ml-1 " +
          (isCurrentlyDistracting ? "text-green-400" : "text-primary")
        }
      >
        {isCurrentlyDistracting ? "Productive" : "Distracting"}
      </span>
    </>
  );

  if (isYouTube || isReddit) {
    return (
      <div className="p-3 bg-card/30 border rounded-lg">
        <h3 className="text-lg font-medium mb-3">
          Current page is{" "}
          {isCurrentlyDistracting ? (
            <b className="text-primary">Distracting</b>
          ) : (
            <b className="text-green-400">Productive</b>
          )}
        </h3>
        <Button
          variant="secondary"
          disabled={isLoading}
          className="w-full justify-between"
          onClick={() => handleMarkAs(targetUrl, !isCurrentlyDistracting)}
        >
          {displayEle}
        </Button>
        {isYouTube || isReddit ? (
          <div className="flex flex-col gap-2 mt-2 justify-center items-center">
            <div className="text-muted-foreground">OR</div>
            <Button
              variant="secondary"
              disabled={isLoading}
              className="w-full"
              onClick={() => handleMarkAs(targetUrl, !isCurrentlyDistracting)}
            >
              Mark this Page as
              {isCurrentlyDistracting ? (
                <span className="-ml-1 text-green-400">Productive</span>
              ) : (
                <span className="-ml-1 text-primary">Distracting</span>
              )}
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Classification</h3>
      <Button
        variant="secondary"
        disabled={isLoading}
        className="w-full"
        onClick={() => handleMarkAs(targetUrl, !isCurrentlyDistracting)}
      >
        {displayEle}
      </Button>
    </div>
  );
}

function truncateText(text: string) {
  if (text.length <= 16) return text;
  return text.substring(0, 16) + "…";
}
