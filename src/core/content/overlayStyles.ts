export const overlayCss = `

#binge-meter-overlay.blocking {
  --background: oklch(0.2046 0 0 /0.9);
  --foreground: oklch(0.9219 0 0 /0.9);
  --card: #1f1f1f42;
  --primary: hsl(38 92% 50% / 90%);
  --primary-foreground: oklch(0 0 0 /0.9);
  --secondary: oklch(0.2686 0 0 /0.9);
  --secondary-foreground: oklch(0.9219 0 0 /0.9);
  --border: oklch(0.3715 0 0 /0.9);
  --input: #333333e6;
  --ring: var(--primary);
}

#binge-meter-overlay {
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
}

#binge-meter-overlay .time-display {
  pointer-events: none;
  transition: all;
}

#binge-meter-overlay.blocking .time-display {
  position: absolute;
  top: 20%;
  color: var(--foreground) !important;
  opacity: 0.9 !important;
  font-size: 2em !important;
}

#binge-meter-overlay.blocking {
  background: var(--background) !important;
  color: var(--foreground) !important;
  width: 95vw;
  height: 95vh;
  top: 2.5vh;
  left: 2.5vw;
  border-radius: 1.5rem;
  cursor: default;
  backdrop-filter: blur(10px);
}

#binge-meter-overlay .binge-meter-resize-handle {
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
  translate: 0 20%;
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 2rem 4rem;
  background: var(--card);
  text-align: center;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  justify-content: center;
}

.blocking-title {
  color: var(--foreground);
  font-size: 0.7em;
  font-weight: bold;
  margin-bottom: 1rem;
}

.unlock-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.unlock-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.unlock-message {
  font-size: 0.6em;
  color: var(--foreground);
  margin-bottom: 0.5rem;
}

.unlock-button {
  background: var(--primary);
  color: var(--primary-foreground);
  padding: 12px 24px;
  white-space: nowrap;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: bold;
  transition: transform 0.1s ease;
  width: 100%;
}

#custom-unlock-button {
  background: var(--secondary);
  color: var(--secondary-foreground);
  border: 1px solid var(--border);
}

#custom-unlock-button:hover {
  background: var(--input);
}

.unlock-button:hover { opacity: 0.9; }
.unlock-button:active { opacity: 0.8; }

.custom-unlock-container {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.hidden { display: none; }

.custom-unlock-input {
  background: var(--input);
  color: var(--foreground);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px;
  width: 67px;
  height: 24px;
  text-align: center;
  }

.custom-unlock-input:focus {
  outline: none;
  border-color: var(--ring);
}
`;
