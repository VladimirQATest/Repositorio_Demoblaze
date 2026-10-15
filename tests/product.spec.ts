import { test, expect } from '../fixtures/testFixtures';
import { HomePage } from '../pages/HomePage';
import { installDialogHandler } from '../utils/dialogs';

/** Product detail — knowledge base §6 Flow C, §9 scenarios 2-3. */
test.describe('Product detail', () => {
  test('opening a product from the catalog shows matching title, price and description', async ({
    page,
    api,
  }) => {
    const home = new HomePage(page);
    await home.open();

    const titles = await home.getProductTitles();
    const targetTitle = titles[0];
    const productId = await home.getProductIdByTitle(targetTitle);

    const productPage = await home.openProductByTitle(targetTitle);

    await expect(productPage.title).toHaveText(targetTitle);
    await expect(productPage.price).toContainText('$');
    await expect(productPage.description).toBeVisible();
    await expect(productPage.imageCarousel).toBeVisible();

    // Cross-check the rendered detail against the API.
    const product = await api.getProduct(productId);
    expect(product.title).toBe(targetTitle);
    await expect(productPage.price).toContainText(`$${product.price}`);
  });

  test('add to cart from the product page shows the success alert', async ({
    page,
  }) => {
    const dialogs = installDialogHandler(page);
    const home = new HomePage(page);
    await home.open();

    const titles = await home.getProductTitles();
    const productPage = await home.openProductByTitle(titles[0]);
    await productPage.addToCart();

    // The app alerts "Product added." for logged-in users and
    // "Product added" (no period) for anonymous users.
    await dialogs.waitForMessage(['Product added.', 'Product added']);
  });

  test('product page can be opened directly by id', async ({ page, api }) => {
    const catalog = await api.getProducts();
    const product = catalog.Items[0];

    const { ProductPage } = await import('../pages/ProductPage');
    const productPage = new ProductPage(page);
    await productPage.open(product.id);

    await expect(productPage.title).toHaveText(product.title);
    await expect(productPage.price).toContainText(`$${product.price}`);
  });
});
