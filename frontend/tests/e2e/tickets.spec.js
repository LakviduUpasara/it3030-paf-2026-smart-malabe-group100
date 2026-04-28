import { expect, test } from "@playwright/test";
import { loginAsAdmin, loginAsTechnician, loginAsUser } from "./helpers/auth.js";
import { captureEvidence } from "./helpers/evidence.js";

test("T15 my tickets page loads and the create ticket form can be opened", async ({ page }) => {
  await loginAsUser(page);
  await page.goto("/tickets");

  await expect(page).toHaveURL(/\/tickets(?:[/?#]|$)/);
  await expect(page.getByRole("heading", { name: /my tickets/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /create ticket/i })).toBeVisible();

  await page.getByRole("button", { name: /create ticket/i }).click();
  await expect(page.getByRole("heading", { name: /create ticket/i })).toBeVisible();
  await expect(page.getByText(/submit ticket/i)).toBeVisible();

  await captureEvidence(page, "my-tickets-page.png");
});

test("T16 admin ticket management page loads", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/tickets");

  await expect(page).toHaveURL(/\/admin\/tickets(?:[/?#]|$)/);
  await expect(page.getByRole("heading", { name: /manage tickets/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /open tickets/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /assigned tickets/i })).toBeVisible();

  await captureEvidence(page, "manage-tickets-page.png");
});

test("T17 technician ticket pages load for assigned, resolved, and withdrawn views", async ({ page }) => {
  await loginAsTechnician(page);

  await page.goto("/technician/tickets");
  await expect(page.getByRole("heading", { name: /assigned tickets/i })).toBeVisible();

  await page.goto("/technician/resolved");
  await expect(page.getByRole("heading", { name: /^resolved$/i })).toBeVisible();

  await page.goto("/technician/withdrawn");
  await expect(page.getByRole("heading", { name: /withdrawn tickets/i })).toBeVisible();

  await captureEvidence(page, "technician-tickets-page.png");
});
