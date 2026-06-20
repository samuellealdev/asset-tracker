import { test, expect } from "@playwright/test";

test.describe("Devices CRUD", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login");
    await page.getByLabel("Username").fill("admin");
    await page.getByLabel("Password").fill("admin");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/devices/, { timeout: 10_000 });
  });

  test("Create device appears in list",
    { tag: ["@smoke", "@critical"] },
    async ({ page }) => {
      // Navigate directly to create page
      await page.goto("/devices/create");
      await page.waitForURL(/\/devices\/create/, { timeout: 10_000 });

      // Fill form
      const deviceName = `E2E-Device-${Date.now()}`;
      await page.getByLabel("Name").fill(deviceName);
      await page.getByLabel("Type").fill("laptop");
      await page.getByRole("button", { name: "Create Device" }).click();

      // Should redirect to devices list and show the new device in a card
      await expect(page).toHaveURL(/\/devices$/, { timeout: 10_000 });
      await expect(page.getByText(deviceName)).toBeVisible({ timeout: 10_000 });
    },
  );

  test("View device detail",
    { tag: ["@smoke"] },
    async ({ page }) => {
      // Create a device first
      const deviceName = `Detail-Device-${Date.now()}`;
      await page.getByRole("button", { name: /create device/i }).first().click({ force: true });
      await page.waitForURL(/\/devices\/create/, { timeout: 10_000 });
      await page.getByLabel("Name").fill(deviceName);
      await page.getByLabel("Type").fill("server");
      await page.getByRole("button", { name: "Create Device" }).click();
      await expect(page).toHaveURL(/\/devices$/, { timeout: 10_000 });

      // Click Edit button in the card to navigate to device detail
      await page.getByRole("button", { name: "Edit" }).first().click();
      await expect(page).toHaveURL(/\/devices\//);

      // Should see device detail
      await expect(page.getByRole("heading", { name: deviceName })).toBeVisible();
      await expect(page.getByText("Event Timeline")).toBeVisible();
    },
  );

  test("Edit device name",
    { tag: ["@smoke"] },
    async ({ page }) => {
      // Create a device first
      const originalName = `Edit-Orig-${Date.now()}`;
      await page.getByRole("button", { name: /create device/i }).first().click({ force: true });
      await page.waitForURL(/\/devices\/create/, { timeout: 10_000 });
      await page.getByLabel("Name").fill(originalName);
      await page.getByLabel("Type").fill("desktop");
      await page.getByRole("button", { name: "Create Device" }).click();
      await expect(page).toHaveURL(/\/devices$/, { timeout: 10_000 });

      // Click Edit button in the card to navigate to device detail
      await page.getByRole("button", { name: "Edit" }).first().click();
      await expect(page).toHaveURL(/\/devices\//);

      // Click edit button
      await page.getByRole("button", { name: "Edit" }).click();

      // Update name
      const updatedName = `Edit-Updated-${Date.now()}`;
      await page.getByLabel("Name").clear();
      await page.getByLabel("Name").fill(updatedName);
      await page.getByRole("button", { name: "Save Changes" }).click();

      // Should see updated name
      await expect(page.getByRole("heading", { name: updatedName })).toBeVisible({ timeout: 10_000 });
    },
  );

  test("Delete device with confirmation",
    { tag: ["@smoke", "@critical"] },
    async ({ page }) => {
      // Create a device first
      const deleteName = `Delete-Me-${Date.now()}`;
      await page.getByRole("button", { name: /create device/i }).first().click({ force: true });
      await page.waitForURL(/\/devices\/create/, { timeout: 10_000 });
      await page.getByLabel("Name").fill(deleteName);
      await page.getByLabel("Type").fill("router");
      await page.getByRole("button", { name: "Create Device" }).click();
      await expect(page).toHaveURL(/\/devices$/, { timeout: 10_000 });

      // Click Edit button in the card to navigate to device detail
      await page.getByRole("button", { name: "Edit" }).first().click();
      await expect(page).toHaveURL(/\/devices\//);

      // Click delete button
      await page.getByRole("button", { name: "Delete" }).first().click();

      // Confirm deletion in dialog
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(deleteName);
      await dialog.getByRole("button", { name: "Delete" }).click();

      // Should redirect back to devices list
      await expect(page).toHaveURL(/\/devices$/, { timeout: 10_000 });
      await expect(page.getByText(deleteName)).not.toBeVisible();
    },
  );
});
