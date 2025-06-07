let overlay: HTMLDivElement | null = null;
let animationFrameId: number | null = null;
let isHidden = false;

type Settings = {
  thresholdWarn: number;
  thresholdDanger: number;
  size: { width: number; height: number };
};
let settingsCache: Settings | null = null;

async function getSettings(): Promise<Settings> {
  if (settingsCache) {
    return settingsCache;
  }

  const defaultValues: Settings = {
    thresholdWarn: 15 * 60 * 1000,
    thresholdDanger: 45 * 60 * 1000,
    size: { width: 150, height: 50 },
  };

  const result: Settings = await chrome.storage.local.get(defaultValues);

  settingsCache = result;
  return settingsCache;
}

// focus events even for WINDOW, coz chrome.onFocusChanged SUCKS
window.addEventListener("blur", () => {
  chrome.runtime.sendMessage({ type: "OVERLAY_BLUR" });
});

window.addEventListener("focus", () => {
  chrome.runtime.sendMessage({ type: "OVERLAY_FOCUS" });
});

chrome.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case "START_TICKING":
      updateOverlayTime(message.startingDuration);
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
      settingsCache = null;
      break;
    case "TOGGLE_OVERLAY":
      chrome.runtime.sendMessage({
        type: "DEBUG",
        message: `TOGGLE_OVERLAY received`,
      });
      toggleOverlay();
      break;
    default:
      break;
  }
});

function toggleOverlay() {
  isHidden = !isHidden;
  if (isHidden) {
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
  } else {
    ensureOverlay();
    loadSize();
    loadPosition();
  }
}

function startTicking(startingDuration: number, startTime: number) {
  ensureOverlay();
  loadSize();
  loadPosition();
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
    // chrome.runtime.sendMessage({
    //   type: "DEBUG",
    //   message: `Ticking: ${totalTime}ms`,
    // });
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
  if (isHidden || overlay) return;

  // had to add !important. Thanks to Dark Reader for trying to murder my beloved colors.
  overlay = document.createElement("div");
  overlay.id = "binge-meter-overlay";
  overlay.style.cssText = `
    position: fixed;
    color: white !important;
    background: #0f0f0f80;
    padding: 10px 15px;
    border: 1px solid #ffffff41 !important;
    border-radius: 20px;
    font-family: monospace;
    z-index: 10000;
    backdrop-filter: blur(8px);
    cursor: move;
    user-select: none;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // resize handle on hover
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
      background: linear-gradient(-45deg,transparent 50%, #ffffff33 50% 60%, transparent 60% 100%) !important;
    " class="resize-handle"></div>
    <div class="time-display"></div>
  `;

  overlay.addEventListener("mouseenter", () => {
    const handle = overlay?.querySelector(".resize-handle") as HTMLElement;
    if (handle) handle.style.opacity = "1";
  });

  overlay.addEventListener("mouseleave", () => {
    const handle = overlay?.querySelector(".resize-handle") as HTMLElement;
    if (handle) handle.style.opacity = "0";
  });

  updateOverlayTime(0);
  makeDraggable(overlay);
  makeResizable(overlay);
  document.body.appendChild(overlay);
  await loadPosition();
  await loadSize();
}

function getFontSize(overlayWidth: number, overlayHeight: number): number {
  return Math.min(overlayWidth / 8, overlayHeight / 2.5, 60);
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

  const settings = await getSettings();
  let backgroundColor = null;

  if (totalMs >= settings.thresholdDanger) {
    backgroundColor = "#f45734cc";
  } else if (totalMs >= settings.thresholdWarn) {
    backgroundColor = "#c3c31dcc";
  }

  if (backgroundColor)
    overlay.style.backgroundColor = backgroundColor + " !important";
}

function makeDraggable(element: HTMLElement) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  element.addEventListener("mousedown", (e) => {
    // don't drag if clicking on resize handle
    if ((e.target as HTMLElement).classList.contains("resize-handle")) {
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

    // prevent dragging outside the window
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
  const resizeHandle = element.querySelector(".resize-handle") as HTMLElement;
  let isResizing = false;

  resizeHandle.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    isResizing = true;
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;

    const rect = element.getBoundingClientRect();
    const newWidth = Math.max(60, e.clientX - rect.left);
    const newHeight = Math.max(15, e.clientY - rect.top);

    element.style.width = `${newWidth}px`;
    element.style.height = `${newHeight}px`;

    // update font size immediately during resize
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
  chrome.runtime.sendMessage({
    type: "DEBUG",
    message: "trying to Save overlay position",
  });
  if (!overlay) return;

  const { overlayConfig } = await chrome.storage.local.get("overlayConfig");
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
  chrome.runtime.sendMessage({
    type: "DEBUG",
    message: "trying to Save overlay size",
  });
  if (!overlay) return;

  const { overlayConfig } = await chrome.storage.local.get(["overlayConfig"]);
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
    message: `Saving size for ${hostname}: ${overlay.offsetWidth}x${overlay.offsetHeight}`,
  });
}

async function loadSize() {
  if (!overlay) return;

  const { overlayConfig } = await chrome.storage.local.get("overlayConfig");
  const hostname = window.location.hostname;
  const savedSize = overlayConfig?.sizes?.[hostname];

  if (savedSize) {
    overlay.style.width = `${savedSize.width}px`;
    overlay.style.height = `${savedSize.height}px`;
  } else {
    const settings = await getSettings();
    overlay.style.width = `${settings.size.width}px`;
    overlay.style.height = `${settings.size.height}px`;
  }
  chrome.runtime.sendMessage({
    type: "DEBUG",
    message: `Loaded size for ${hostname}: ${overlay.style.width}x${overlay.style.height}`,
  });
}

async function loadPosition() {
  if (!overlay) return;

  const { overlayConfig } = await chrome.storage.local.get("overlayConfig");
  const hostname = window.location.hostname;
  const savedPos = overlayConfig?.positions?.[hostname];

  if (savedPos) {
    overlay.style.left = savedPos.left;
    overlay.style.top = savedPos.top;
    // overlay.style.right = "auto";
    chrome.runtime.sendMessage({
      type: "DEBUG",
      message: `Loaded position for ${hostname}: left=${savedPos.left}, top=${savedPos.top}`,
    });
  } else {
    overlay.style.left = "50%";
    overlay.style.top = "20px";
    chrome.runtime.sendMessage({
      type: "DEBUG",
      message: `No saved position for ${hostname}, using default`,
    });
  }
}
