import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    env: { MONGODB_URI: process.env.MONGODB_TEST_URI ?? "mongodb://127.0.0.1:27017/manabi_test" },
    testTimeout: 20_000,
  },
});
