import React from "react";
import { createRoot } from "react-dom/client";
import Analytics from "./Analytics";

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(React.createElement(Analytics));
}
