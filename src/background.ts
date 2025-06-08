// @ts-ignore
import contentScriptPath from "./content?script";
import { defaultOverlayConfig } from "./shared";

// async mutex type shit
let sessionLock = Promise.resolve();

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
    updateActiveSession(null).then(() => {
      chrome.storage.local.set({
        dailyTime: { total: 0, date: new Date().toISOString().split("T")[0] },
      });
    });
  }
});

// START_TICKING coz registered content script won't start automatically
// NOT NEEDED COZ its handled when CONTENT_SCRIPT_READY msg is sent
// chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
//   if (changeInfo.status === "complete" && tab.url) {
//     const { trackedSites } = await chrome.storage.local.get("trackedSites");
//     if (trackedSites.some((site: string) => tab.url!.includes(site))) {
//       console.log("starting session for tab", tabId);
//       const [activeTab] = await chrome.tabs.query({ active: true });
//       if (activeTab?.id == tabId) updateActiveSession(tabId);
//     }
//   }
// });

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
// content script sends OVERLAY_BLUR/OVERLAY_FOCUS msg
// background script starts/stops sessions based on that
// then sends back START_TICKING/STOP_TICKING msg to content script
// and yes this creates async mess with race conditions, so i created async mutex in handleFocusChange
chrome.runtime.onMessage.addListener(async (message, sender) => {
  switch (message.type) {
    case "OVERLAY_FOCUS":
      if (!sender.tab?.id) return;
      console.log(`FOCUS received from tab: ${sender.tab.id}`);
      await updateActiveSession(sender.tab.id);
      break;

    case "OVERLAY_BLUR":
      if (!sender.tab?.id) return;
      console.log(`BLUR received from tab: ${sender.tab.id}`);
      await updateActiveSession(null);
      break;

    case "TOGGLE_ALL_OVERLAYS":
      console.log(`TOGGLE_ALL_OVERLAYS received`);
      const { overlayConfig, dailyTime, activeSession, trackedSites } =
        await chrome.storage.local.get([
          "dailyTime",
          "overlayConfig",
          "activeSession",
          "trackedSites",
        ]);
      const newConfig = {
        ...overlayConfig,
        isHidden: !overlayConfig.isHidden,
      };
      await chrome.storage.local.set({ overlayConfig: newConfig });

      // send message to all tabs to toggle overlay visibility
      console.log("Sending TOGGLE_OVERLAY to all tabs");
      let liveTime = dailyTime.total;
      if (activeSession) {
        liveTime += Date.now() - activeSession.startTime;
      }
      const allTabs = await chrome.tabs.query({});
      for (const tab of allTabs) {
        if (
          tab.id &&
          trackedSites.some((site: string) => tab.url!.includes(site))
        ) {
          await chrome.tabs
            .sendMessage(tab.id, {
              type: "UPDATE_FRAME",
              time: liveTime,
            })
            .catch((e) => {
              console.error("Error sending UPDATE_FRAME:", e);
            });
          console.log(`Sent UPDATE_FRAME to tab: ${tab.id}`);
        }
      }
      break;

    case "REVALIDATE_ALL_OVERLAYS":
      console.log(
        `REVALIDATE_ALL_OVERLAYS received from tab: ${sender.tab?.id}`,
      );
      revalidateCacheForAllTabs();
      break;

    case "CONTENT_SCRIPT_READY":
      if (!sender.tab?.id) return;
      console.log(`CONTENT_SCRIPT_READY received from tab: ${sender.tab.id}`);

      // start session if the tab is active (for newly opened tracked tabs)
      const [activeTab] = await chrome.tabs.query({ active: true });
      if (activeTab?.id === sender.tab.id) {
        updateActiveSession(sender.tab.id);
        console.log(`Starting session for active tab: ${sender.tab.id}`);
      }
      break;
    case "SITE_ADDED":
      // register and ALSO inject content script into all currently open tabs for that site
      const site = message.site;
      await registerContentScript(site);
      await injectContentScriptToAllTabs(site);

      break;
    case "SITE_REMOVED":
      // unregister the rule. The script will be gone on next reload
      await chrome.scripting.unregisterContentScripts({ ids: [message.site] });
      break;
    case "DEBUG":
      console.log(sender.tab?.id, message.message);
      break;

    default:
      console.warn(`Unknown message type received: ${message.type}`);
      break;
  }
});

// not needed, but good for instantly start session without waiting for OVERLAY_FOCUS msg
chrome.tabs.onActivated.addListener((activeInfo) => {
  updateActiveSession(activeInfo.tabId);
});

function updateActiveSession(activeTabId: number | null) {
  const taskPromise = sessionLock
    .then(async () => {
      const { dailyTime, trackedSites, activeSession } =
        await chrome.storage.local.get([
          "dailyTime",
          "trackedSites",
          "activeSession",
        ]);
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
            await sendStartTicking(activeTabId, newTotal, newSession.startTime);
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

  sessionLock = taskPromise;
  return taskPromise;
}

async function sendStartTicking(
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

async function syncRegisteredScripts() {
  const { trackedSites } = await chrome.storage.local.get("trackedSites");

  const registered = await chrome.scripting.getRegisteredContentScripts();
  const registeredIds = registered.map((s) => s.id);

  // if a site is in storage but not registered, register it AND inject into relevant tabs
  for (const site of trackedSites) {
    if (!registeredIds.includes(site)) {
      await registerContentScript(site);
      await injectContentScriptToAllTabs(site);
    }
  }

  // if a script is registered but no longer in storage, unregister it.
  for (const id of registeredIds) {
    if (!trackedSites.includes(id)) {
      await chrome.scripting.unregisterContentScripts({ ids: [id] });
    }
  }
}

async function registerContentScript(site: string) {
  await chrome.scripting.registerContentScripts([
    {
      id: site,
      matches: [`*://*.${site}/*`, `*://${site}/*`],
      js: [contentScriptPath],
      runAt: "document_end",
      allFrames: false,
    },
  ]);
  console.log("Registered content script for", site);
}

async function injectContentScriptToAllTabs(site: string) {
  const tabs = await chrome.tabs.query({
    url: [`*://*.${site}/*`, `*://${site}/*`],
  });
  tabs.forEach((tab) => {
    injectContentScript(tab.id);
  });
}

async function injectContentScript(tabId?: number) {
  if (!tabId) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [contentScriptPath],
    });
    console.log("injected content script in", tabId);
  } catch (e) {
    console.log("Couldn't inject content script:", e);
    // can happen on special pages like chrome://extensions, does anyone care?
  }

  // start session if the tab is active (for newly opened tracked tabs)
  // NOT NEEDED COZ its handled when CONTENT_SCRIPT_READY msg is sent
  // const [activeTab] = await chrome.tabs.query({ active: true });
  // if (activeTab?.id == tabId) updateActiveSession(tabId);
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
