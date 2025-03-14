import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    css: true,
    reporters: ["verbose"],
    coverage: {
      provider: "istanbul",
      reporter: ["text", "json", "html"],
      include: ["src/**/*"],
      exclude: [
        "/node_modules/",
        "/**/fixtures/*",
        "/**/*.test.tsx",
        "/**/*.stories.tsx",
      ],
    },
  },
});
