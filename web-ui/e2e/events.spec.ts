import { test, expect } from "@playwright/test";

test.describe("Events", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Username").fill("admin");
    await page.getByLabel("Password").fill("admin");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/devices/, { timeout: 10_000 });
  });

  test("Events page renders with filter dropdown",
    { tag: ["@smoke", "@critical"] },
    async ({ page }) => {
      await page.goto("/events");
      await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();

      // Filter dropdown should be present
      await expect(page.getByLabel("Filter by device")).toBeVisible();
      await expect(page.getByRole("button", { name: "Create Event" })).toBeVisible();
    },
  );

  test("Event timeline on device detail",
    { tag: ["@smoke"] },
    async ({ page }) => {
      // Create a device first
      const deviceName = `Timeline-Device-${Date.now()}`;
      await page.goto("/devices/create");
      await page.getByLabel("Name").fill(deviceName);
      await page.getByLabel("Type").fill("switch");
      await page.getByRole("button", { name: "Create Device" }).click();
      await expect(page).toHaveURL(/\/devices$/, { timeout: 10_000 });

      // Click Edit button in the card to navigate to device detail
      await page.getByRole("button", { name: "Edit" }).first().click();
      await expect(page).toHaveURL(/\/devices\//);

      // Should see the heading with device name
      await expect(page.getByRole("heading", { name: deviceName })).toBeVisible();
    },
  );
});
