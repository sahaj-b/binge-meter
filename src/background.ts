// async mutex type shit
let focusLock = Promise.resolve();

chrome.runtime.onInstalled.addListener(async () => {
  const { trackedSites, dailyTime, overlayConfig } =
    await chrome.storage.local.get([
      "trackedSites",
      "dailyTime",
      "activeSession",
      "overlayConfig",
    ]);
  await chrome.storage.local.set({
    trackedSites: trackedSites ?? ["reddit.com", "linkedin.com", "youtube.com"],
    dailyTime: dailyTime ?? {
      total: 0,
      date: new Date().toISOString().split("T")[0],
    },
    overlayConfig: overlayConfig ?? { visible: true, positions: {} },
    activeSession: null,
  });

  // reset daily time at 3 AM
  await chrome.alarms.create("dailyReset", {
    when: getNext3AM(),
    periodInMinutes: 24 * 60,
  });

  // coz onStartup doesn't run after install. Thanks Chrome
  injectIntoAllTrackedTabs();
});

chrome.runtime.onStartup.addListener(() => {
  injectIntoAllTrackedTabs();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "dailyReset") {
    // stop any running session before resetting time
    updateActiveSession(null).then(() => {
      chrome.storage.local.set({
        dailyTime: { total: 0, date: new Date().toISOString().split("T")[0] },
      });
    });
  }
});

// inject overlay on any tab update
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const { trackedSites } = await chrome.storage.local.get("trackedSites");
    if (trackedSites.some((site: string) => tab.url!.includes(site))) {
      injectContentScript(tabId);
    }
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  updateActiveSession(activeInfo.tabId);
});

// this chrome API fuckin SUCKS. can't handle focus changes outside the browser instance (for some WMs)
// chrome.windows.onFocusChanged.addListener(async (windowId) => {
//     if (windowId === chrome.windows.WINDOW_ID_NONE) {
//         handleFocusChange(null);
//     } else {
//         try {
//             const [activeTab] = await chrome.tabs.query({ active: true, windowId });
//             handleFocusChange(activeTab?.id ?? null);
//         } catch (e) {
//             handleFocusChange(null);
//         }
//     }
// });

// so flow is like this:
// content script sends TAB_BLURRED/TAB_FOCUSED msg
// background script starts/stops sessions based on that
// then sends back START_TICKING/STOP_TICKING msg to content script
// and yes this creates async mess with race conditions, so i created async mutex in handleFocusChange
chrome.runtime.onMessage.addListener((message, sender) => {
  if (!sender.tab?.id) return;

  switch (message.type) {
    case "OVERLAY_FOCUS":
      console.log(`FOCUS received from tab: ${sender.tab.id}`);
      updateActiveSession(sender.tab.id);
      break;

    case "OVERLAY_BLUR":
      console.log(`BLUR received from tab: ${sender.tab.id}`);
      updateActiveSession(null);
      break;
    case "REVALIDATE_ALL_OVERLAYS":
      console.log(
        `REVALIDATE_ALL_OVERLAYS received from tab: ${sender.tab.id}`,
      );
      revalidateCacheForAllTabs();
      break;
    case "DEBUG":
      console.log(sender.tab.id, message.message);
      break;

    default:
      console.warn(`Unknown message type received: ${message.type}`);
      break;
  }
});

function updateActiveSession(activeTabId: number | null) {
  const taskPromise = focusLock
    .then(async () => {
      const data = await chrome.storage.local.get([
        "dailyTime",
        "trackedSites",
        "activeSession",
      ]);
      const { dailyTime, trackedSites, activeSession } = data;
      let newTotal = dailyTime.total;

      // ALWAYS stop the previous session and count its contribution
      if (activeSession && activeSession.startTime) {
        const elapsed = Date.now() - activeSession.startTime;
        newTotal += elapsed;
        try {
          await chrome.tabs.sendMessage(activeSession.tabId, {
            type: "STOP_TICKING",
          });
        } catch (e) {
          // tab might be closed, who cares
        }
      }

      // if the tab is trackable, start a new session.
      if (activeTabId !== null) {
        try {
          const tab = await chrome.tabs.get(activeTabId);
          if (
            tab.url &&
            trackedSites.some((site: string) => tab.url!.includes(site))
          ) {
            const newSession = { tabId: activeTabId, startTime: Date.now() };
            await chrome.storage.local.set({
              dailyTime: { ...dailyTime, total: newTotal },
              activeSession: newSession,
            });
            await chrome.tabs.sendMessage(activeTabId, {
              type: "START_TICKING",
              startingDuration: newTotal,
              startTime: newSession.startTime,
            });
            return;
          }
        } catch (e) {
          // Tab might have closed between event and .get(), but who fkin cares
        }
      }

      // iff no new session started, just save the final time and clear activeSession
      await chrome.storage.local.set({
        dailyTime: { ...dailyTime, total: newTotal },
        activeSession: null,
      });
    })
    .catch((err) => {
      console.error("SHIT, error in the promise chain:", err);
    });

  focusLock = taskPromise;
  return taskPromise;
}

async function revalidateCacheForAllTabs() {
  const { trackedSites } = await chrome.storage.local.get("trackedSites");
  if (!trackedSites || trackedSites.length === 0) return;

  const allTabs = await chrome.tabs.query({});
  for (const tab of allTabs) {
    if (
      tab.url &&
      tab.id &&
      trackedSites.some((site: string) => tab.url!.includes(site))
    ) {
      console.log("Sending REVALIDATE_CACHE to", tab.id);
      await chrome.tabs.sendMessage(tab.id, {
        type: "REVALIDATE_CACHE",
      });
    }
  }
}

async function injectContentScript(tabId: number) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
    console.log("injected content script in", tabId);
  } catch (e) {
    // can happen on special pages like chrome://extensions, does anyone care?
  }
  // start session if the tab is active (for newly opened tracked tabs)
  const [activeTab] = await chrome.tabs.query({ active: true });
  if (activeTab?.id == tabId) updateActiveSession(tabId);
}

async function injectIntoAllTrackedTabs() {
  const { trackedSites } = await chrome.storage.local.get("trackedSites");
  if (!trackedSites || trackedSites.length === 0) return;

  const allTabs = await chrome.tabs.query({});
  for (const tab of allTabs) {
    if (
      tab.id &&
      tab.url &&
      trackedSites.some((site: string) => tab.url!.includes(site))
    ) {
      injectContentScript(tab.id);
    }
  }
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
