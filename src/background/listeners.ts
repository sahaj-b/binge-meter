import { updateActiveSession } from "./session";
import {
  addSite,
  removeSite,
  revalidateCacheForAllTabs,
  toggleOverlays,
} from "./scripting";

export function setupListeners() {
  // this chrome API fuckin SUCKS. can't handle focus changes outside the browser instance (for some WMs)
  // the TAB_FOCUS/TAB_BLUR messages will handle that for now
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
  // content script sends TAB_BLUR/TAB_FOCUS msg
  // background script starts/stops sessions based on that
  // then sends back START_TICKING/STOP_TICKING msg to content script
  // and yes this creates async mess with race conditions, so i created async mutex in updateActiveSession
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case "TAB_FOCUS":
        if (!sender.tab?.id) return;
        console.log(`FOCUS received from tab: ${sender.tab.id}`);
        updateActiveSession(sender.tab.id);
        break;
      case "TAB_BLUR":
        if (!sender.tab?.id) return;
        console.log(`BLUR received from tab: ${sender.tab.id}`);
        updateActiveSession(null);
        break;
      case "TOGGLE_ALL_OVERLAYS":
        console.log(`TOGGLE_ALL_OVERLAYS received`);
        toggleOverlays();
        break;
      case "REVALIDATE_ALL_OVERLAYS":
        console.log(
          `REVALIDATE_ALL_OVERLAYS received from tab: ${sender.tab?.id}`,
        );
        revalidateCacheForAllTabs();
        break;
      case "CONTENT_SCRIPT_READY":
        console.log("yo");
        if (!sender.tab?.id) return;
        console.log(
          `CONTENT_SCRIPT_READY received from tab: ${sender.tab?.id}`,
        );
        chrome.tabs.query({ active: true }).then(([activeTab]) => {
          if (!sender.tab?.id) return; // again. to stop ts from crying
          if (activeTab?.id === sender.tab.id) {
            updateActiveSession(sender.tab.id);
            console.log(`Starting session for active tab: ${sender.tab.id}`);
          }
        });
        break;
      case "SITE_ADDED":
        console.log(`SITE_ADDED received for site: ${message.site}`);
        addSite(message.site)
          .then(() => {
            sendResponse({ success: true });
          })
          .catch((error) => {
            sendResponse({ success: false, error: error.message });
          });
        return true; // indicates that response will be sent

      case "SITE_REMOVED":
        console.log(`SITE_REMOVED received for site: ${message.site}`);
        removeSite(message.site)
          .then(() => {
            sendResponse({ success: true });
          })
          .catch((error) => {
            sendResponse({ success: false, error: error.message });
          });
        return true;

      case "DEBUG":
        console.log(sender.tab?.id, message.message);
        break;

      default:
        console.warn(`Unknown message type received: ${message.type}`);
        break;
    }
  });

  // not needed, but good for instantly start session without waiting for TAB_FOCUS msg
  chrome.tabs.onActivated.addListener((activeInfo) => {
    updateActiveSession(activeInfo.tabId);
  });
}
