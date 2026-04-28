import { expect, test } from "@playwright/test";
import { loginAsAdmin, loginAsUser } from "./helpers/auth.js";
import { captureEvidence } from "./helpers/evidence.js";

test("T07 notification bell opens the dropdown in the user workspace", async ({ page }) => {
  await loginAsUser(page);

  const bell = page.locator("header").getByRole("button", { name: "Notifications" });
  await bell.click();

  const dropdown = page.locator('[role="menu"]');
  await expect(dropdown).toBeVisible();
  await expect(dropdown.getByText(/^Notifications$/)).toBeVisible();
  await expect(dropdown.getByRole("button", { name: /mark all as read/i })).toBeVisible();
  await expect(dropdown).toContainText(/you're all caught up|loading|notifications/i);

  await captureEvidence(page, "notification-dropdown.png");
});

test("T08 notifications page loads for end users", async ({ page }) => {
  await loginAsUser(page);
  await page.goto("/notifications");

  await expect(page).toHaveURL(/\/notifications(?:[/?#]|$)/);
  await expect(page.getByRole("heading", { name: /notifications/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^all$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /announcements/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /system/i })).toBeVisible();

  await captureEvidence(page, "notifications-page.png");
});

test("T09 admin targeted notifications page loads", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/communication/targeted-notifications");

  await expect(page).toHaveURL(/\/admin\/communication\/targeted-notifications(?:[/?#]|$)/);
  await expect(page.getByRole("heading", { name: /targeted notifications/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /add notification/i })).toBeVisible();

  await captureEvidence(page, "admin-notifications-page.png");
});
