import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: ".",
  // Set VITE_BASE=/YourRepoName/ when building for GitHub Pages project sites (e.g. /VISO/).
  // Omit locally so `npm run dev` stays at the site root.
  base: process.env.VITE_BASE ?? "/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        catalog: resolve(__dirname, "catalog.html"),
        contact: resolve(__dirname, "contact.html"),
      },
    },
  },
});
