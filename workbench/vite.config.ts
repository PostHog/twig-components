import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^\.\/assets\//,
        replacement: fileURLToPath(new URL("../assets/", import.meta.url)),
      },
    ],
  },
  build: { outDir: "dist", emptyOutDir: true },
});
