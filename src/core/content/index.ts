import { OverlayUI } from "./overlay";
import { revalidateCache } from "./storeService";
import { TickerController } from "./tickerController";
import {
  setPositionForHost,
  setSizeForHost,
  type Position,
} from "./storeService";

function setPosition(position: Position) {
  return setPositionForHost(window.location.hostname, position);
}
function setSize(size: { width: number; height: number }) {
  return setSizeForHost(window.location.hostname, size);
}

const overlay = new OverlayUI(document.body, setPosition, setSize);
const ticker = new TickerController(overlay);

let isSleeping = false;

// see comments in background/listeners.ts to understand this shitshow
window.addEventListener("blur", () => {
  chrome.runtime.sendMessage({ type: "TAB_BLUR" });
});

window.addEventListener("focus", () => {
  chrome.runtime.sendMessage({ type: "TAB_FOCUS" });
});

chrome.runtime.onMessage.addListener(async (message: any) => {
  if (isSleeping && message.type !== "WAKE_UP") {
    return;
  }
  switch (message.type) {
    case "START_TICKING":
      await overlay.updateTime(message.startingDuration);
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
      await overlay.updateTime(message.time);
      break;
    case "SLEEP":
      overlay.destroy();
      ticker.stop();
      isSleeping = true;
      console.log("I AM DEAF AF");
      break;

    case "WAKE_UP":
      isSleeping = false;
      console.log("I CAN LISTEN AGAIN");
      await sendInitMessage();
      break;
    default:
      break;
  }
});

export async function sendInitMessage() {
  await chrome.runtime.sendMessage({ type: "CONTENT_SCRIPT_READY" });
}
sendInitMessage();
