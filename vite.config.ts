import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import manifest from "./manifest";
import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", { target: "19" }]],
      },
    }),
    tailwindcss(),
    crx({
      manifest,
      // browser: "firefox" // for firefox build
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        analytics: "./src/apps/analytics/index.html",
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@ui": path.resolve(__dirname, "./src/apps/components/ui"),
      "@lib": path.resolve(__dirname, "./src/apps/lib"),
    },
  },
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
});
