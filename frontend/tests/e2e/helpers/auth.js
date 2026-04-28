import { expect } from "@playwright/test";

const USER_EMAIL = "user@smartcampus.edu";
const USER_PASSWORD = "User@12345";
const ADMIN_EMAIL = "admin@smartcampus.edu";
const ADMIN_PASSWORD = "Admin@12345";
const TECHNICIAN_EMAIL = "technician@smartcampus.edu";
const TECHNICIAN_PASSWORD = "Tech@12345";

const EMAIL_INPUT = 'input[placeholder="e.g., name@campus.edu"]';
const PASSWORD_INPUT = 'input[placeholder="Enter your password"]';

async function openLogin(page) {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
}

async function waitForDeveloperQuickSignIn(page) {
  const quickSignIn = page.getByRole("button", {
    name: /quick sign-in \(email only\)/i,
  });
  try {
    await quickSignIn.waitFor({ state: "visible", timeout: 12_000 });
    return quickSignIn;
  } catch {
    return null;
  }
}

async function finishFirstLoginSetupIfNeeded(page, expectedUrlPattern) {
  const skipForNow = page.getByRole("button", { name: /skip for now/i });
  if (await skipForNow.isVisible().catch(() => false)) {
    await skipForNow.click();
  }
  await page.waitForURL(expectedUrlPattern, { timeout: 20_000 });
  await expect(page.locator("header").getByRole("button", { name: "Notifications" })).toBeVisible();
}

async function loginWithUi(page, { email, password, expectedUrlPattern }) {
  await openLogin(page);
  await page.locator(EMAIL_INPUT).fill(email);

  const quickSignIn = await waitForDeveloperQuickSignIn(page);
  if (quickSignIn) {
    await quickSignIn.click();
    await finishFirstLoginSetupIfNeeded(page, expectedUrlPattern);
    return;
  }

  await page.locator(PASSWORD_INPUT).fill(password);
  await page.getByRole("button", { name: /^login$/i }).click();
  await finishFirstLoginSetupIfNeeded(page, expectedUrlPattern);
}

export async function loginAsAdmin(page) {
  await loginWithUi(page, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    expectedUrlPattern: /\/admin(?:[/?#]|$)/,
  });
}

export async function loginAsUser(page) {
  await loginWithUi(page, {
    email: USER_EMAIL,
    password: USER_PASSWORD,
    expectedUrlPattern: /\/dashboard(?:[/?#]|$)/,
  });
}

export async function loginAsTechnician(page) {
  await loginWithUi(page, {
    email: TECHNICIAN_EMAIL,
    password: TECHNICIAN_PASSWORD,
    expectedUrlPattern: /\/technician(?:[/?#]|$)/,
  });
}
