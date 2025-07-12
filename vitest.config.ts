import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "coverage/",
        "**/*.d.ts",
        "scripts/add-shebang.js",
        "eslint.config*.js",
        "vitest.config.ts",
      ],
    },
    include: ["src/**/*.{test,spec}.{js,ts}"],
    exclude: ["node_modules/", "dist/", "coverage/"],
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  esbuild: {
    target: "node16",
  },
});