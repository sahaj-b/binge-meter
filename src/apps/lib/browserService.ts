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
    const { trackedSites, dailyTime, overlayConfig, productiveRules } =
      (await getStorageData([
        "dailyTime",
        "overlayConfig",
        "trackedSites",
        "productiveRules",
      ])) as StorageData;

    return {
      dailyTime: dailyTime?.total ?? 0,
      overlayHidden: overlayConfig?.isHidden ?? false,
      thresholds: {
        warn: overlayConfig?.thresholdWarn ?? null,
        danger: overlayConfig?.thresholdDanger ?? null,
      },
      trackedSites: trackedSites ?? [],
      productiveRules: productiveRules ?? [],
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

export async function markURLAs(url: string, markDistracting: boolean) {
  const response = await chrome.runtime.sendMessage({
    type: markDistracting ? "REMOVE_PRODUCTIVE_RULE" : "ADD_PRODUCTIVE_RULE",
    rule: { url },
  } satisfies Message);
  if (!response?.success)
    throw new Error(response?.error ?? "Unknown error occurred");
}

export async function markChannelAs(channel: string, markDistracting: boolean) {
  const response = await chrome.runtime.sendMessage({
    type: markDistracting ? "REMOVE_PRODUCTIVE_RULE" : "ADD_PRODUCTIVE_RULE",
    rule: { ytChannel: channel },
  } satisfies Message);
  if (!response?.success)
    throw new Error(response?.error ?? "Unknown error occurred");
}

export async function markSubredditAs(
  subreddit: string,
  markDistracting: boolean,
) {
  const response = await chrome.runtime.sendMessage({
    type: markDistracting ? "REMOVE_PRODUCTIVE_RULE" : "ADD_PRODUCTIVE_RULE",
    rule: { subreddit },
  } satisfies Message);
  if (!response?.success)
    throw new Error(response?.error ?? "Unknown error occurred");
}
