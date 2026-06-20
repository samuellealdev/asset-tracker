import { test, expect } from "@playwright/test";

test.describe("Events", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login");
    await page.getByLabel("Username").fill("admin");
    await page.getByLabel("Password").fill("admin");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/devices/, { timeout: 10_000 });
  });

  test("Manual event creation",
    { tag: ["@smoke", "@critical"] },
    async ({ page }) => {
      // First ensure there's at least one device to reference
      const deviceName = `Event-Device-${Date.now()}`;
      await page.goto("/devices/create");
      await page.getByLabel("Name").fill(deviceName);
      await page.getByLabel("Type").fill("laptop");
      await page.getByRole("button", { name: "Create Device" }).click();
      await expect(page).toHaveURL(/\/devices$/, { timeout: 10_000 });

      // Navigate to events page
      await page.goto("/events");
      await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();

      // Click Create Event
      await page.getByRole("button", { name: "Create Event" }).click();

      // Fill event form
      await page.getByLabel("Type").selectOption("device.created");
      await page.getByLabel("Device").selectOption({ index: 1 });
      await page.getByLabel("Name").fill("E2E Test Event");
      await page.getByLabel("Actor").fill("e2e-tester");
      await page.getByLabel("Description").fill("Created during E2E test");

      // Submit
      await page.getByRole("button", { name: "Create Event" }).click();

      // Should see the event in the list
      await expect(page.getByText("E2E Test Event")).toBeVisible({ timeout: 10_000 });
    },
  );

  test("Event timeline on device detail",
    { tag: ["@smoke"] },
    async ({ page }) => {
      // Create a device
      const deviceName = `Timeline-Device-${Date.now()}`;
      await page.goto("/devices/create");
      await page.getByLabel("Name").fill(deviceName);
      await page.getByLabel("Type").fill("switch");
      await page.getByRole("button", { name: "Create Device" }).click();
      await expect(page).toHaveURL(/\/devices$/, { timeout: 10_000 });

      // Navigate to device detail
      await page.getByText(deviceName).click();
      await expect(page).toHaveURL(/\/devices\//);

      // Should see the Event Timeline section
      await expect(page.getByText("Event Timeline")).toBeVisible();
    },
  );
});
