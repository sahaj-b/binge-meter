import { getStorageData } from "@/shared/store";
import { sitePatterns } from "@/shared/utils";
import type { Message, StorageData } from "@/shared/types";

export async function checkSitePermission(site: string): Promise<boolean> {
  if (!site) return false;

  const permissionsToRequest = {
    origins: sitePatterns(site),
  };

  console.log(chrome.permissions);
  return chrome.permissions.contains(permissionsToRequest);
}

export async function requestSitePermission(site: string) {
  if (!site) return;
  const permissionsToRequest = {
    origins: sitePatterns(site),
  };
  if (await checkSitePermission(site)) {
    console.log(`Permission already granted for '${site}'`);
    return;
  }

  const granted = await chrome.permissions.request(permissionsToRequest);
  if (!granted) throw new Error("Permission denied by user");
}

export async function loadStorageData() {
  try {
    const { trackedSites, dailyTime, overlayConfig, userRules } =
      (await getStorageData([
        "dailyTime",
        "overlayConfig",
        "trackedSites",
        "userRules",
      ])) as StorageData;

    return {
      dailyTime: dailyTime?.total ?? 0,
      overlayHidden: overlayConfig?.isHidden ?? false,
      thresholds: {
        warn: overlayConfig?.thresholdWarn ?? null,
        danger: overlayConfig?.thresholdDanger ?? null,
      },
      trackedSites: trackedSites ?? [],
      userRules: userRules ?? [],
    };
  } catch (error) {
    console.error("Failed to load data:", error);
    throw error;
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
    url: chrome.runtime.getURL("src/analytics/index.html"),
  });
}

export async function sendAddSiteMessage(site: string) {
  const response = await chrome.runtime.sendMessage({
    type: "ADD_TRACKED_SITE",
    site: site,
  } satisfies Message);
  if (response?.success) {
    console.log(`Added site: ${site}`);
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
    console.log(`Removed site: ${site}`);
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
