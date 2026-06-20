import { test, expect } from "@playwright/test";

test.describe("Dashboards", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Username").fill("admin");
    await page.getByLabel("Password").fill("admin");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/devices/, { timeout: 10_000 });
  });

  test("Simplified dashboard renders with overview",
    { tag: ["@smoke", "@critical"] },
    async ({ page }) => {
      await page.goto("/dashboards");
      await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

      // Health and metrics are now in the top bar — dashboards shows an overview
      await expect(page.getByText(/overview/i)).toBeVisible();
      await expect(page.getByText(/live service health/i)).toBeVisible();
    },
  );
});
