// shared/logger.ts

const IS_DEBUG_MODE =
  import.meta.env.DEV || import.meta.env.VITE_DEBUG_MODE === "true";

export function debugLog(...args: any[]) {
  if (IS_DEBUG_MODE) console.log("DEBUG:", ...args);
}

export function sendDebugMsg(message: any) {
  if (IS_DEBUG_MODE) chrome.runtime.sendMessage({ type: "DEBUG", message });
}
