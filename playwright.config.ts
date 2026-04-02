import { defineConfig, devices } from "@playwright/test";

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  (process.env.NEXT_PUBLIC_BASE_PATH
    ? `http://127.0.0.1:3040${process.env.NEXT_PUBLIC_BASE_PATH}`
    : "http://127.0.0.1:3040");

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["html"], ["github"]] : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev",
        url: "http://127.0.0.1:3040",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
