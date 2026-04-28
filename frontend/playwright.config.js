import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const backendDir = path.join(repoRoot, "backend");
const backendCommand =
  process.platform === "win32"
    ? "..\\.tools\\apache-maven-3.9.9\\bin\\mvn.cmd spring-boot:run"
    : "../.tools/apache-maven-3.9.9/bin/mvn spring-boot:run";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  outputDir: "test-results",
  use: {
    baseURL: "http://localhost:3000",
    browserName: "chromium",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: [
    {
      name: "Backend",
      command: backendCommand,
      cwd: backendDir,
      env: {
        ...process.env,
        APP_DEVELOPER_MODE: "true",
        APP_AUTH_SKIP_TWO_FACTOR: "true",
        APP_NOTIFICATIONS_EMAIL_ENABLED: "false",
      },
      url: "http://127.0.0.1:18080/api/health",
      reuseExistingServer: true,
      timeout: 300_000,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      name: "Frontend",
      command: "npm run dev -- --host 127.0.0.1 --port 3000",
      cwd: __dirname,
      url: "http://127.0.0.1:3000",
      reuseExistingServer: true,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});
