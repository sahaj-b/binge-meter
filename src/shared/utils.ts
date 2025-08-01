import { getStorageData } from "@/shared/storage";
import type { UserRules, Metadata } from "@/shared/types";

export function sitePatterns(site: string): string[] {
  return [`*://${site}/*`, `*://www.${site}/*`];
}

export function matchUrl(url: string, pattern: string): boolean {
  if (pattern.includes("*")) {
    // Escape special regex characters in the pattern.
    const regexPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    // Replace the glob star '*' with the regex '.*'.
    const finalRegex = new RegExp(`^${regexPattern.replace(/\*/g, ".*")}`);
    return finalRegex.test(url);
  }

  if (url === pattern) return true;

  // dont care about query strings(?...)
  // IMPORTANT: its one way, so it will match example.com?refer=xyz to example.com
  // but it will match example.com?refer=xyz to example.com
  if (url.startsWith(pattern) && url.charAt(pattern.length) === "?")
    return true;

  // dont care about trailing slash
  if (
    (pattern.endsWith("/") && pattern.slice(0, -1) === url) ||
    (url.endsWith("/") && url.slice(0, -1) === pattern)
  )
    return true;

  return false;
}

export async function classifyByUserRules(
  metadata: Metadata,
  userRules?: UserRules,
): Promise<"distracting" | "productive" | null> {
  // null means not in user rules(for url only)
  if (!userRules) userRules = (await getStorageData(["userRules"])).userRules;
  const urlDistracting = await isURLDistracting(metadata.url, userRules);
  if (urlDistracting !== null)
    return urlDistracting ? "distracting" : "productive";
  if (
    metadata.youtube?.channelId &&
    metadata.youtube?.channelName &&
    (!(await isChannelDistracting(metadata.youtube.channelId, userRules)) ||
      !(await isChannelDistracting(metadata.youtube.channelName, userRules)))
  ) {
    return "productive";
  }

  if (
    metadata.reddit?.subreddit &&
    !(await isSubredditDistracting(metadata.reddit.subreddit, userRules))
  ) {
    return "productive";
  }

  return null;
}

export async function isURLDistracting(
  url: string,
  userRules?: UserRules,
): Promise<boolean | null> {
  const data = await getStorageData([
    "userRules",
    "aiCache",
    "aiEnabled",
    "aiDisabledSites",
  ]);
  if (!userRules) userRules = data.userRules;

  for (const pattern in userRules.urls) {
    if (matchUrl(url, pattern))
      return userRules.urls[pattern][0] === "distracting";
  }

  if (url.includes("youtube.com/shorts")) return true;
  if (
    data.aiEnabled &&
    !data.aiDisabledSites.some((site) => url.includes(site))
  ) {
    const aiEntry = data.aiCache.find(([uurl]) => uurl === url);
    if (aiEntry) return aiEntry[1] === "distracting";
  }
  return null;
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

export async function isUrlBlocked(url: string) {
  const { blockingSettings, dailyTime } = await getStorageData([
    "blockingSettings",
    "dailyTime",
  ]);
  if (!blockingSettings.enabled) return false;

  const timeLimitExceeded =
    blockingSettings.gracePeriodUntil <= Date.now() &&
    dailyTime.total >= blockingSettings.timeLimit;
  if (!timeLimitExceeded) return false;

  const isException = blockingSettings.urlExceptions.some((pattern) =>
    matchUrl(url, pattern),
  );
  if (isException) return false;

  return true;
}
