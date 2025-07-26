import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "BingeMeter",
  version: "1.0.0",
  options_page: "src/apps/settings/index.html",
  background: {
    service_worker: "src/core/background/index.ts",
    type: "module",
    scripts: ["src/core/background/index.ts"],
  },
  action: {
    default_popup: "src/apps/popup/index.html",
  },
  optional_host_permissions: ["*://*/*"],
  permissions: ["alarms", "storage", "tabs", "scripting"],
});
