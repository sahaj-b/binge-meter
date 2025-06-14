import { defaultOverlayConfig } from "@core/store";

export type TimeInput = {
  hours: number;
  minutes: number;
  seconds: number;
};

export function msToTimeInput(ms: number): TimeInput {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
}

export function timeInputToMs(time: TimeInput): number {
  return (time.hours * 3600 + time.minutes * 60 + time.seconds) * 1000;
}

export function extractAlphaFromHex(hex: string): number {
  if (hex.length === 9) {
    return parseInt(hex.slice(-2), 16) / 255;
  }
  return 1;
}

export function addAlphaToHex(hex: string, alpha: string): string {
  hex = hex.startsWith("#") ? hex : "#" + hex;
  hex = hex.slice(0, 7);
  if (hex.length < 7) {
    hex = hex.padEnd(7, "0");
  }
  return hex + alpha;
}

export function updateHexOpacity(hex: string, opacity: number): string {
  const alphaHex = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, "0");
  return addAlphaToHex(hex, alphaHex);
}

export function extractOpacityFromColor(color: string): number {
  if (color.startsWith("#") && color.length === 9) {
    return parseInt(color.slice(-2), 16) / 255;
  }
  return 1;
}
