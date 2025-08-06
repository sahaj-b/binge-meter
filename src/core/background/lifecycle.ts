import {
  defaultStorageData,
  getStorageData,
  setStorageData,
} from "@/shared/storage";
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

    await setupDailyResetAlarm();

    await syncRegisteredScriptsForAllowedSites();
  });

  chrome.runtime.onStartup.addListener(async () => {
    const { dailyTime, resetTime, analyticsData } = await getStorageData([
      "dailyTime",
      "resetTime",
      "analyticsData",
    ]);

    // the exact timestamp of the last successful reset
    const lastResetDate = new Date(dailyTime.date);
    lastResetDate.setHours(resetTime.hours, resetTime.minutes, 0, 0);

    // when the NEXT reset was supposed to happen (24h after the last one)
    const nextScheduledReset = new Date(
      lastResetDate.getTime() + 24 * 60 * 60 * 1000,
    );

    const now = new Date();

    // ONLY reset if we are past the time the last cycle should have ended.
    if (now >= nextScheduledReset) {
      console.log("Missed daily reset detected. Resetting now.");
      const today = now.toISOString().split("T")[0];
      const newAnalyticsData = { ...analyticsData, [today]: { total: 0 } };

      await updateActiveSession(null);
      await setStorageData({
        dailyTime: { total: 0, date: today },
        analyticsData: newAnalyticsData,
      });
    }
    await setupDailyResetAlarm();
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
      await updateActiveSession(null);
      await setStorageData({
        dailyTime: {
          total: 0,
          date: date,
        },
        analyticsData: analyticsData,
      });
    }
    if (alarm.name === "blockingLimitAlarm") {
      const { activeSession } = await getStorageData(["activeSession"]);
      if (activeSession)
        await chrome.tabs.sendMessage(activeSession.tabId, {
          type: "BLOCK_OVERLAY",
        });
      await updateActiveSession(null);
    }
  });
}

export async function setupDailyResetAlarm() {
  const { resetTime } = await getStorageData(["resetTime"]);

  await chrome.alarms.clear("dailyReset");

  await chrome.alarms.create("dailyReset", {
    when: getNextTime(resetTime.hours, resetTime.minutes),
    periodInMinutes: 24 * 60,
  });
}

function getNextTime(hour: number, minute = 0): number {
  const now = new Date();
  const nextTime = new Date();
  nextTime.setHours(hour, minute, 0, 0);
  if (nextTime <= now) {
    nextTime.setDate(nextTime.getDate() + 1);
  }
  return nextTime.getTime();
}
