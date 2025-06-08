import { updateActiveSession } from "./session";
import {
  registerContentScript,
  injectContentScriptToAllTabs,
} from "./scripting";

export function setupListeners() {
  // this chrome API fuckin SUCKS. can't handle focus changes outside the browser instance (for some WMs)
  // the OVERLAY_FOCUS/OVERLAY_BLUR messages will handle that for now
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
  chrome.runtime.onMessage.addListener(async (message: any, sender: any) => {
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
        import("./scripting").then(({ revalidateCacheForAllTabs }) => {
          revalidateCacheForAllTabs();
        });
        break;
      case "CONTENT_SCRIPT_READY":
        if (!sender.tab?.id) return;
        console.log(`CONTENT_SCRIPT_READY received from tab: ${sender.tab.id}`);
        const [activeTab] = await chrome.tabs.query({ active: true });
        if (activeTab?.id === sender.tab.id) {
          updateActiveSession(sender.tab.id);
          console.log(`Starting session for active tab: ${sender.tab.id}`);
        }
        break;
      case "SITE_ADDED":
        const site = message.site;
        await registerContentScript(site);
        await injectContentScriptToAllTabs(site);
        break;
      case "SITE_REMOVED":
        await chrome.scripting.unregisterContentScripts({
          ids: [message.site],
        });
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
    import("./session").then(({ updateActiveSession }) => {
      updateActiveSession(activeInfo.tabId);
    });
  });
}
