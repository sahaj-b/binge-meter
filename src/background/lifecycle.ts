// @ts-ignore
import contentScriptPath from "./content?script";
import { defaultOverlayConfig } from "../shared";
import { syncRegisteredScripts } from "./scripting";

export function setupLifecycleEvents() {
  chrome.runtime.onInstalled.addListener(async () => {
    const { trackedSites, dailyTime, overlayConfig } =
      await chrome.storage.local.get([
        "trackedSites",
        "dailyTime",
        "overlayConfig",
      ]);

    await chrome.storage.local.set({
      trackedSites: trackedSites ?? [
        "reddit.com",
        "linkedin.com",
        "youtube.com",
        "x.com",
        "hello.com",
      ],
      dailyTime: dailyTime ?? {
        total: 0,
        date: new Date().toISOString().split("T")[0],
      },
      overlayConfig: {
        ...defaultOverlayConfig,
        ...(overlayConfig || {}),
      },
      activeSession: null,
    });

    // reset daily time at 3 AM
    await chrome.alarms.create("dailyReset", {
      when: getNext3AM(),
      periodInMinutes: 24 * 60,
    });

    await syncRegisteredScripts();
  });

  // not needed, coz content script is registered on install
  // chrome.runtime.onStartup.addListener(() => {
  //   injectIntoAllTrackedTabs();
  // });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "dailyReset") {
      // stop any running session before resetting time
      import("./session").then(({ updateActiveSession }) => {
        updateActiveSession(null).then(() => {
          chrome.storage.local.set({
            dailyTime: { total: 0, date: new Date().toISOString().split("T")[0] },
          });
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
