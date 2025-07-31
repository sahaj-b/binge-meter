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
      await chrome.alarms.clear("blockingLimitAlarm");

      // --- ENDING the current session ---
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
            const hostname = new URL(tab.url).hostname.replace(/^www\./, "");
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

        // stop old tab's ticker
        await chrome.tabs
          .sendMessage(activeSession.tabId, { type: "STOP_TICKING" })
          .catch((err) => {
            console.error(
              `Error sending STOP_TICKING to tab ${activeSession.tabId}:`,
              err,
            );
          });
      }

      // --- STARTING a new session ---
      if (activeTabId !== null) {
        try {
          const tab = await chrome.tabs.get(activeTabId);
          if (tab.url && trackedSites.some((site) => tab.url!.includes(site))) {
            const timeLimitReached = await handleBlockingChecks(
              activeTabId,
              tab.url!,
            );

            if (timeLimitReached) {
              await setStorageData({
                dailyTime: { ...dailyTime, total: newTotal },
                activeSession: null,
                analyticsData,
              });
              // dont start new session if time limit is reached
              return;
            }

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
                  `Error sending START_TICKING to tab ${activeTabId}:`,
                  err,
                );

                setStorageData({
                  dailyTime: { ...dailyTime, total: newTotal },
                  activeSession: null,
                  analyticsData,
                });
              });

            return;
          }
        } catch (e) {
          console.error(`Failed to start session for tab ${activeTabId}:`, e);
        }
      }

      // --- NO NEW SESSION ---
      // (stopping a session without starting a new one)
      await setStorageData({
        dailyTime: { ...dailyTime, total: newTotal },
        activeSession: null,
        analyticsData,
      });
    })
    .catch((err) => {
      console.error("Error in updateActiveSession promise chain:", err);
    });

  sessionLock = taskPromise;
  return taskPromise;
}

export async function handleBlockingChecks(tabId: number, tabUrl: string) {
  const { blockingSettings, dailyTime } = await getStorageData([
    "blockingSettings",
    "dailyTime",
  ]);

  await chrome.alarms.clear("blockingLimitAlarm");
  if (tabUrl.endsWith("/")) tabUrl = tabUrl.slice(0, -1);
  const isException = blockingSettings.urlExceptions.some(
    (exception) => tabUrl === exception || tabUrl + "/" === exception,
  );

  if (blockingSettings.enabled && !isException) {
    const timeLimit = blockingSettings.timeLimit;
    const timeSoFar = dailyTime.total;
    const timeLimitExceeded =
      blockingSettings.gracePeriodUntil > Date.now()
        ? Date.now() >= blockingSettings.gracePeriodUntil
        : timeSoFar >= timeLimit;

    if (timeLimit > 0 && !timeLimitExceeded) {
      // setting a time bomb for the blocking
      const timeRemaining = timeLimit - timeSoFar;
      chrome.alarms.create("blockingLimitAlarm", {
        when:
          blockingSettings.gracePeriodUntil > Date.now()
            ? blockingSettings.gracePeriodUntil
            : Date.now() + timeRemaining,
      });
      console.log(
        `Blocking alarm set for tab ${tabId} in ${blockingSettings.gracePeriodUntil > Date.now() ? "grace period" : "time limit"} mode.`,
      );
      console.log(
        "Grace Period Until:",
        new Date(blockingSettings.gracePeriodUntil).toLocaleString(),
      );
    } else if (timeLimit > 0 && timeLimitExceeded) {
      console.log(`Time limit exceeded, blocking tab ${tabId} immediately.`);
      chrome.tabs.sendMessage(tabId, { type: "BLOCK_OVERLAY" });
      return true;
    }
  }
  return false;
}
