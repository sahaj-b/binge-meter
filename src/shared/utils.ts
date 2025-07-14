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

  if (!(await isURLDistracting(metadata.url, productiveRules))) return false;

  if (
    metadata.youtube?.channelId &&
    metadata.youtube?.channelName &&
    (!(await isChannelDistracting(
      metadata.youtube.channelId,
      productiveRules,
    )) ||
      !(await isChannelDistracting(
        metadata.youtube.channelName,
        productiveRules,
      )))
  ) {
    return false;
  }

  if (
    metadata.reddit?.subreddit &&
    !(await isSubredditDistracting(metadata.reddit.subreddit, productiveRules))
  ) {
    return false;
  }
  return true;
}

export async function isURLDistracting(
  url: string,
  productiveRules?: ProductiveRules,
): Promise<boolean> {
  if (!productiveRules)
    productiveRules = (await getStorageData(["productiveRules"]))
      .productiveRules;

  return !productiveRules.urls.includes(url);
}

export async function isChannelDistracting(
  channel: string,
  productiveRules?: ProductiveRules,
): Promise<boolean> {
  if (!productiveRules)
    productiveRules = (await getStorageData(["productiveRules"]))
      .productiveRules;

  console.log(
    "is",
    channel,
    "distracting?",
    !productiveRules.ytChannels.includes(channel),
  );
  return !productiveRules.ytChannels.includes(channel);
}

export async function isSubredditDistracting(
  subreddit: string,
  productiveRules?: ProductiveRules,
): Promise<boolean> {
  if (!productiveRules)
    productiveRules = (await getStorageData(["productiveRules"]))
      .productiveRules;

  return !productiveRules.subreddits.includes(subreddit);
}
