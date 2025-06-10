import { savePosition, saveSize, getFontSize } from "./overlay";
let dragMouseMoveHandler: ((e: MouseEvent) => void) | null = null;
let dragMouseUpHandler: (() => void) | null = null;
let resizeMouseMoveHandler: ((e: MouseEvent) => void) | null = null;
let resizeMouseUpHandler: (() => void) | null = null;

export function makeDraggable(element: HTMLElement) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  element.addEventListener("mousedown", (e) => {
    if (
      (e.target as HTMLElement).classList.contains("binge-meter-resize-handle")
    ) {
      return;
    }

    isDragging = true;
    offsetX = e.clientX - element.offsetLeft;
    offsetY = e.clientY - element.offsetTop;
  });
  dragMouseMoveHandler = (e) => {
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
  };

  dragMouseUpHandler = () => {
    if (isDragging) {
      isDragging = false;
      savePosition();
    }
  };

  document.addEventListener("mousemove", dragMouseMoveHandler);
  document.addEventListener("mouseup", dragMouseUpHandler);
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
  resizeMouseMoveHandler = (e) => {
    e.preventDefault();
    if (!isResizing) return;

    const rect = element.getBoundingClientRect();
    const newWidth = Math.max(80, e.clientX - rect.left);
    const newHeight = Math.max(30, e.clientY - rect.top);

    element.style.width = `${newWidth}px`;
    element.style.height = `${newHeight}px`;

    element.style.fontSize = `${getFontSize(newWidth, newHeight)}px`;
  };

  resizeMouseUpHandler = () => {
    if (isResizing) {
      isResizing = false;
      saveSize();
    }
  };

  document.addEventListener("mousemove", resizeMouseMoveHandler);
  document.addEventListener("mouseup", resizeMouseUpHandler);
}

export function removeOverlayEvents() {
  if (dragMouseMoveHandler)
    document.removeEventListener("mousemove", dragMouseMoveHandler);

  if (dragMouseUpHandler)
    document.removeEventListener("mouseup", dragMouseUpHandler);

  if (resizeMouseMoveHandler)
    document.removeEventListener("mousemove", resizeMouseMoveHandler);

  if (resizeMouseUpHandler)
    document.removeEventListener("mouseup", resizeMouseUpHandler);
}
