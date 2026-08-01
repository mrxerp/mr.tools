import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://mr.tools",
  output: "static",
  prefetch: true,
  compressHTML: true,
  devToolbar: { enabled: false },
  build: {
    inlineStylesheets: "auto",
  },
  vite: {
    resolve: {
      alias: {
        "@": new URL("./src", import.meta.url).pathname,
      },
    },
  },
});
