import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { globalSetup: "./server/tests/test.setup.ts" },
})