import {
  ensureOverlay,
  updateOverlayTime,
  stopTicking,
  startTicking,
  removeOverlay,
} from "./overlay";

// see comments in background/listeners.ts to understand this shitshow
window.addEventListener("blur", () => {
  chrome.runtime.sendMessage({ type: "TAB_BLUR" });
});

window.addEventListener("focus", () => {
  chrome.runtime.sendMessage({ type: "TAB_FOCUS" });
});

const messageHandler = async (message: any) => {
  switch (message.type) {
    case "START_TICKING":
      await updateOverlayTime(message.startingDuration);
      startTicking(message.startingDuration, message.startTime);
      break;
    case "STOP_TICKING":
      stopTicking();
      break;
    case "REVALIDATE_CACHE":
      chrome.runtime.sendMessage({
        type: "DEBUG",
        message: "Revalidating cache",
      });
      break;
    case "UPDATE_FRAME":
      chrome.runtime.sendMessage({
        type: "DEBUG",
        message: `UPDATE_FRAME received`,
      });
      await ensureOverlay();
      await updateOverlayTime(message.time);
      break;
    case "SLEEP":
      goToSleep();
      break;
    default:
      break;
  }
};

async function initialize() {
  chrome.runtime.onMessage.addListener(messageHandler);
  await chrome.runtime.sendMessage({ type: "CONTENT_SCRIPT_READY" });
}

async function resurrectionHandler(message: any) {
  if (message.type === "WAKE_UP") {
    chrome.runtime.sendMessage({
      type: "DEBUG",
      message: "I CAN LISTEN AGAIN",
    });
    chrome.runtime.onMessage.removeListener(resurrectionHandler);
    await initialize();
  }
}

function goToSleep() {
  removeOverlay();
  chrome.runtime.onMessage.removeListener(messageHandler);
  chrome.runtime.sendMessage({ type: "DEBUG", message: "I am deaf af" });
  chrome.runtime.onMessage.addListener(resurrectionHandler);
}

initialize();
