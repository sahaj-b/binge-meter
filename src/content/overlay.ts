import { setStorageData } from "@/store";
import { makeDraggable, makeResizable, removeOverlayEvents } from "./events";
import { getConfig } from "./state";

let overlay: HTMLDivElement | null = null;
let animationFrameId: number | null = null;
let currThresholdState: "DEFAULT" | "WARN" | "DANGER" | null = null;

export async function ensureOverlay() {
  const config = await getConfig(true);
  if (config.isHidden) {
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
    return;
  }

  if (overlay) {
    await loadSize();
    await loadPosition();
    return;
  }
  chrome.runtime.sendMessage({ type: "DEBUG", message: `Creating overlay` });
  // had to add !important. Thanks to Dark Reader for trying to murder my beloved colors.
  overlay = document.createElement("div");
  overlay.id = "binge-meter-overlay";
  overlay.style.cssText = `
    position: fixed;
    color: ${config.colors.fg} !important;
    background: ${config.colors.bg} !important;
    border: 1px solid ${config.colors.borderColor} !important;
    border-radius: 20px;
    font-family: monospace;
    z-index: 10000;
    backdrop-filter: blur(10px);
    cursor: move;
    user-select: none;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  overlay.innerHTML = `
    <div style="
      position: absolute;
      bottom: 1px;
      right: 1px;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      cursor: se-resize;
      opacity: 0;
      transition: opacity 0.2s;
      background: linear-gradient(-45deg,transparent 50%, #ffffff59 50% 60%, transparent 60% 100%) !important;
    " class="binge-meter-resize-handle"></div>
    <div class="time-display"></div>
  `;

  overlay.addEventListener("mouseenter", () => {
    const handle = overlay?.querySelector(
      ".binge-meter-resize-handle",
    ) as HTMLElement;
    if (handle) handle.style.opacity = "1";
  });

  overlay.addEventListener("mouseleave", () => {
    const handle = overlay?.querySelector(
      ".binge-meter-resize-handle",
    ) as HTMLElement;
    if (handle) handle.style.opacity = "0";
  });

  await updateOverlayTime(0);
  await loadPosition();
  await loadSize();
  makeDraggable(overlay);
  makeResizable(overlay);
  document.body.appendChild(overlay);
}

export function getFontSize(
  overlayWidth: number,
  overlayHeight: number,
): number {
  return Math.min(overlayWidth / 6.5, overlayHeight / 1.7, 60);
}

export async function updateOverlayTime(totalMs: number) {
  if (!overlay) return;

  const hours = Math.floor(totalMs / (1000 * 60 * 60));
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);

  const timeDisplay = overlay.querySelector(".time-display") as HTMLElement;
  if (timeDisplay) {
    timeDisplay.textContent = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  overlay.style.fontSize = `${getFontSize(overlay.offsetWidth, overlay.offsetHeight)}px`;

  const overlayConfig = await getConfig();
  let targetThresholdState: "DEFAULT" | "WARN" | "DANGER" = "DEFAULT";
  let targetColors = overlayConfig.colors;

  if (totalMs >= overlayConfig.thresholdDanger) {
    targetThresholdState = "DANGER";
    targetColors = overlayConfig.dangerColors;
  } else if (totalMs >= overlayConfig.thresholdWarn) {
    targetThresholdState = "WARN";
    targetColors = overlayConfig.warnColors;
  }

  if (targetThresholdState !== currThresholdState) {
    overlay.style.setProperty("color", targetColors.fg, "important");
    overlay.style.setProperty("background-color", targetColors.bg, "important");
    overlay.style.setProperty(
      "border-color",
      targetColors.borderColor,
      "important",
    );
    currThresholdState = targetThresholdState;
  }
}

export function startTicking(startingDuration: number, startTime: number) {
  ensureOverlay();
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    chrome.runtime.sendMessage({
      type: "DEBUG",
      message: `CANCELLED animation frame ${animationFrameId}`,
    });
  }
  function tick() {
    if (!startTime) return;
    const elapsed = Date.now() - startTime;
    const totalTime = startingDuration + elapsed;
    updateOverlayTime(totalTime);
    animationFrameId = requestAnimationFrame(tick);
  }
  tick();
  chrome.runtime.sendMessage({
    type: "DEBUG",
    message: `STARTED rAF loop`,
  });
}

export function stopTicking() {
  chrome.runtime.sendMessage({
    type: "DEBUG",
    message: `STOPPING rAF loop`,
  });
  if (!animationFrameId) return;
  cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
}

export async function loadSize() {
  if (!overlay) return;
  const overlayConfig = await getConfig(true);
  const hostname = window.location.hostname;
  const savedSize = overlayConfig?.sizes?.[hostname];
  if (savedSize) {
    overlay.style.width = `${savedSize.width}px`;
    overlay.style.height = `${savedSize.height}px`;
  } else {
    overlay.style.width = `${overlayConfig.defaultSize?.width}px`;
    overlay.style.height = `${overlayConfig.defaultSize?.height}px`;
  }
}

export async function loadPosition() {
  if (!overlay) return;
  const overlayConfig = await getConfig(true);
  const hostname = window.location.hostname;
  const savedPos = overlayConfig?.positions?.[hostname];

  if (savedPos) {
    overlay.style.left = savedPos.left;
    overlay.style.top = savedPos.top;
    // overlay.style.right = "auto";
  } else {
    overlay.style.left = "50%";
    overlay.style.top = "20px";
  }
}

export async function savePosition() {
  if (!overlay) return;

  const overlayConfig = await getConfig(true);
  const hostname = window.location.hostname;

  overlayConfig.positions[hostname] = {
    left: overlay.style.left,
    top: overlay.style.top,
  };
  await setStorageData({ overlayConfig });
  chrome.runtime.sendMessage({
    type: "DEBUG",
    message: `Saving position for ${hostname}: left=${overlay.style.left}, top=${overlay.style.top}`,
  });
}

export async function saveSize() {
  if (!overlay) return;

  const overlayConfig = await getConfig(true);
  const hostname = window.location.hostname;

  if (!overlayConfig.sizes) {
    overlayConfig.sizes = {};
  }

  overlayConfig.sizes[hostname] = {
    width: overlay.offsetWidth,
    height: overlay.offsetHeight,
  };

  await setStorageData({ overlayConfig });
  chrome.runtime.sendMessage({
    type: "DEBUG",
    message: `Saving size for ${hostname}: ${overlay.offsetWidth} ${overlay.offsetHeight}`,
  });
}

export function removeOverlay() {
  stopTicking();
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
  removeOverlayEvents();
}
