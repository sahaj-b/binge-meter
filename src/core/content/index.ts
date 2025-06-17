import { monkeyPatchNavigation } from "./monkeyPatchNavigation";
import { OverlayUI } from "./overlay";
import { getMetadata } from "./scraper";
import { revalidateCache } from "./storeService";
import { TickerController } from "./tickerController";

const overlay = new OverlayUI(document.body, window.location.hostname);
const ticker = new TickerController(overlay);

let isActivated = true;

// see comments in background/listeners.ts to understand this shitshow
window.addEventListener("blur", () => {
  chrome.runtime.sendMessage({ type: "TAB_BLUR" });
});

window.addEventListener("focus", () => {
  chrome.runtime.sendMessage({ type: "TAB_FOCUS" });
});

if ("navigation" in window) {
  (window.navigation as any).addEventListener("navigate", handleNavigation);
} else {
  console.warn(
    "Navigation API not supported in this browser. Falling back to monkey-patching history API",
  );
  monkeyPatchNavigation(sendEvalMsg);
}

chrome.runtime.onMessage.addListener(async (message: any) => {
  if (!isActivated && message.type !== "ACTIVATE_OVERLAY") {
    return;
  }
  switch (message.type) {
    case "START_TICKING":
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
    case "RE-INITIALIZE_OVERLAY":
      isActivated = true;
      await sendEvalMsg();
      break;
    default:
      break;
  }
});

function handleNavigation(event: any) {
  if (
    event.navigationType === "reload" ||
    event.destination.url === window.location.href
  ) {
    return;
  }
  event.finished.then(() => {
    sendEvalMsg();
  });
}

async function sendEvalMsg() {
  const metadata = getMetadata();
  await chrome.runtime.sendMessage({ type: "DEBUG", message: metadata });
  await chrome.runtime.sendMessage({
    type: "EVALUATE_PAGE",
    metadata,
  });
}

sendEvalMsg();
