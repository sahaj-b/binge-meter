import { sitePatterns } from "@/shared/utils";
import type { BlockingSettings, Message } from "@/shared/types";
import { debugLog } from "@/shared/logger";

export async function checkSitePermission(site: string): Promise<boolean> {
  if (!site) return false;

  const permissionsToRequest = {
    origins: sitePatterns(site),
  };

  debugLog("Permissions: " + chrome.permissions);
  return chrome.permissions.contains(permissionsToRequest);
}

export async function requestSitePermission(site: string) {
  if (!site) return;
  const permissionsToRequest = {
    origins: sitePatterns(site),
  };
  // removing this coz firefox doesnt trust waiting this much for asking permission duh
  // if (await checkSitePermission(site)) {
  //   debugLog(`Permission already granted for '${site}'`);
  //   return;
  // }

  const granted = await chrome.permissions.request(permissionsToRequest);
  if (!granted) {
    if (!(await checkSitePermission(site))) {
      throw new Error("Permission denied by user");
    }
  }
}

export async function getCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab;
  } catch (error) {
    console.error("Failed to get current tab:", error);
    throw error;
  }
}

export function sendToggleMessage() {
  chrome.runtime.sendMessage({ type: "TOGGLE_ALL_OVERLAYS" });
}

export function openSettingsPage() {
  chrome.runtime.openOptionsPage();
}

export function openAnalyticsPage() {
  chrome.tabs.create({
    url: chrome.runtime.getURL("src/apps/analytics/index.html"),
  });
}

export async function sendAddSiteMessage(site: string) {
  const response = await chrome.runtime.sendMessage({
    type: "ADD_TRACKED_SITE",
    site: site,
  } satisfies Message);
  if (response?.success) {
    debugLog(`Added site: ${site}`);
  } else {
    throw new Error(response?.error ?? "Unknown error occurred");
  }
}

export async function sendRemoveSiteMessage(site: string) {
  const response = await chrome.runtime.sendMessage({
    type: "REMOVE_TRACKED_SITE",
    site: site,
  } satisfies Message);
  if (response?.success) {
    debugLog(`Removed site: ${site}`);
  } else {
    throw new Error(response?.error ?? "Unknown error occurred");
  }
}

export async function markURLAs(
  url: string,
  markDistracting: boolean,
  extraMetadata?: string,
) {
  // this DELETES the URL from user rules if markDistracting is true
  const response = await chrome.runtime.sendMessage({
    type: "UPDATE_USER_RULE",
    rule: { url: [url, markDistracting ? "distracting" : "productive"] },
    extraMetadata: extraMetadata,
  } satisfies Message);
  if (!response?.success)
    throw new Error(response?.error ?? "Unknown error occurred");
}

export async function markURLAsDistracting(
  url: string,
  extraMetadata?: string,
) {
  // this is for popup button mark page as distracting (marks instead of deleting)
  const response = await chrome.runtime.sendMessage({
    type: "MARK_URL_DISTRACTING",
    rule: { url: [url, "distracting"] },
    extraMetadata: extraMetadata,
  } satisfies Message);
  if (!response?.success)
    throw new Error(response?.error ?? "Unknown error occurred");
}

export async function markChannelAs(channel: string, markDistracting: boolean) {
  const response = await chrome.runtime.sendMessage({
    type: "UPDATE_USER_RULE",
    rule: {
      productiveYtChannel: [
        channel,
        markDistracting ? "distracting" : "productive",
      ],
    },
  } satisfies Message);
  if (!response?.success)
    throw new Error(response?.error ?? "Unknown error occurred");
}

export async function markSubredditAs(
  subreddit: string,
  markDistracting: boolean,
) {
  const response = await chrome.runtime.sendMessage({
    type: "UPDATE_USER_RULE",
    rule: {
      productiveSubreddit: [
        subreddit,
        markDistracting ? "distracting" : "productive",
      ],
    },
  } satisfies Message);
  if (!response?.success)
    throw new Error(response?.error ?? "Unknown error occurred");
}

export async function sendResetTimeMessage(time: {
  hours: number;
  minutes: number;
}) {
  await chrome.runtime.sendMessage({
    type: "SET_RESET_TIME",
    resetTime: time,
  } satisfies Message);
}

export async function sendUpdateBlockingSettingsMsg(
  updates: Partial<BlockingSettings>,
) {
  await chrome.runtime.sendMessage({
    type: "UPDATE_BLOCKING_SETTINGS",
    blockingUpdates: updates,
  } satisfies Message);
}

export async function sendClearGraceMessage() {
  await chrome.runtime.sendMessage({
    type: "CLEAR_GRACE_PERIOD",
  } satisfies Message);
}
