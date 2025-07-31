export const overlayCss = `
  :host {
    all: initial;
    position: fixed;
    font-family: 'SF Pro Display', 'Segoe UI', 'Roboto', 'Inter', 'Helvetica Neue', 'Arial', sans-serif !important;
    z-index: 2147483647;
    backdrop-filter: blur(10px);
    cursor: move;
    user-select: none;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    overflow: hidden;
    /* transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); */
    --background: oklch(0.2046 0 0 /0.95);
    --foreground: oklch(0.9219 0 0 /0.9);
    --primary: hsl(38 92% 50% / 90%);
    --primary-border: hsl(38 92% 50% / 50%);
    --primary-foreground: oklch(0 0 0 /0.9);
    --secondary: oklch(0.2686 0 0 /0.9);
    --secondary-foreground: oklch(0.9219 0 0 /0.9);
    --border: oklch(0.3715 0 0 /0.9);
    --input: #333333e6;
  }

:host(.blocking) {
  background: var(--background) !important;
  color: var(--foreground) !important;
  width: 95vw;
  height: 95vh;
  top: 2.5vh;
  left: 2.5vw;
  border-radius: 24px;
  cursor: default;
  backdrop-filter: blur(16px);
  border: 2px solid var(--primary-border) !important;
}


.lock-icon {
  position: absolute;
  top: 40%;
  left: -624px;
  transform: translateY(-50%);
  font-size: 640px;
  color: rgba(255, 255, 255, 0.03);
  z-index: -1;
  pointer-events: none;
}

.lock-icon-2 {
  position: absolute;
  top: 40%;
  right: -624px;
  transform: translateY(-50%);
  font-size: 640px;
  color: rgba(255, 255, 255, 0.03);
  z-index: -1;
  pointer-events: none;
}

.time-display {
  pointer-events: none;
  transition: all;
}

:host(.blocking) .time-display {
  position: absolute;
  top: 10%;
  color: var(--foreground) !important;
  opacity: 0.9 !important;
  font-size: 2em !important;
}

.binge-meter-resize-handle {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  cursor: se-resize;
  opacity: 0;
  transition: opacity 0.2s;
  background: linear-gradient(-45deg, transparent 50%, #ffffff59 50%, 60%, transparent 60%) !important;
}

.blocking-ui-container {
  position: relative;
  translate: 0 20%;
  border-radius: 16px;
  padding: 32px 64px;
  text-align: center;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  justify-content: center;
}

.blocking-message {
  color: var(--foreground);
  letter-spacing: 0.03em;
  font-size: 32px;
  font-weight: bold;
  margin: 0 0 16px 0;
  line-height: 1.2;
}
.blocking-message span {
  margin-top: 8px;
  display: block;
  color: var(--primary);
}

.unlock-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto auto auto;
  gap: 16px;
  align-items: center;
  justify-items: center;
}

#unlock-1 {
  grid-column: 1;
  grid-row: 2;
}

#unlock-2 {
  grid-column: 2;
  grid-row: 2;
}

.unlock-message {
  grid-column: 1 / 3; 
  font-size: 28.8px;
  color: var(--foreground);
  opacity: 0.6;
  margin: 0 0 8px 0;
}

.unlock-button {
  font-size: 24px;
  background: var(--primary);
  color: var(--primary-foreground);
  padding: 12px 24px;
  white-space: nowrap;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: transform 0.1s ease;
  width: 100%;
}


#custom-duration-button {
  grid-column: 1 / 3;
  grid-row: 3;
  background: var(--secondary);
  color: var(--secondary-foreground);
  border: 1px solid var(--border);
}

#custom-duration-button:focus {
  outline: none;
  border-color: var(--primary);
}

#custom-duration-button:hover {
  background: var(--input);
}

.unlock-button:hover { opacity: 0.9; }
.unlock-button:active { opacity: 0.8; }

.display-none {
  display: none;
}

.custom-unlock-stuff.hidden {
  display: none;
}

.custom-unlock-input {
  grid-column: 1;
  font-size: 24px;
  background: var(--input);
  color: var(--foreground);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 24px;
  text-align: center;
  width: 69px;
}

#custom-unlock-confirm {
  grid-column: 2;
}

.custom-unlock-input:focus {
  outline: none;
  border-color: var(--primary);
}
`;
