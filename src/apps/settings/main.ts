import React from "react";
import { createRoot } from "react-dom/client";
import Settings from "./Settings";

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(React.createElement(Settings));
}
