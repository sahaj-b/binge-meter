let overlay: HTMLDivElement | null = null;
let animationFrameId: number | null = null;

// focus events even for WINDOW, coz chrome.onFocusChanged SUCKS
window.addEventListener("blur", () => {
  chrome.runtime.sendMessage({ type: "CONTENT_SCRIPT_BLUR" });
});

window.addEventListener("focus", () => {
  chrome.runtime.sendMessage({ type: "CONTENT_SCRIPT_FOCUS" });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "START_TICKING") {
    updateOverlayTime(message.startingDuration);
    startTicking(message.startingDuration, message.startTime);
  } else if (message.type === "STOP_TICKING") {
    stopTicking();
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

function ensureOverlay() {
  if (overlay) return;

  overlay = document.createElement("div");
  overlay.id = "binge-meter-overlay";
  overlay.style.cssText = `
    position: fixed;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px 15px;
    border-radius: 20px;
    font-family: monospace;
    font-size: 14px;
    z-index: 10000;
    cursor: move;
    user-select: none;
  `;
  // default position: top-center
  overlay.style.left = "50%";
  overlay.style.top = "20px";

  updateOverlayTime(0);
  makeDraggable(overlay);
  document.body.appendChild(overlay);
  loadPosition();
}

function updateOverlayTime(totalMs: number) {
  if (!overlay) return;

  const hours = Math.floor(totalMs / (1000 * 60 * 60));
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);

  overlay.textContent = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function makeDraggable(element: HTMLElement) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  element.addEventListener("mousedown", (e) => {
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

    // prevent dragging oustide the window
    newX = Math.max(0, Math.min(newX, windowWidth - rect.width));
    newY = Math.max(0, Math.min(newY, windowHeight - rect.height));

    element.style.left = `${newX}px`;
    element.style.top = `${newY}px`;
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      savePosition();
      isDragging = false;
    }
  });
}

async function savePosition() {
  if (!overlay) return;

  const { overlayConfig } = await chrome.storage.local.get(["overlayConfig"]);
  const hostname = window.location.hostname;

  overlayConfig.positions[hostname] = {
    left: overlay.style.left,
    top: overlay.style.top,
  };

  await chrome.storage.local.set({ overlayConfig });
}

async function loadPosition() {
  if (!overlay) return;

  const { overlayConfig } = await chrome.storage.local.get(["overlayConfig"]);
  const hostname = window.location.hostname;
  const savedPos = overlayConfig?.positions?.[hostname];

  if (savedPos) {
    overlay.style.left = savedPos.left;
    overlay.style.top = savedPos.top;
    // overlay.style.right = "auto";
  }
}
