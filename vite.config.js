import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rolldownOptions: {
      onLog(level, log, defaultHandler) {
        if (level === "warn" && log.code === "MODULE_LEVEL_DIRECTIVE" && /use client/.test(log.message ?? "")) {
          return;
        }
        defaultHandler(level, log);
      },
    },
  },
});
