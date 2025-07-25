import type { dailyTime, UserRules, OverlayConfig, StorageData } from "./types";

export const defaultOverlayConfig: OverlayConfig = {
  thresholdWarn: 10 * 1000,
  thresholdDanger: 20 * 1000,
  colors: { fg: "#ffffff", bg: "#0f0f0f80", borderColor: "#ffffff41" },
  warnColors: { fg: "#ffffff", bg: "#8e8e15cc", borderColor: "#ffffff41" },
  dangerColors: { fg: "#ffffff", bg: "#9b2308cc", borderColor: "#ffffff41" },
  defaultSize: { width: 150, height: 50 },
  positions: {},
  sizes: {},
  isHidden: false,
  blur: 10,
  borderRadius: 20,
};

export const defaultTrackedSites: string[] = [
  "youtube.com",
  "x.com",
  "reddit.com",
];

export const defaultDailyTime: dailyTime = {
  total: 0,
  date: new Date().toISOString().split("T")[0],
};

export const defaultUserRules: UserRules = {
  urls: {},
  productiveYtChannels: [],
  productiveSubreddits: [],
};

export const defaultStorageData: StorageData = {
  dailyTime: defaultDailyTime,
  overlayConfig: defaultOverlayConfig,
  trackedSites: defaultTrackedSites,
  userRules: defaultUserRules,
  aiCache: [],
  aiEnabled: false,
  aiDisabledSites: [],
  activeSession: null,
  geminiApiKey: "",
  customPrompt: "",
};

export async function getStorageData<K extends keyof StorageData>(
  keys: K[],
): Promise<Pick<StorageData, K>> {
  const data = await chrome.storage.local.get(keys);

  return keys.reduce(
    (acc, key) => {
      acc[key] = data[key] ?? defaultStorageData[key];
      return acc;
    },
    {} as Pick<StorageData, K>,
  );
}

export async function setStorageData(
  data: Partial<StorageData>,
): Promise<void> {
  await chrome.storage.local.set(data);
  console.log("SAVED", data);
}
