import { expect, test } from "@playwright/test";
import { loginAsAdmin, loginAsTechnician, loginAsUser } from "./helpers/auth.js";
import { captureEvidence } from "./helpers/evidence.js";

test("T04 admin dashboard loads with sidebar and notification bell", async ({ page }) => {
  await loginAsAdmin(page);

  await expect(page).toHaveURL(/\/admin(?:[/?#]|$)/);
  await expect(page.getByLabel("Administration")).toBeVisible();
  await expect(page.getByRole("heading", { name: /campus operations/i })).toBeVisible();
  await expect(page.locator("header").getByRole("button", { name: "Notifications" })).toBeVisible();

  await captureEvidence(page, "admin-dashboard.png");
});

test("T05 user dashboard loads with the workspace shell", async ({ page }) => {
  await loginAsUser(page);

  await expect(page).toHaveURL(/\/dashboard(?:[/?#]|$)/);
  await expect(page.getByLabel("User workspace")).toBeVisible();
  await expect(page.getByText(/smart campus operations hub/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /my bookings/i })).toBeVisible();

  await captureEvidence(page, "user-dashboard.png");
});

test("T06 technician dashboard loads with the technician workspace shell", async ({ page }) => {
  await loginAsTechnician(page);

  await expect(page).toHaveURL(/\/technician(?:[/?#]|$)/);
  await expect(page.getByLabel("Technician workspace")).toBeVisible();
  await expect(page.getByText(/technician operations desk/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /open tickets/i })).toBeVisible();

  await captureEvidence(page, "technician-dashboard.png");
});
