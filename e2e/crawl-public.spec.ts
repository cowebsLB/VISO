import { expect, test } from "@playwright/test";

/** Keep in sync with seeded / static catalog ids for static export smoke. */
const PRODUCT_IDS = ["kaak", "maamoul-pistachio", "brioche", "armenian-gata"];

test.describe("public crawl", () => {
  for (const id of PRODUCT_IDS) {
    test(`product page ${id}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const res = await page.goto(`/catalog/${id}`);
      expect(res?.ok()).toBeTruthy();
      await expect(page.locator("body")).toBeVisible();
      expect(errors).toEqual([]);
    });
  }

  test("checkout page loads", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("contact page loads", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
