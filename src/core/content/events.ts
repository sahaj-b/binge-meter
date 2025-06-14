import { getFontSize } from "./overlay";
import { type Position } from "./storeService";

export class Draggable {
  isDragging = false;
  offsetX = 0;
  offsetY = 0;
  dragMouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  dragMouseUpHandler: (() => void) | null = null;
  constructor(element: HTMLElement, onDragEnd: (pos: Position) => void) {
    this.dragMouseMoveHandler = (e) => {
      if (!this.isDragging) return;

      const rect = element.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let newX = e.clientX - this.offsetX;
      let newY = e.clientY - this.offsetY;

      newX = Math.max(0, Math.min(newX, windowWidth - rect.width));
      newY = Math.max(0, Math.min(newY, windowHeight - rect.height));

      element.style.left = `${newX}px`;
      element.style.top = `${newY}px`;
    };

    this.dragMouseUpHandler = () => {
      if (this.isDragging) {
        this.isDragging = false;
        onDragEnd({ left: element.style.left, top: element.style.top });
      }
    };

    document.addEventListener("mousemove", this.dragMouseMoveHandler);
    document.addEventListener("mouseup", this.dragMouseUpHandler);
    element.addEventListener("mousedown", (e) => {
      if (
        (e.target as HTMLElement).classList.contains(
          "binge-meter-resize-handle",
        )
      ) {
        return;
      }

      this.isDragging = true;
      this.offsetX = e.clientX - element.offsetLeft;
      this.offsetY = e.clientY - element.offsetTop;
    });
  }
  destroy() {
    if (this.dragMouseMoveHandler) {
      document.removeEventListener("mousemove", this.dragMouseMoveHandler);
    }
    if (this.dragMouseUpHandler) {
      document.removeEventListener("mouseup", this.dragMouseUpHandler);
    }
  }
}

export class Resizable {
  isResizing = false;
  resizeHandle: HTMLElement | null = null;
  resizeMouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  resizeMouseUpHandler: (() => void) | null = null;

  constructor(
    element: HTMLElement,
    onResizeEnd: (size: { width: number; height: number }) => void,
  ) {
    this.resizeHandle = element.querySelector(
      ".binge-meter-resize-handle",
    ) as HTMLElement;

    this.resizeHandle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      this.isResizing = true;
    });

    this.resizeMouseMoveHandler = (e) => {
      e.preventDefault();
      if (!this.isResizing) return;

      const rect = element.getBoundingClientRect();
      const newWidth = Math.max(80, e.clientX - rect.left);
      const newHeight = Math.max(30, e.clientY - rect.top);

      element.style.width = `${newWidth}px`;
      element.style.height = `${newHeight}px`;
      element.style.fontSize = `${getFontSize(newWidth, newHeight)}px`;
    };

    this.resizeMouseUpHandler = () => {
      if (this.isResizing) {
        this.isResizing = false;
        onResizeEnd({
          width: element.offsetWidth,
          height: element.offsetHeight,
        });
      }
    };

    document.addEventListener("mousemove", this.resizeMouseMoveHandler);
    document.addEventListener("mouseup", this.resizeMouseUpHandler);
  }

  destroy() {
    if (this.resizeMouseMoveHandler) {
      document.removeEventListener("mousemove", this.resizeMouseMoveHandler);
    }
    if (this.resizeMouseUpHandler) {
      document.removeEventListener("mouseup", this.resizeMouseUpHandler);
    }
  }
}
