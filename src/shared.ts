export type OverlayConfig = {
  thresholdWarn: number;
  thresholdDanger: number;
  // fg, bg, border
  colors: { fg: string; bg: string; borderColor: string };
  warnColors: { fg: string; bg: string; borderColor: string };
  dangerColors: { fg: string; bg: string; borderColor: string };
  defaultSize: { width: number; height: number };
  positions: Record<string, { left: string; top: string }>;
  sizes: Record<string, { width: number; height: number }>;
  isHidden: boolean;
};
export const defaultOverlayConfig: OverlayConfig = {
  thresholdWarn: 10 * 1000,
  thresholdDanger: 20 * 1000,
  colors: { fg: "#ffffff", bg: "#0f0f0f80", borderColor: "#ffffff41" },
  warnColors: { fg: "#ffffff", bg: "#8e8e15cc", borderColor: "#ffffff41" },
  dangerColors: { fg: "#ffffff", bg: "#9b2308cc", borderColor: "#ffffff41" },
  defaultSize: { width: 150, height: 50 },
  positions: {},
  sizes: {},
  isHidden: false,
};
