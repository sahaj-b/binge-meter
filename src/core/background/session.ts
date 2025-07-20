import { getStorageData, setStorageData } from "@/shared/store";

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
      if (activeSession?.startTime) {
        const elapsed = Date.now() - activeSession.startTime;
        newTotal += elapsed;
        await chrome.tabs
          .sendMessage(activeSession.tabId, {
            type: "STOP_TICKING",
          })
          .catch((err) => {
            console.error(
              "Error while sending STOP_TICKING to",
              activeTabId,
              err,
            );
          });
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
            await chrome.tabs
              .sendMessage(activeTabId, {
                type: "START_TICKING",
                startingDuration: newTotal,
                startTime: newSession.startTime,
              })
              .catch((err) => {
                console.error(
                  "Error while sending START_TICKING to",
                  activeTabId,
                  err,
                );
                setStorageData({
                  dailyTime: { ...dailyTime, total: newTotal },
                  activeSession: null,
                });
              });
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
      console.error("Error in the PROMISE CHAIN:", err);
    });
  sessionLock = taskPromise;
  return taskPromise;
}
