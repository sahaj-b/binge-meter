import { getStorageData, setStorageData } from "@/core/store";

let sessionLock = Promise.resolve();

export function updateActiveSession(activeTabId: number | null) {
  const taskPromise = sessionLock
    .then(async () => {
      const { dailyTime, trackedSites, activeSession } = await getStorageData([
        "dailyTime",
        "trackedSites",
        "activeSession",
      ]);
      let newTotal = dailyTime.total;
      if (activeSession && activeSession.startTime) {
        const elapsed = Date.now() - activeSession.startTime;
        newTotal += elapsed;
        try {
          await chrome.tabs.sendMessage(activeSession.tabId, {
            type: "STOP_TICKING",
          });
        } catch (e) {}
      }
      if (activeTabId !== null) {
        try {
          const tab = await chrome.tabs.get(activeTabId);
          if (
            tab.url &&
            trackedSites.some((site: string) => tab.url!.includes(site))
          ) {
            const newSession = { tabId: activeTabId, startTime: Date.now() };
            await setStorageData({
              dailyTime: { ...dailyTime, total: newTotal },
              activeSession: newSession,
            });
            await sendStartTicking(activeTabId, newTotal, newSession.startTime);
            return;
          }
        } catch (e) {}
      }
      await setStorageData({
        dailyTime: { ...dailyTime, total: newTotal },
        activeSession: null,
      });
    })
    .catch((err) => {
      console.error("SHIT, error in the promise chain:", err);
    });
  sessionLock = taskPromise;
  return taskPromise;
}

export async function sendStartTicking(
  tabid: number,
  startDuration: number,
  startTime: number,
) {
  await chrome.tabs.sendMessage(tabid, {
    type: "START_TICKING",
    startingDuration: startDuration,
    startTime: startTime,
  });
}
