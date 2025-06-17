import type { Metadata } from "@/shared/types";
import { getStorageData } from "@/shared/store";

export async function isDistracting(metadata: Metadata): Promise<boolean> {
  const { productiveRules } = await getStorageData(["productiveRules"]);
  if (productiveRules.urls.includes(metadata.url)) return false;

  if (
    metadata.youtube?.channelId &&
    metadata.youtube?.channelName &&
    productiveRules.ytChannels.includes(
      (metadata.youtube?.channelId || metadata.youtube?.channelName) ?? "",
    )
  ) {
    return false;
  }

  if (
    metadata.reddit?.subreddit &&
    productiveRules.subreddits.includes(metadata.reddit?.subreddit ?? "")
  ) {
    return false;
  }
  return true;
}
