import { getStorageData, setStorageData } from "@/shared/storage";

let sessionLock = Promise.resolve();

export function updateActiveSession(activeTabId: number | null) {
  const taskPromise = sessionLock
    .then(async () => {
      const { dailyTime, trackedSites, activeSession, analyticsData } =
        await getStorageData([
          "dailyTime",
          "trackedSites",
          "activeSession",
          "analyticsData",
        ]);
      let newTotal = dailyTime.total;
      if (activeSession?.startTime) {
        const elapsed = Date.now() - activeSession.startTime;
        newTotal += elapsed;

        const date = dailyTime.date;
        if (!analyticsData[date]) {
          analyticsData[date] = { total: 0 };
        }
        analyticsData[date].total = (analyticsData[date].total ?? 0) + elapsed;

        try {
          const tab = await chrome.tabs.get(activeSession.tabId);
          if (tab.url) {
            const url = new URL(tab.url);
            const hostname = url.hostname.startsWith("www.")
              ? url.hostname.slice(4)
              : url.hostname;

            analyticsData[date][hostname] =
              (analyticsData[date][hostname] ?? 0) + elapsed;
          }
        } catch (error) {
          // tab got closed bruh. time is still added to daily total, but can't attribute it to a specific site, acceptable loss tbh
          console.error(
            `Failed to get tab info for tabId ${activeSession.tabId}:`,
            error,
          );
        }
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
              analyticsData,
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
        analyticsData,
      });
    })
    .catch((err) => {
      console.error("Error in the PROMISE CHAIN:", err);
    });
  sessionLock = taskPromise;
  return taskPromise;
}
