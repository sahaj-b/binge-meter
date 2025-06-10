import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import manifest from "./manifest.json";
import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    crx({
      manifest,
      // browser: "firefox" // for firefox build
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@core": path.resolve(__dirname, "./src/core"),
      "@apps": path.resolve(__dirname, "./src/apps"),
      "@ui": path.resolve(__dirname, "./src/apps/components/ui"),
      "@lib": path.resolve(__dirname, "./src/apps/lib"),
    },
  },
});
