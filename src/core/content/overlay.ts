import { Draggable, Resizable } from "./events";
import {
  getConfig,
  getPositionForHost,
  getSizeForHost,
  type Position,
  type Size,
} from "./storeService";

export class OverlayUI {
  element: HTMLDivElement | null = null;
  animationFrameId: number | null = null;
  currThresholdState: "DEFAULT" | "WARN" | "DANGER" | null = null;
  parentElement: HTMLElement | null = null;
  onPosChange: ((position: Position) => void) | null = null;
  onSizeChange: ((size: Size) => void) | null = null;
  draggableController: Draggable | null = null;
  resizableController: Resizable | null = null;

  constructor(
    parentElement: HTMLElement | null,
    onPosChange: (position: Position) => void,
    onSizeChange: (size: Size) => void,
  ) {
    this.parentElement = parentElement;
    this.onPosChange = onPosChange;
    this.onSizeChange = onSizeChange;
  }

  async create() {
    const config = await getConfig(true);
    if (config.isHidden) {
      if (this.element) {
        this.element.remove();
        this.element = null;
      }
      return;
    }

    if (this.element) {
      this.loadSizeAndPosition();
      return;
    }

    chrome.runtime.sendMessage({ type: "DEBUG", message: `Creating overlay` });
    // had to add !important. Thanks to Dark Reader for trying to murder my beloved colors.
    this.element = document.createElement("div");
    this.element.id = "binge-meter-overlay";
    this.element.style.cssText = `
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

    this.element.innerHTML = `
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

    this.element.addEventListener("mouseenter", () => {
      const handle = this.element?.querySelector(
        ".binge-meter-resize-handle",
      ) as HTMLElement;
      if (handle) handle.style.opacity = "1";
    });

    this.element.addEventListener("mouseleave", () => {
      const handle = this.element?.querySelector(
        ".binge-meter-resize-handle",
      ) as HTMLElement;
      if (handle) handle.style.opacity = "0";
    });

    await this.loadSizeAndPosition();
    await this.updateTime(0);
    this.draggableController = new Draggable(this.element, (pos) => {
      this.onPosChange?.(pos);
    });
    this.resizableController = new Resizable(this.element, (size) => {
      this.onSizeChange?.(size);
    });
    document.body.appendChild(this.element);
  }

  async loadSizeAndPosition() {
    if (!this.element) return;
    const size = await getSizeForHost(window.location.hostname);
    this.element.style.width = `${size.width}px`;
    this.element.style.height = `${size.height}px`;

    const position = await getPositionForHost(window.location.hostname);
    this.element.style.left = position.left;
    this.element.style.top = position.top;
  }

  async updateTime(totalMs: number) {
    if (!this.element) return;

    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);

    const timeDisplay = this.element.querySelector(
      ".time-display",
    ) as HTMLElement;
    if (timeDisplay) {
      timeDisplay.textContent = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    this.element.style.fontSize = `${getFontSize(this.element.offsetWidth, this.element.offsetHeight)}px`;

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

    if (targetThresholdState !== this.currThresholdState) {
      this.element.style.setProperty("color", targetColors.fg, "important");
      this.element.style.setProperty(
        "background-color",
        targetColors.bg,
        "important",
      );
      this.element.style.setProperty(
        "border-color",
        targetColors.borderColor,
        "important",
      );
      this.currThresholdState = targetThresholdState;
    }
  }

  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    if (this.draggableController) {
      this.draggableController.destroy();
      this.draggableController = null;
    }
    if (this.resizableController) {
      this.resizableController.destroy();
      this.resizableController = null;
    }
  }
}
export function getFontSize(
  overlayWidth: number,
  overlayHeight: number,
): number {
  return Math.min(overlayWidth / 6.5, overlayHeight / 1.7, 60);
}
