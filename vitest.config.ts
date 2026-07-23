import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    exclude: ["tests/rendered-html.test.mjs", "node_modules/**", "dist/**", "dist-pages/**"],
    coverage: {
      reporter: ["text", "html"],
      include: ["src/lib/**/*.ts", "src/data/**/*.ts"],
    },
  },
});
