// FILE: vite.config.js

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { quasar, transformAssetUrls } from "@quasar/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist-app",
  },
  plugins: [
    vue({
      reactivityTransform: true,
      template: { transformAssetUrls },
    }),

    quasar({
      sassVariables: "src/quasar-variables.sass",
    }),
  ],
});
