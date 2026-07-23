import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "pages",
  base: "/oraculum-tarot-ai/",
  publicDir: "../public",
  plugins: [react()],
  build: {
    outDir: "../dist-pages",
    emptyOutDir: true,
    target: "es2022",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@mlc-ai/web-llm")) return "webllm";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("node_modules")) return "vendor";
          return undefined;
        },
      },
    },
  },
  worker: {
    format: "es",
  },
});
