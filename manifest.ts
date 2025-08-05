import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Binge Meter",
  version: "1.1.0",
  description:
    "Tracks time on distracting sites with a live on-screen timer. Features AI-powered classification, blocking & analytics",
  // @ts-ignore
  browser_specific_settings: {
    gecko: {
      id: "binge-meter@idk.com",
    },
  },
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
