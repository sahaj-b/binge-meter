import { savePosition, saveSize, getFontSize } from "./overlay";

export function makeDraggable(element: HTMLElement) {
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

export function makeResizable(element: HTMLElement) {
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
