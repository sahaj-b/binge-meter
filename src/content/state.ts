import {
  type OverlayConfig,
  defaultStorageData,
  getStorageData,
  setStorageData,
} from "../store";

let configCache: OverlayConfig | null = null;

export async function getConfig(fresh: Boolean = false) {
  if (!fresh && configCache) {
    return configCache;
  }
  const result = await getStorageData(["overlayConfig"]);
  configCache = result.overlayConfig;
  if (!configCache) {
    // copying coz TS consts are a joke, mutating configCache would mutate defaultStorageData
    configCache = { ...defaultStorageData.overlayConfig };
    await setStorageData({ overlayConfig: configCache });
  }
  return configCache;
}
