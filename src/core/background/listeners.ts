import { updateActiveSession } from "./session";
import {
  addSite,
  removeSite,
  revalidateCacheForAllTabs,
  revalidateCacheForTab,
  toggleOverlays,
  markDistracting,
  markProductive,
  handleEvaluatePage,
} from "./messaging";

export function setupListeners() {
  // this chrome API fuckin SUCKS. can't handle focus changes outside the browser instance (for my WM)
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
        console.log("TOGGLE_ALL_OVERLAYS received");
        toggleOverlays();
        break;
      case "REVALIDATE_ALL_OVERLAYS":
        console.log(
          `REVALIDATE_ALL_OVERLAYS received from tab: ${sender.tab?.id}`,
        );
        revalidateCacheForAllTabs();
        break;
      case "REVALIDATE_CACHE_TAB":
        if (!sender.tab?.id) return;
        revalidateCacheForTab(sender.tab.id);
        break;
      case "EVALUATE_PAGE":
        if (!sender.tab?.id) return;
        handleEvaluatePage(sender.tab.id, message.metadata);
        break;
      case "ADD_SITE":
        addSite(message.site)
          .then(() => {
            sendResponse({ success: true });
          })
          .catch((error) => {
            sendResponse({ success: false, error: error.message });
          });
        return true; // indicates that A RESPONSE WILL BE SENT

      case "REMOVE_SITE":
        removeSite(message.site)
          .then(() => {
            sendResponse({ success: true });
          })
          .catch((error) => {
            sendResponse({ success: false, error: error.message });
          });
        return true;

      case "MARK_DISTRACTING":
        markDistracting(message.site)
          .then(() => {
            sendResponse({ success: true });
          })
          .catch((error) => {
            sendResponse({ success: false, error: error.message });
          });
        return true;

      case "MARK_PRODUCTIVE":
        markProductive(message.site)
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
