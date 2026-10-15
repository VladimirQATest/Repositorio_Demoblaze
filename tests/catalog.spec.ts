import { test, expect } from '../fixtures/testFixtures';
import { HomePage } from '../pages/HomePage';

/** Catalog browsing — knowledge base §6 Flows A & B, §9 scenarios 1, 13-15. */
test.describe('Catalog', () => {
  test('home page loads with carousel, categories and 9 products', async ({
    page,
  }) => {
    const home = new HomePage(page);
    await home.open();

    await expect(page).toHaveTitle('STORE');
    await expect(home.heroCarousel).toBeVisible();
    await expect(home.carouselSlides).toHaveCount(3);
    await expect(home.carouselIndicators).toHaveCount(3);
    await expect(home.categoriesHeader).toHaveText('CATEGORIES');
    await expect(home.phonesCategory).toBeVisible();
    await expect(home.laptopsCategory).toBeVisible();
    await expect(home.monitorsCategory).toBeVisible();
    await expect(home.productCards).toHaveCount(9);
    await expect(home.footer).toContainText('PRODUCT STORE');
    await expect(home.copyright).toContainText('Copyright');
  });

  test('pagination: Next and Previous navigate the catalog', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    const firstPageTitles = await home.getProductTitles();

    await home.goToNextPage();
    // The catalog has 15 products: page 1 shows 9, page 2 shows the rest.
    const secondPageTitles = await home.getProductTitles();
    expect(secondPageTitles.length).toBeGreaterThan(0);
    expect(secondPageTitles).not.toEqual(firstPageTitles);

    // Quirk of the demo app: the Next handler never updates the Previous
    // button value (it stays at the first product id), so "Previous"
    // re-requests pagination from the beginning and renders a different
    // 9-product window (products 2-10) instead of the original first page.
    await home.goToPreviousPage();
    const previousPageTitles = await home.getProductTitles();
    expect(previousPageTitles.length).toBeGreaterThan(0);
    expect(previousPageTitles).not.toEqual(secondPageTitles);
  });

  for (const [label, apiCategory] of [
    ['Phones', 'phone'],
    ['Laptops', 'notebook'],
    ['Monitors', 'monitor'],
  ] as const) {
    test(`filter by category "${label}" renders exactly that category's products`, async ({
      page,
      api,
    }) => {
      const home = new HomePage(page);
      await home.open();

      await home.filterByCategory(label);

      // Cross-check the rendered grid against the API response.
      // (Some API titles contain trailing whitespace, e.g. "Sony vaio i7\n".)
      const expectedTitles = (await api.getProductsByCategory(apiCategory))
        .map((product) => product.title.trim())
        .sort();
      const renderedTitles = (await home.getProductTitles()).sort();
      expect(renderedTitles).toEqual(expectedTitles);
    });
  }

  test('hero carousel navigation changes the active slide', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();

    // Exactly one slide is active at any time (the carousel auto-rides).
    await expect(
      home.page.locator('#carouselExampleIndicators .carousel-item.active'),
    ).toHaveCount(1);

    const initialIndex = await home.activeSlideIndex();
    await home.carouselNext.click();

    await expect.poll(home.activeSlideIndex.bind(home), { timeout: 10_000 }).not.toBe(
      initialIndex,
    );
  });
});
