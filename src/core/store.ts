export type StorageData = {
  dailyTime: dailyTime;
  overlayConfig: OverlayConfig;
  trackedSites: string[];
  activeSession: activeSession;
};

export type dailyTime = {
  total: number; //ms
  date: string;
};

export type activeSession = {
  tabId: number;
  startTime: number;
} | null;

export type OverlayConfig = {
  thresholdWarn: number;
  thresholdDanger: number;
  // fg, bg, border
  colors: { fg: string; bg: string; borderColor: string };
  warnColors: { fg: string; bg: string; borderColor: string };
  dangerColors: { fg: string; bg: string; borderColor: string };
  defaultSize: { width: number; height: number };
  positions: Record<string, { left: string; top: string }>;
  sizes: Record<string, { width: number; height: number }>;
  isHidden: boolean;
  blur: number;
  borderRadius: number;
};

const defaultOverlayConfig: OverlayConfig = {
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

export const defaultStorageData: StorageData = {
  dailyTime: defaultDailyTime,
  overlayConfig: defaultOverlayConfig,
  trackedSites: defaultTrackedSites,
  activeSession: null,
};

export async function getStorageData<K extends keyof StorageData>(
  keys: K[],
): Promise<Pick<StorageData, K>> {
  console.log("LOAD STORAGE DATA", keys);
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
  console.log("SET STORAGE DATA", data);
  await chrome.storage.local.set(data);
}

// I know this is not the best place for defining this
// sorry T-T
export function sitePatterns(site: string): string[] {
  return [`*://${site}/*`, `*://www.${site}/*`];
}
