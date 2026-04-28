import { expect, test } from "@playwright/test";
import { loginAsUser } from "./helpers/auth.js";
import { captureEvidence } from "./helpers/evidence.js";

function filterMeaningfulErrors(messages) {
  const ignorePatterns = [
    /favicon/i,
    /chrome-extension/i,
    /^Failed to load resource: the server responded with a status of 403 \(\)$/i,
  ];
  return messages.filter((message) => !ignorePatterns.some((pattern) => pattern.test(message)));
}

test("T18 landing page loads and public navigation is visible", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Smart Campus Operations Hub", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /home/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /about us/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /contact us/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /^login$/i })).toBeVisible();

  await captureEvidence(page, "landing-page.png");
});

test("T19 public pages stay free of major console errors and the tablet layout does not crash", async ({
  page,
}) => {
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.goto("/");
  await expect(page.getByRole("link", { name: /^login$/i })).toBeVisible();

  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();

  await loginAsUser(page);
  await expect(page.getByLabel("User workspace")).toBeVisible();

  const meaningfulErrors = filterMeaningfulErrors([...consoleErrors, ...pageErrors]);
  expect(meaningfulErrors).toEqual([]);

  await captureEvidence(page, "tablet-dashboard.png");
});
