import type { OverlayUI } from "./overlay";

export class TickerController {
  private animationFrameId: number | null = null;
  private overlay: OverlayUI;

  private startTime = 0;
  private startingDuration = 0;

  constructor(overlay: OverlayUI) {
    this.overlay = overlay;
  }

  start(startingDuration: number, startTime: number) {
    this.stop();
    this.startingDuration = startingDuration;
    this.startTime = startTime;
    this.overlay.create();
    this.animationFrameId = requestAnimationFrame(this.tick);

    chrome.runtime.sendMessage({
      type: "DEBUG",
      message: "STARTED rAF loop",
    });
  }

  stop() {
    chrome.runtime.sendMessage({
      type: "DEBUG",
      message: "STOPPING rAF loop",
    });
    if (!this.animationFrameId) return;
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }

  private tick = () => {
    if (!this.startTime) return;

    const elapsed = Date.now() - this.startTime;
    const totalTime = this.startingDuration + elapsed;
    this.overlay.update(totalTime);
    this.animationFrameId = requestAnimationFrame(this.tick);
  };
}
