import { test, expect } from "@playwright/test";

test.describe("Dashboards", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Username").fill("admin");
    await page.getByLabel("Password").fill("admin");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/devices/, { timeout: 10_000 });
  });

  test("Health status display",
    { tag: ["@smoke", "@critical"] },
    async ({ page }) => {
      await page.goto("/dashboards");
      await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Service Health" })).toBeVisible();

      // Health cards should be visible for both services
      await expect(page.getByRole("heading", { name: "Go API" }).first()).toBeVisible();
      await expect(page.getByRole("heading", { name: "Node.js API" }).first()).toBeVisible();
    },
  );

  test("Metrics display",
    { tag: ["@smoke"] },
    async ({ page }) => {
      await page.goto("/dashboards");

      // Metrics section should be present
      await expect(page.getByText("Auto-refreshes every 30s")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Go API" }).first()).toBeVisible();
      await expect(page.getByRole("heading", { name: "Node.js API" }).first()).toBeVisible();
    },
  );
});
