import { debugLog } from "@/shared/logger";
import { getStorageData, setStorageData } from "@/shared/storage";
import { matchUrl } from "@/shared/utils";

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
        if (!analyticsData[date]) analyticsData[date] = { total: 0 };

        const oldTotal = analyticsData[date].total;
        analyticsData[date].total = newTotal;

        debugLog(
          `SESSION END: elapsed=${Math.round(elapsed / 1000)}s, oldTotal=${Math.round(oldTotal / 60000)}m, newTotal=${Math.round(newTotal / 60000)}m, date=${date}`,
        );

        // attribute time to stored hostname first, then fallback to tab fetch, then unknown
        let hostname = activeSession.hostname;
        let attributionMethod = "stored";

        if (!hostname) {
          try {
            const tab = await chrome.tabs.get(activeSession.tabId);
            if (tab.url) {
              hostname = new URL(tab.url).hostname.replace(/^www\./, "");
              attributionMethod = "fetched";
            }
          } catch (error) {
            debugLog(
              `Failed to get tab info for tabId ${activeSession.tabId}:`,
              error,
            );
          }
        }

        if (hostname) {
          const oldSiteTime = analyticsData[date][hostname] ?? 0;
          analyticsData[date][hostname] = oldSiteTime + elapsed;
          debugLog(
            `SITE TIME UPDATE (${attributionMethod}): ${hostname} - oldTime=${Math.round(oldSiteTime / 60000)}m, elapsed=${Math.round(elapsed / 1000)}s, newTime=${Math.round(analyticsData[date][hostname] / 60000)}m`,
          );
        } else {
          const unknownTime = analyticsData[date].unknown ?? 0;
          analyticsData[date].unknown = unknownTime + elapsed;
          debugLog(
            `UNKNOWN TIME: elapsed=${Math.round(elapsed / 1000)}s added to unknown category, total unknown=${Math.round(analyticsData[date].unknown / 60000)}m`,
          );
        }

        // stop old tab's ticker
        await chrome.tabs
          .sendMessage(activeSession.tabId, { type: "STOP_TICKING" })
          .catch((err) => {
            console.warn(
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

            const newSession = {
              tabId: activeTabId,
              startTime: Date.now(),
              hostname: new URL(tab.url).hostname.replace(/^www\./, ""),
            };
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
  const isException = blockingSettings.urlExceptions.some((pattern) =>
    matchUrl(tabUrl, pattern),
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
      debugLog(
        `Blocking alarm set for tab ${tabId} in ${blockingSettings.gracePeriodUntil > Date.now() ? "grace period" : "time limit"} mode.`,
      );
    } else if (timeLimit > 0 && timeLimitExceeded) {
      debugLog(`Time limit exceeded, blocking tab ${tabId} immediately.`);
      chrome.tabs.sendMessage(tabId, { type: "BLOCK_OVERLAY" });
      return true;
    }
  }
  return false;
}
