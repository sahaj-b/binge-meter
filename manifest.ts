import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "BingeMeter",
  version: "1.0.0",
  icons: {
    "16": "icon-16.png",
    "32": "icon-32.png",
    "48": "icon-48.png",
    "128": "icon-128.png",
  },
  options_page: "src/apps/settings/index.html",
  background: {
    service_worker: "src/core/background/index.ts",
    type: "module",
    scripts: ["src/core/background/index.ts"],
  },
  action: {
    default_popup: "src/apps/popup/index.html",
    default_icon: {
      "16": "icon-16.png",
      "32": "icon-32.png",
      "48": "icon-48.png",
      "128": "icon-128.png",
    },
  },
  optional_host_permissions: ["*://*/*"],
  permissions: ["alarms", "storage", "tabs", "scripting"],
});
