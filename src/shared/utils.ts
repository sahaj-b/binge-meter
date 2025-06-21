import { getStorageData } from "@/shared/store";
import type { ProductiveRules, Metadata } from "@/shared/types";

export function sitePatterns(site: string): string[] {
  return [`*://${site}/*`, `*://www.${site}/*`];
}

export async function isDistracting(
  metadata: Metadata,
  productiveRules?: ProductiveRules,
): Promise<boolean> {
  if (!productiveRules)
    productiveRules = (await getStorageData(["productiveRules"]))
      .productiveRules;

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
