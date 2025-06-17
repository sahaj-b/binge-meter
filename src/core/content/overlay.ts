import type { OverlayConfig } from "@/shared/types";
import { Draggable, Resizable } from "./events";
import {
  getConfig,
  getPositionForHost,
  getSizeForHost,
  setPositionForHost,
  setSizeForHost,
  type Position,
  type Size,
} from "./storeService";

export class OverlayUI {
  element: HTMLDivElement | null = null;
  animationFrameId: number | null = null;
  currThresholdState: "DEFAULT" | "WARN" | "DANGER" | null = null;
  parentElement: HTMLElement;
  hostname: string;
  draggableController: Draggable | null = null;
  resizableController: Resizable | null = null;
  onPositionSave: (position: Position) => void;
  onSizeSave: (size: Size) => void;

  constructor(
    parentElement: HTMLElement,
    hostname: string,
    onPositionSave?: (position: Position) => void,
    onSizeSave?: (size: Size) => void,
  ) {
    this.parentElement = parentElement;
    this.hostname = hostname;
    this.onPositionSave = onPositionSave || (() => {});
    this.onSizeSave = onSizeSave || (() => {});
  }

  async create() {
    // this method can be also called to just revalidate the config cache

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

    chrome.runtime.sendMessage({ type: "DEBUG", message: "Creating overlay" });
    // had to add !important. Thanks to Dark Reader for trying to murder my beloved colors.
    this.element = document.createElement("div");
    this.element.id = "binge-meter-overlay";
    this.element.style.cssText = `
    position: fixed;
    color: ${config.colors.fg} !important;
    background: ${config.colors.bg} !important;
    border: 1px solid ${config.colors.borderColor} !important;
    border-radius: ${config.borderRadius}px
    font-family: monospace;
    z-index: 10000;
    backdrop-filter: blur(${config.blur}px);
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
    await this.update(0);
    this.draggableController = new Draggable(this.element, async (pos) => {
      await setPositionForHost(this.hostname, pos);
      this.onPositionSave(pos);
    });
    this.resizableController = new Resizable(this.element, async (size) => {
      await setSizeForHost(this.hostname, size);
      this.onSizeSave(size);
    });
    document.body.appendChild(this.element);
  }

  async loadSizeAndPosition() {
    if (!this.element) return;
    const size = await getSizeForHost(this.hostname);
    this.element.style.width = `${size.width}px`;
    this.element.style.height = `${size.height}px`;

    const position = await getPositionForHost(this.hostname);
    this.element.style.left = position.left;
    this.element.style.top = position.top;
  }

  async update(
    totalMs: number,
    forceUpdateColors = false,
    overlayConfig?: OverlayConfig,
  ) {
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
    overlayConfig = overlayConfig ?? (await getConfig());
    if (!overlayConfig) return;
    this.setStyles(overlayConfig);
    this.setThresholdColors(overlayConfig, totalMs, forceUpdateColors);
  }

  private setThresholdColors(
    overlayConfig: OverlayConfig,
    totalMs: number,
    forceUpdate = false,
  ) {
    if (!this.element) return;

    let targetThresholdState: "DEFAULT" | "WARN" | "DANGER" = "DEFAULT";
    let targetColors = overlayConfig.colors;
    if (totalMs >= overlayConfig.thresholdDanger) {
      targetThresholdState = "DANGER";
      targetColors = overlayConfig.dangerColors;
    } else if (totalMs >= overlayConfig.thresholdWarn) {
      targetThresholdState = "WARN";
      targetColors = overlayConfig.warnColors;
    }

    if (forceUpdate || targetThresholdState !== this.currThresholdState) {
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

  private setStyles(overlayConfig: OverlayConfig) {
    if (!this.element) return;
    if (this.element.style.borderRadius !== `${overlayConfig.borderRadius}px`) {
      this.element.style.borderRadius = `${overlayConfig.borderRadius}px`;
    }
    if (this.element.style.backdropFilter !== `blur(${overlayConfig.blur}px)`) {
      this.element.style.backdropFilter = `blur(${overlayConfig.blur}px)`;
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
  return Math.min(overlayWidth / 5.5, overlayHeight / 1.7, 60);
}
