import {
  defaultStorageData,
  getStorageData,
  setStorageData,
} from "@/shared/store";
import { syncRegisteredScriptsForAllowedSites } from "./scripting";
import { updateActiveSession } from "./session";

export function setupLifecycleEvents() {
  chrome.runtime.onInstalled.addListener(async () => {
    const { trackedSites, dailyTime, overlayConfig } = await getStorageData([
      "trackedSites",
      "dailyTime",
      "overlayConfig",
    ]);

    await setStorageData({
      trackedSites: trackedSites ?? defaultStorageData.trackedSites,
      dailyTime: dailyTime ?? {
        total: 0,
        date: new Date().toISOString().split("T")[0],
      },
      overlayConfig: {
        ...defaultStorageData.overlayConfig,
        ...(overlayConfig || {}),
      },
      activeSession: null,
    });

    // reset daily time at 3 AM
    await chrome.alarms.create("dailyReset", {
      when: getNext3AM(),
      periodInMinutes: 24 * 60,
    });

    await syncRegisteredScriptsForAllowedSites();
  });

  // not needed, coz content script is registered on install
  // chrome.runtime.onStartup.addListener(() => {
  //   injectIntoAllTrackedTabs();
  // });

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "dailyReset") {
      const { analyticsData } = await getStorageData(["analyticsData"]);
      const date = new Date().toISOString().split("T")[0];
      analyticsData[date] = { total: 0 };

      // stop any running session before resetting time
      updateActiveSession(null).then(() => {
        setStorageData({
          dailyTime: {
            total: 0,
            date: date,
          },
          analyticsData: analyticsData,
        });
      });
    }
  });
}

function getNext3AM(): number {
  const now = new Date();
  const next3AM = new Date();
  next3AM.setHours(3, 0, 0, 0);
  if (next3AM <= now) {
    next3AM.setDate(next3AM.getDate() + 1);
  }
  return next3AM.getTime();
}
