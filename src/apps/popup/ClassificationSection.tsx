import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import type { Metadata } from "@/shared/types";
import { isDistracting } from "@/shared/utils";
import {
  markPageAsProductive,
  markPageAsDistracting,
} from "@/apps/lib/browserService";
import { Button } from "@ui/button";
import { Dropdown, DropdownItem } from "@ui/dropdown";

export function ClassificationSection({
  metadata,
  currentSite,
}: {
  metadata: Metadata | null;
  currentSite: string;
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

  const handleMarkAs = async (targetUrl: string, isProductive: boolean) => {
    if (!metadata) return;

    setIsLoading(true);
    try {
      if (isProductive) {
        await markPageAsProductive(targetUrl);
      } else {
        await markPageAsDistracting(targetUrl);
      }
      const newDistracting = await isDistracting(metadata);
      setIsCurrentlyDistracting(newDistracting);
    } catch (error) {
      console.error("Failed to mark content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!metadata) return null;

  const isYouTube = currentSite.endsWith("youtube.com");
  const isReddit = currentSite.endsWith("reddit.com");

  let targetUrl = metadata.url;
  let displayText = "Mark page as";

  if (isYouTube && metadata.youtube?.channelId) {
    targetUrl = metadata.youtube.channelId;
    const channelName = metadata.youtube.channelName || "Unknown Channel";
    const truncatedName =
      channelName.length > 20
        ? channelName.substring(0, 20) + "..."
        : channelName;
    displayText = `Mark channel ${truncatedName} as`;
  } else if (isReddit && metadata.reddit?.subreddit) {
    targetUrl = metadata.reddit.subreddit;
    const subredditName = metadata.reddit.subreddit;
    const truncatedName =
      subredditName.length > 20
        ? subredditName.substring(0, 20) + "..."
        : subredditName;
    displayText = `Mark subreddit r/${truncatedName} as`;
  }

  const statusText =
    isCurrentlyDistracting === null
      ? "d/p"
      : isCurrentlyDistracting
        ? "productive"
        : "distracting";
  const buttonText = `${displayText} ${statusText}`;
  const buttonVariant =
    isCurrentlyDistracting === null
      ? "secondary"
      : isCurrentlyDistracting
        ? "destructive"
        : "default";

  if (isYouTube || isReddit) {
    return (
      <div className="p-4 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Classification
        </h3>
        <Dropdown
          trigger={
            <Button
              variant={buttonVariant}
              disabled={isLoading}
              className="w-full justify-between"
            >
              <span>{buttonText}</span>
              <ChevronDown size={16} />
            </Button>
          }
        >
          <DropdownItem
            onClick={() => handleMarkAs(metadata.url, !isCurrentlyDistracting)}
            className="text-center"
          >
            Mark page as {isCurrentlyDistracting ? "Productive" : "Distracting"}
          </DropdownItem>
        </Dropdown>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Classification</h3>
      <Button
        variant={buttonVariant}
        disabled={isLoading}
        className="w-full"
        onClick={() => handleMarkAs(targetUrl, !isCurrentlyDistracting)}
      >
        {buttonText}
      </Button>
    </div>
  );
}
