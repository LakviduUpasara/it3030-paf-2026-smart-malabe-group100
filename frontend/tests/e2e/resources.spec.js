import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth.js";
import { captureEvidence } from "./helpers/evidence.js";

test("T10 resource management page loads with filters and create modal", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/resources/facilities");

  await expect(page).toHaveURL(/\/admin\/resources\/facilities(?:[/?#]|$)/);
  await expect(page.getByText(/resource portfolio/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /manage resources/i })).toBeVisible();
  await expect(page.getByPlaceholder(/search by location/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /new resource/i })).toBeVisible();

  await page.getByRole("button", { name: /new resource/i }).click();
  await expect(page.getByPlaceholder(/engineering lab a/i)).toBeVisible();
  await expect(page.getByText(/availability windows/i)).toBeVisible();

  await captureEvidence(page, "resources-page.png");
});
