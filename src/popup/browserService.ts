import { getStorageData, type StorageData } from "@/store";

export async function checkSitePermission(site: string): Promise<boolean> {
  if (!site) {
    return false;
  }
  const permissionsToRequest = {
    origins: [`*://${site}/*`],
  };
  return chrome.permissions.contains(permissionsToRequest);
}

export async function requestSitePermission(site: string): Promise<boolean> {
  if (!site) return false;
  const permissionsToRequest = {
    origins: [`*://${site}/*`],
  };

  try {
    const granted = await chrome.permissions.request(permissionsToRequest);
    return granted;
  } catch (error) {
    console.error(
      `Error during chrome.permissions.request for ${site}:`,
      error,
    );
    return false;
  }
}

export async function loadStorageData() {
  try {
    const { trackedSites, dailyTime, overlayConfig } = (await getStorageData([
      "dailyTime",
      "overlayConfig",
      "trackedSites",
    ])) as StorageData;

    return {
      dailyTime: dailyTime?.total ?? 0,
      overlayHidden: overlayConfig?.isHidden ?? false,
      thresholds: {
        warn: overlayConfig?.thresholdWarn ?? null,
        danger: overlayConfig?.thresholdDanger ?? null,
      },
      trackedSites: trackedSites ?? [],
    };
  } catch (error) {
    console.error("Failed to load data:", error);
    throw error;
  }
}

export async function getCurrentTabSite() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab.url) {
      const url = new URL(tab.url);
      return url.hostname;
    }
    return "";
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

export async function toggleSiteTracking(site: string, isTracked: boolean) {
  const messageType = isTracked ? "SITE_REMOVED" : "SITE_ADDED";
  const response = await chrome.runtime.sendMessage({
    type: messageType,
    site: site,
  });
  if (response?.success) {
    console.log(`${isTracked ? "Removed" : "Added"} site: ${site}`);
  } else {
    throw new Error(response?.error ?? "Unknown error occurred");
  }
}
