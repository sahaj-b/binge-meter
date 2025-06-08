import { type OverlayConfig, defaultOverlayConfig } from "./shared";

type ThresholdState = "DEFAULT" | "WARN" | "DANGER";

let overlay: HTMLDivElement | null = null;
let animationFrameId: number | null = null;
let currThresholdState: ThresholdState | null = null;

let configCache: OverlayConfig | null = null;

async function getConfig(fresh: Boolean = false): Promise<OverlayConfig> {
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

// see comments in background.ts to understand this shitshow
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
      configCache = null;
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

function startTicking(startingDuration: number, startTime: number) {
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

function stopTicking() {
  chrome.runtime.sendMessage({
    type: "DEBUG",
    message: `STOPPING rAF loop`,
  });
  if (!animationFrameId) return;
  cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
}

async function ensureOverlay() {
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
    background-color: ${config.colors.bg};
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
      background-image: linear-gradient(-45deg,transparent 50%, #ffffff59 50% 60%, transparent 60% 100%) !important;
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
  document.body.appendChild(overlay);
  makeDraggable(overlay);
  makeResizable(overlay);
}

function getFontSize(overlayWidth: number, overlayHeight: number): number {
  return Math.min(overlayWidth / 6.5, overlayHeight / 1.7, 60);
}

async function updateOverlayTime(totalMs: number) {
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
  let targetThresholdState: ThresholdState = "DEFAULT";
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

function makeDraggable(element: HTMLElement) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  element.addEventListener("mousedown", (e) => {
    // don't drag if clicking on resize handle
    if (
      (e.target as HTMLElement).classList.contains("binge-meter-resize-handle")
    ) {
      return;
    }

    isDragging = true;
    offsetX = e.clientX - element.offsetLeft;
    offsetY = e.clientY - element.offsetTop;
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const rect = element.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let newX = e.clientX - offsetX;
    let newY = e.clientY - offsetY;

    newX = Math.max(0, Math.min(newX, windowWidth - rect.width));
    newY = Math.max(0, Math.min(newY, windowHeight - rect.height));

    element.style.left = `${newX}px`;
    element.style.top = `${newY}px`;
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      savePosition();
    }
  });
}

function makeResizable(element: HTMLElement) {
  const resizeHandle = element.querySelector(
    ".binge-meter-resize-handle",
  ) as HTMLElement;
  let isResizing = false;

  resizeHandle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    isResizing = true;
  });

  document.addEventListener("mousemove", (e) => {
    e.preventDefault();
    if (!isResizing) return;

    const rect = element.getBoundingClientRect();
    const newWidth = Math.max(90, e.clientX - rect.left);
    const newHeight = Math.max(50, e.clientY - rect.top);

    element.style.width = `${newWidth}px`;
    element.style.height = `${newHeight}px`;

    element.style.fontSize = `${getFontSize(newWidth, newHeight)}px`;
  });

  document.addEventListener("mouseup", () => {
    if (isResizing) {
      isResizing = false;
      saveSize();
      // chrome.runtime.sendMessage({ type: "OVERLAY_RESIZE" });
    }
  });
}

async function savePosition() {
  if (!overlay) return;

  const overlayConfig = await getConfig(true);
  const hostname = window.location.hostname;

  overlayConfig.positions[hostname] = {
    left: overlay.style.left,
    top: overlay.style.top,
  };
  await chrome.storage.local.set({ overlayConfig });
  chrome.runtime.sendMessage({
    type: "DEBUG",
    message: `Saving position for ${hostname}: left=${overlay.style.left}, top=${overlay.style.top}`,
  });
}

async function saveSize() {
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

  await chrome.storage.local.set({ overlayConfig });
  chrome.runtime.sendMessage({
    type: "DEBUG",
    message: `Saving size for ${hostname}: ${overlay.offsetWidth} ${overlay.offsetHeight}`,
  });
}

async function loadSize() {
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

async function loadPosition() {
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

chrome.runtime.sendMessage({ type: "CONTENT_SCRIPT_READY" });
