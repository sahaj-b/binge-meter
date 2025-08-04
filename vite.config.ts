import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import manifest from "./manifest";
import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import zip from "vite-plugin-zip-pack";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig(() => {
  const isFirefox = !!process.env.FIREFOX;
  return {
    plugins: [
      react({
        babel: {
          plugins: [["babel-plugin-react-compiler", { target: "19" }]],
        },
      }),
      tailwindcss(),
      crx({
        manifest,
        browser: isFirefox ? "firefox" : "chrome",
      }),
      zip({ outDir: "release", outFileName: "binge-meter.zip" }),
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
  };
});
