import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("Login with valid credentials redirects to /devices",
    { tag: ["@smoke", "@critical"] },
    async ({ page }) => {
      await page.getByLabel("Username").fill("admin");
      await page.getByLabel("Password").fill("admin");
      await page.getByRole("button", { name: "Sign in" }).click();

      // Should redirect to devices page
      await expect(page).toHaveURL(/\/devices/, { timeout: 10_000 });
      await expect(page.getByRole("heading", { name: "Devices" })).toBeVisible();
    },
  );

  test("Login with invalid credentials shows error",
    { tag: ["@smoke", "@critical"] },
    async ({ page }) => {
      await page.getByLabel("Username").fill("wrong");
      await page.getByLabel("Password").fill("wrong");
      await page.getByRole("button", { name: "Sign in" }).click();

      // Should show error message
      await expect(page.getByRole("alert")).toBeVisible();
      await expect(page.getByRole("alert")).toContainText("Invalid credentials");
    },
  );

  test("Access protected route without token redirects to login",
    { tag: ["@smoke", "@critical"] },
    async ({ page }) => {
      // Clear any stored token and try to access a protected route
      await page.evaluate(() => localStorage.clear());
      await page.goto("/devices");

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole("heading", { name: "Asset Tracker" })).toBeVisible();
    },
  );
});
