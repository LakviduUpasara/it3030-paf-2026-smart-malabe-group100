import { expect, test } from "@playwright/test";
import { captureEvidence } from "./helpers/evidence.js";

test("T01 login page loads with email/password controls", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await expect(page.locator('input[placeholder="e.g., name@campus.edu"]')).toBeVisible();
  await expect(page.locator('input[placeholder="Enter your password"]')).toBeVisible();
  await expect(page.locator(".login-form").getByRole("button", { name: /^login$/i })).toBeVisible();

  await captureEvidence(page, "login-page.png");
});

test("T02 Google sign-in area is visible on the login page", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByText(/or continue with/i)).toBeVisible();
  await expect(page.locator(".google-identity-slot")).toBeVisible();
});

test("T03 protected routes redirect unauthenticated users to login", async ({ page }) => {
  await page.goto("/bookings");

  await page.waitForURL(/\/login(?:[/?#]|$)/);
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
});
