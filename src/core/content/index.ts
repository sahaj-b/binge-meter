import { setupNavigation } from "./navigation";
import { OverlayUI } from "./overlay";
import { getMetadata } from "./scraper";
import { revalidateCache } from "./storeService";
import { TickerController } from "./tickerController";

const overlay = new OverlayUI(document.body, window.location.hostname);
const ticker = new TickerController(overlay);

let isActivated = true;

console.log("Loading content script...");

// see comments in background/listeners.ts to understand this shitshow
window.addEventListener("blur", () => {
  if (isActivated) chrome.runtime.sendMessage({ type: "TAB_BLUR" });
});

window.addEventListener("focus", () => {
  if (isActivated) chrome.runtime.sendMessage({ type: "TAB_FOCUS" });
});

setupNavigation((url) => {
  chrome.runtime.sendMessage({ type: "URL_ONLY_EVALUATE", url });
}, sendEvalMsg);

chrome.runtime.onMessage.addListener(async (message: any, _, sendResponse) => {
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
      const metadata = await getMetadata();
      chrome.runtime.sendMessage({
        type: "DEBUG",
        message: "SENDING METADATA" + JSON.stringify(metadata),
      });
      sendResponse({ metadata: metadata });
      return true;
    }

    case "START_TICKING":
      await overlay.create();
      await overlay.update(message.startingDuration, true);
      ticker.start(message.startingDuration, message.startTime);
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
      chrome.runtime.sendMessage({
        type: "DEBUG",
        message: `UPDATE_FRAME received, time: ${message.time}`,
      });
      await overlay.create();
      await overlay.update(message.time);
      break;
    case "DEACTIVATE_OVERLAY":
      overlay.destroy();
      ticker.stop();
      isActivated = false;
      break;

    case "ACTIVATE_OVERLAY":
      if (isActivated) return;
      isActivated = true;
      await sendEvalMsg();
      break;

    case "RE-INITIALIZE_OVERLAY":
      isActivated = true;
      await sendEvalMsg();
      break;
    default:
      break;
  }
});

async function sendEvalMsg() {
  const metadata = await getMetadata();
  await chrome.runtime.sendMessage({
    type: "EVALUATE_PAGE",
    metadata,
  });
}

sendEvalMsg();
