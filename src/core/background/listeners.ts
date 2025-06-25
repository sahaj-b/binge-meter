import { updateActiveSession } from "./session";
import {
  addSite,
  removeSite,
  revalidateCacheForAllTabs,
  revalidateCacheForTab,
  toggleOverlays,
  handleEvaluatePage,
  addProductiveRule,
  removeProductiveRule,
} from "./messaging";

export function setupListeners() {
  // this chrome API fuckin SUCKS. can't handle focus changes outside the browser instance (for my WM atleast)
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
  // and yes this creates async mess with race conditions. async mutex in updateActiveSession saves the day
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case "TAB_FOCUS":
        if (!sender.tab?.id) return;
        updateActiveSession(sender.tab.id);
        break;
      case "TAB_BLUR":
        if (!sender.tab?.id) return;
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
      case "URL_ONLY_EVALUATE":
        if (!sender.tab?.id || !message.url) return;
        chrome.runtime.sendMessage({
          type: "DEBUG",
          message: "URL_ONLY_EVALUATE received",
        });
        // TODO: pass no-AI parameter to this
        handleEvaluatePage(sender.tab.id, { url: message.url });
        break;
      case "ADD_TRACKED_SITE":
        addSite(message.site)
          .then(() => {
            sendResponse({ success: true });
          })
          .catch((error) => {
            sendResponse({ success: false, error: error.message });
          });
        return true; // indicates that A RESPONSE WILL BE SENT

      case "REMOVE_TRACKED_SITE":
        removeSite(message.site)
          .then(() => {
            sendResponse({ success: true });
          })
          .catch((error) => {
            sendResponse({ success: false, error: error.message });
          });
        return true;

      case "REMOVE_PRODUCTIVE_RULE":
        removeProductiveRule(message.rule)
          .then(() => {
            sendResponse({ success: true });
          })
          .catch((error) => {
            sendResponse({ success: false, error: error.message });
          });
        return true;

      case "ADD_PRODUCTIVE_RULE":
        addProductiveRule(message.rule)
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
  // HELL NAWWW it saves on EVERY tab activation
  // chrome.tabs.onActivated.addListener((activeInfo) => {
  //   updateActiveSession(activeInfo.tabId);
  // });
}
