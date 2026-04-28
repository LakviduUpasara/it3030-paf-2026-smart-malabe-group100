import { expect, test } from "@playwright/test";
import { loginAsAdmin, loginAsUser } from "./helpers/auth.js";
import { captureEvidence } from "./helpers/evidence.js";

test("T11 resource availability page loads for booking checks", async ({ page }) => {
  await loginAsUser(page);
  await page.goto("/bookings/availability");

  await expect(page).toHaveURL(/\/bookings\/availability(?:[/?#]|$)/);
  await expect(page.getByRole("heading", { name: /resource availability/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /check availability/i })).toBeVisible();

  await captureEvidence(page, "availability-page.png");
});

test("T12 create booking page loads with the booking form", async ({ page }) => {
  await loginAsUser(page);
  await page.goto("/bookings/new");

  await expect(page).toHaveURL(/\/bookings\/new(?:[/?#]|$)/);
  await expect(page.getByRole("heading", { name: /create booking/i })).toBeVisible();
  await expect(page.getByText(/^start time$/i)).toBeVisible();
  await expect(page.getByText(/^end time$/i)).toBeVisible();
  await expect(page.getByPlaceholder(/enter booking purpose/i)).toBeVisible();

  await captureEvidence(page, "create-booking-page.png");
});

test("T13 my bookings page loads", async ({ page }) => {
  await loginAsUser(page);
  await page.goto("/bookings");

  await expect(page).toHaveURL(/\/bookings(?:[/?#]|$)/);
  await expect(page.getByRole("heading", { name: /my bookings/i })).toBeVisible();
  await expect(
    page.getByText(/no bookings found|create one now|booking #/i),
  ).toBeVisible();

  await captureEvidence(page, "my-bookings-page.png");
});

test("T14 admin booking approval page loads", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/bookings");

  await expect(page).toHaveURL(/\/admin\/bookings(?:[/?#]|$)/);
  await expect(page.getByRole("heading", { name: /booking approval queue/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /all bookings/i })).toBeVisible();

  await captureEvidence(page, "admin-bookings-page.png");
});
