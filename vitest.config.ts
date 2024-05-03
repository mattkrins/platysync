import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: "./server/tests/test.setup.ts",
    watchExclude: ["**/node_modules/**", "**/client/**", "**/build/**"],
    include: ["./server/tests/*.test.ts"],
    fileParallelism: false
  },
})