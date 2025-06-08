import {
  ensureOverlay,
  updateOverlayTime,
  stopTicking,
  startTicking,
} from "./overlay";

// see comments in background/listeners.ts to understand this shitshow
window.addEventListener("blur", () => {
  chrome.runtime.sendMessage({ type: "OVERLAY_BLUR" });
});

window.addEventListener("focus", () => {
  chrome.runtime.sendMessage({ type: "OVERLAY_FOCUS" });
});

chrome.runtime.onMessage.addListener(async (message) => {
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
    default:
      break;
  }
});

chrome.runtime.sendMessage({ type: "CONTENT_SCRIPT_READY" });

