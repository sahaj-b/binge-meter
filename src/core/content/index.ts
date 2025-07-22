import type { Metadata } from "@/shared/types";
import { setupNavigation } from "./navigation";
import { OverlayUI } from "./overlay";
import { getMetadata, setLastScrapedYtTitle } from "./scraper";
import { revalidateCache } from "./storeService";
import { TickerController } from "./tickerController";

const overlay = new OverlayUI(document.body, window.location.hostname);
const ticker = new TickerController(overlay);

let isActivated = true;
let cachedMetadata: Metadata | null = null;

console.log("Loading content script...");

// see comments in background/listeners.ts to understand this shitshow
window.addEventListener("blur", () => {
  if (isActivated) chrome.runtime.sendMessage({ type: "TAB_BLUR" });
});

window.addEventListener("focus", () => {
  if (isActivated) chrome.runtime.sendMessage({ type: "TAB_FOCUS" });
});

setupNavigation(
  (url) => {
    chrome.runtime.sendMessage({ type: "URL_ONLY_EVALUATE", url });
  },
  () => {
    chrome.runtime.sendMessage({
      type: "DEBUG",
      message: "FULLLLLLLL METADATA SENDDDDDDDDDDDDDDdd",
    });
    sendEvalMsg();
  },
);

chrome.runtime.onMessage.addListener((message: any, _, sendResponse) => {
  if (
    !isActivated &&
    message.type !== "ACTIVATE_OVERLAY" &&
    message.type !== "RE-INITIALIZE_OVERLAY" &&
    message.type !== "SEND_METADATA"
  )
    return;
  chrome.runtime.sendMessage({
    type: "DEBUG",
    message: message.type,
  });
  switch (message.type) {
    case "SEND_METADATA": {
      if (cachedMetadata) {
        chrome.runtime.sendMessage({
          type: "DEBUG",
          message: "SENDING METADATA " + JSON.stringify(cachedMetadata),
        });
        sendResponse({ metadata: cachedMetadata });
      } else {
        getMetadata().then((metadata) => {
          chrome.runtime.sendMessage({
            type: "DEBUG",
            message: "SENDING METADATA " + JSON.stringify(metadata),
          });
          cachedMetadata = metadata;
          sendResponse({ metadata: metadata });
        });
      }
      return true;
    }

    case "START_TICKING":
      overlay
        .create()
        .then(() =>
          overlay
            .update(message.startingDuration, true)
            .then(() =>
              ticker.start(message.startingDuration, message.startTime),
            ),
        );
      break;
    case "STOP_TICKING":
      ticker.stop();
      break;
    case "REVALIDATE_CACHE":
      chrome.runtime.sendMessage({
        type: "DEBUG",
        message: "Revalidating cache",
      });
      revalidateCache();
      break;
    case "UPDATE_FRAME":
      overlay.create().then(() => overlay.update(message.time));
      break;
    case "DEACTIVATE_OVERLAY":
      overlay.destroy();
      ticker.stop();
      isActivated = false;
      setLastScrapedYtTitle(null);
      break;

    case "ACTIVATE_OVERLAY":
      if (isActivated) return;
      isActivated = true;
      // sendEvalMsg();
      break;

    case "RE-INITIALIZE_OVERLAY":
      isActivated = true;
      sendEvalMsg(false);
      break;
    default:
      break;
  }
});

async function sendEvalMsg(freshMetadata = true) {
  let metadata: Metadata;
  if (!freshMetadata && cachedMetadata) metadata = cachedMetadata;
  else {
    metadata = await getMetadata();
    cachedMetadata = metadata;
  }
  await chrome.runtime.sendMessage({
    type: "EVALUATE_PAGE",
    metadata,
  });
}

// sendEvalMsg(); setupNavgation will handle initial load
