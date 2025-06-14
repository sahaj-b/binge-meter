import { getStorageData, setStorageData, type OverlayConfig } from "../store";
export type Size = { width: number; height: number };
export type Position = { left: string; top: string };

let configCache: OverlayConfig | null = null;

export async function getSizeForHost(hostname: string): Promise<Size> {
  const { overlayConfig } = await getStorageData(["overlayConfig"]);
  return overlayConfig.sizes[hostname] || overlayConfig.defaultSize;
}

export async function getPositionForHost(hostname: string): Promise<Position> {
  const { overlayConfig } = await getStorageData(["overlayConfig"]);
  return overlayConfig.positions[hostname] || { left: "50%", top: "20px" };
}

export async function setPositionForHost(hostname: string, position: Position) {
  const { overlayConfig } = await getStorageData(["overlayConfig"]);
  const newPositions = {
    ...(overlayConfig.positions || {}),
    [hostname]: position,
  };
  setStorageData({
    overlayConfig: { ...overlayConfig, positions: newPositions },
  });
}

export async function setSizeForHost(hostname: string, size: Size) {
  const { overlayConfig } = await getStorageData(["overlayConfig"]);
  const newSizes = { ...(overlayConfig.sizes || {}), [hostname]: size };
  setStorageData({
    overlayConfig: { ...overlayConfig, sizes: newSizes },
  });
}

export async function getConfig(fresh: Boolean = false) {
  if (!fresh && configCache) {
    return configCache;
  }
  const result = await getStorageData(["overlayConfig"]);
  configCache = result.overlayConfig;
  return configCache;
}

export function revalidateCache() {
  configCache = null;
}
