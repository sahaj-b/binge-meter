import { type OverlayConfig, defaultOverlayConfig } from "../shared";

let configCache: OverlayConfig | null = null;

export async function getConfig(
  fresh: Boolean = false,
): Promise<OverlayConfig> {
  if (!fresh && configCache) {
    return configCache;
  }
  const result = await chrome.storage.local.get("overlayConfig");
  configCache = result.overlayConfig;
  if (!configCache) {
    // copying coz TS consts are a joke, mutating configCache would mutate defaultConfig
    configCache = { ...defaultOverlayConfig };
    await chrome.storage.local.set({ overlayConfig: configCache });
  }
  return configCache;
}

// getConfig caching logic and state management for content script
