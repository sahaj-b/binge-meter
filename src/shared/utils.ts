import { getStorageData } from "@/shared/store";
import type { UserRules, Metadata } from "@/shared/types";

export function sitePatterns(site: string): string[] {
  return [`*://${site}/*`, `*://www.${site}/*`];
}

export async function isDistracting(
  metadata: Metadata,
  userRules?: UserRules,
): Promise<boolean> {
  if (!userRules) userRules = (await getStorageData(["userRules"])).userRules;

  if (!(await isURLDistracting(metadata.url, userRules))) return false;

  if (
    metadata.youtube?.channelId &&
    metadata.youtube?.channelName &&
    (!(await isChannelDistracting(metadata.youtube.channelId, userRules)) ||
      !(await isChannelDistracting(metadata.youtube.channelName, userRules)))
  ) {
    return false;
  }

  if (
    metadata.reddit?.subreddit &&
    !(await isSubredditDistracting(metadata.reddit.subreddit, userRules))
  ) {
    return false;
  }
  return true;
}

export async function isURLDistracting(
  url: string,
  userRules?: UserRules,
): Promise<boolean> {
  const data = await getStorageData([
    "userRules",
    "aiCache",
    "aiEnabled",
    "aiDisabledSites",
  ]);
  if (!userRules) userRules = data.userRules;
  if (url in userRules.urls) return userRules.urls[url] === "distracting";
  if (url.includes("youtube.com/shorts")) return true;
  if (
    data.aiEnabled &&
    !data.aiDisabledSites.some((site) => url.includes(site))
  ) {
    const aiEntry = data.aiCache.find(([uurl]) => uurl === url);
    if (aiEntry) return aiEntry[1] === "distracting";
  }
  return true;
}

export async function isChannelDistracting(
  channel: string,
  userRules?: UserRules,
): Promise<boolean> {
  if (!userRules) userRules = (await getStorageData(["userRules"])).userRules;

  console.log(
    "is",
    channel,
    "distracting?",
    !userRules.productiveYtChannels.includes(channel),
  );
  return !userRules.productiveYtChannels.includes(channel);
}

export async function isSubredditDistracting(
  subreddit: string,
  userRules?: UserRules,
): Promise<boolean> {
  if (!userRules) userRules = (await getStorageData(["userRules"])).userRules;

  return !userRules.productiveSubreddits.includes(subreddit);
}
