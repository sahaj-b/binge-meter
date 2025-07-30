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

import { overlayCss } from "./overlayStyles";
import { getStorageData } from "@/shared/storage";

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
  absolute = false;
  fallbackPosition: Position;
  isBlocked = false;
  private stylesheetId = "binge-meter-stylesheet";

  constructor(
    parentElement: HTMLElement,
    hostname: string,
    onPositionSave?: (position: Position) => void,
    onSizeSave?: (size: Size) => void,
    absolute = false,
    fallbackPosition: Position = { left: "50%", top: "20px" },
  ) {
    this.parentElement = parentElement;
    this.hostname = hostname;
    this.onPositionSave = onPositionSave || (() => {});
    this.onSizeSave = onSizeSave || (() => {});
    this.absolute = absolute;
    this.fallbackPosition = fallbackPosition;
  }

  async create(config?: OverlayConfig, blocking = false) {
    // this method can be also called to just revalidate the config cache
    if (this.isBlocked) return;

    config = config ?? (await getConfig(true));

    if (!blocking && config.isHidden) {
      if (this.element) this.destroy();
      return;
    }

    if (!document.getElementById(this.stylesheetId)) {
      const styleTag = document.createElement("style");
      styleTag.id = this.stylesheetId;
      styleTag.innerHTML = overlayCss;
      document.head.appendChild(styleTag);
    }

    if (this.element) {
      this.loadSizeAndPosition();
      return;
    }

    this.element = document.createElement("div");
    this.element.id = "binge-meter-overlay";

    this.element.innerHTML = `
      <div class="time-display"></div>
      <div class="binge-meter-resize-handle"></div>
    `;

    // had to add !important. Thanks to Dark Reader for trying to murder my beloved colors.
    this.element.style.position = this.absolute ? "absolute" : "fixed";
    this.element.style.borderRadius = `${config.borderRadius}px`;
    this.element.style.backdropFilter = `blur(${config.blur}px)`;
    this.element.style.setProperty("color", config.colors.fg, "important");
    this.element.style.setProperty("background", config.colors.bg, "important");
    this.element.style.setProperty(
      "border",
      `1px solid ${config.colors.borderColor}`,
      "important",
    );

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

    if (blocking) this.setBlockingStyles();

    document.body.appendChild(this.element);

    if (!blocking) await this.loadSizeAndPosition();
    await this.update(
      (await getStorageData(["dailyTime"])).dailyTime.total,
      true,
      config,
    );

    this.draggableController = new Draggable(
      this.element,
      async (pos) => {
        await setPositionForHost(this.hostname, pos);
        this.onPositionSave(pos);
      },
      this.absolute,
    );

    this.resizableController = new Resizable(this.element, async (size) => {
      await setSizeForHost(this.hostname, size);
      this.onSizeSave(size);
    });
  }

  async loadSizeAndPosition() {
    if (!this.element) return;
    const size = await getSizeForHost(this.hostname);
    this.element.style.width = `${size.width}px`;
    this.element.style.height = `${size.height}px`;

    const position = await getPositionForHost(this.hostname);
    if (position) {
      this.element.style.left = position.left;
      this.element.style.top = position.top;
    } else {
      this.element.style.left = this.fallbackPosition.left;
      this.element.style.top = this.fallbackPosition.top;
    }
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
    if (timeDisplay)
      timeDisplay.textContent = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    this.element.style.fontSize = `${getFontSize(this.element.offsetWidth, this.element.offsetHeight)}px`;

    overlayConfig = overlayConfig ?? (await getConfig());
    if (!overlayConfig) return;

    this.setStyles(overlayConfig);
    this.setThresholdColors(overlayConfig, totalMs, forceUpdateColors);
  }

  async block() {
    if (!this.element) {
      this.create(undefined, true).then(() => this.block());
      return;
    }

    if (this.isBlocked) return;
    this.isBlocked = true;

    this.resizableController?.destroy();
    this.draggableController?.destroy();
    this.draggableController = null;
    this.resizableController = null;

    const blockContainer = document.createElement("div");
    blockContainer.className = "blocking-ui-container";

    blockContainer.innerHTML = `
      <h1 class="blocking-title">Time Limit Reached</h1>
      <div class="unlock-actions">
        <span id="unlock-message" class="unlock-message">Unlock for:</span>
        <button id="unlock-5" class="unlock-button">5 min</button>
        <button id="unlock-15" class="unlock-button">15 min</button>
      </div>
      <button id="custom-unlock-toggle" class="custom-unlock-toggle">Custom duration</button>
      <div id="custom-unlock-container" class="custom-unlock-container hidden">
        <input type="number" id="custom-unlock-input" class="custom-unlock-input" placeholder="mins" min="1" />
        <button id="custom-unlock-confirm" class="unlock-button">Unlock</button>
      </div>
    `;

    this.setBlockingStyles();
    this.element.append(blockContainer);

    const resizeHandle = this.element.querySelector(
      ".binge-meter-resize-handle",
    ) as HTMLElement;
    if (resizeHandle) resizeHandle.style.display = "none";
    this.setThresholdColors(await getConfig(), 0, true);

    function sendGraceRequest(minutes: number) {
      chrome.runtime.sendMessage({
        type: "REQUEST_GRACE_PERIOD",
        duration: minutes * 60 * 1000,
      });
    }

    this.element
      .querySelector("#unlock-5")
      ?.addEventListener("click", () => sendGraceRequest(5));
    this.element
      .querySelector("#unlock-15")
      ?.addEventListener("click", () => sendGraceRequest(15));

    const customContainer = this.element.querySelector<HTMLDivElement>(
      "#custom-unlock-container",
    );
    this.element
      .querySelector("#custom-unlock-toggle")
      ?.addEventListener("click", () => {
        customContainer?.classList.toggle("hidden");
      });

    this.element
      .querySelector("#custom-unlock-confirm")
      ?.addEventListener("click", () => {
        const input = this.element?.querySelector<HTMLInputElement>(
          "#custom-unlock-input",
        );
        const minutes = Number.parseInt(input?.value || "0", 10);
        if (minutes > 0) sendGraceRequest(minutes);
      });
  }

  private setBlockingStyles() {
    if (!this.element) return;
    this.element.style.background = "";
    this.element.style.borderRadius = "";
    this.element.style.backdropFilter = "";
    this.element.style.border = "";
    this.element.style.transition = "all 0.3s ease-in-out";
    this.element.classList.add("blocking");
  }

  private removeBlockingStyles() {
    if (!this.element) return;
    this.element.classList.remove("blocking");
    this.element.style.transition = "";
  }

  private setThresholdColors(
    overlayConfig: OverlayConfig,
    totalMs: number,
    forceUpdate = false,
  ) {
    if (!this.element || this.isBlocked) return;

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
    if (!this.element || this.isBlocked) return;
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

    document.getElementById(this.stylesheetId)?.remove();

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
