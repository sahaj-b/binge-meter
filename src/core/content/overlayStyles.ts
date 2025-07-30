export const overlayCss = `

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
    /* transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); */
  }

  #binge-meter-overlay .time-display {
    pointer-events: none;
  }
  
  #binge-meter-overlay.blocking .time-display {
    font-size: 1.5em !important;
  }

  #binge-meter-overlay.blocking {
    background: #494c15cc !important;
    width: 95vw;
    height: 95vh;
    top: 2.5vh;
    left: 2.5vw;
    border-radius: 1.5rem;
    cursor: default;
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
    text-align: center;
    color: white;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5rem;
    justify-content: center;
  }

  .blocking-title {
    font-size: 1em;
    font-weight: bold;
    margin-bottom: 1rem;
  }

  .unlock-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .unlock-message {
    font-size: 1em;
    color: #aaa;
    margin-bottom: 1rem;
  }

  .unlock-button {
    background: #fff;
    color: #111;
    font-weight: bold;
    font-size: 1em;
    padding: 12px 24px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: transform 0.1s ease;
  }
  .unlock-button:hover { transform: scale(1.05); }
  .unlock-button:active { transform: scale(0.98); }

  .custom-unlock-toggle {
    background: none;
    border: none;
    color: #aaa;
    cursor: pointer;
    text-decoration: underline;
    font-size: 0.9em;
    padding: 0;
  }
  .custom-unlock-toggle:hover { color: #fff; }

  .custom-unlock-container {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-top: 1rem;
  }
  .custom-unlock-container.hidden { display: none; }

  .custom-unlock-input {
    background: rgba(40, 40, 40, 0.8);
    color: #fff;
    border: 1px solid rgba(100, 100, 100, 0.8);
    border-radius: 6px;
    padding: 8px;
    width: 80px;
    text-align: center;
    font-size: 1em;
  }
`;
