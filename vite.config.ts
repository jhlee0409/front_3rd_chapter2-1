import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src/advanced/src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/advanced/main.advanced.tsx"),
      },
    },
  },
});
