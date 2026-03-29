import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => ({
  root: ".",
  // Relative base in production so assets work on GitHub Pages project URLs
  // (e.g. cowebslb.github.io/VISO/) without hard-coding the repo name.
  base: command === "build" ? "./" : "/",
  build: {
    outDir: "docs",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        catalog: resolve(__dirname, "catalog.html"),
        contact: resolve(__dirname, "contact.html"),
      },
    },
  },
}));
