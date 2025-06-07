import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: "esnext",
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // define every non-JS/TS entry point
        options: resolve(__dirname, "src/options/options.html"),
        popup: resolve(__dirname, "src/popup/popup.html"),
        // define scripts that are not linked in any HTML.
        background: resolve(__dirname, "src/background.ts"),
        content: resolve(__dirname, "src/content.ts"),
      },
      output: {
        entryFileNames: `[name].js`,
      },
    },
  },
});
