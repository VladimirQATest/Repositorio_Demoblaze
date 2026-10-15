import { test, expect } from '../fixtures/testFixtures';
import { CartPage } from '../pages/CartPage';
import { HomePage } from '../pages/HomePage';
import { NavBar } from '../pages/components/NavBar';
import { installDialogHandler } from '../utils/dialogs';
import { PurchaseSuccessDialog } from '../utils/sweetalert';
import { ORDER_DETAILS } from '../test-data/users';

/** Cart & checkout — knowledge base §6 Flow F, §9 scenarios 4, 5, 16-18. */
test.describe('Cart and checkout', () => {
  /** Adds the given number of products to the cart (anonymous flow). */
  async function addProductsToCart(page: import('@playwright/test').Page, count: number) {
    const dialogs = installDialogHandler(page);
    const home = new HomePage(page);
    await home.open();

    const titles = await home.getProductTitles();
    for (let i = 0; i < count; i++) {
      const productPage = await home.openProductByTitle(titles[i]);
      await productPage.addToCart();
      // Anonymous users get "Product added" (no period); logged-in get "Product added."
      await dialogs.waitForMessage(['Product added.', 'Product added']);
      await home.open();
    }

    return titles.slice(0, count);
  }

  test('anonymous user can add products and the cart shows the correct total', async ({
    page,
    api,
  }) => {
    test.setTimeout(120_000);
    const titles = await addProductsToCart(page, 2);

    // Expected total from the API (the app sums parseInt(price) client-side).
    const catalog = await api.getProducts();
    const products = catalog.Items.filter((p) => titles.includes(p.title));
    expect(products.length).toBe(2);
    const expectedTotal = products.reduce((sum, p) => sum + p.price, 0);

    const nav = new NavBar(page);
    await nav.goToCart();
    const cart = new CartPage(page);

    await expect(cart.productsHeading).toBeVisible();
    await expect(cart.cartRows).toHaveCount(2);
    // Cart order is not deterministic (entries are keyed by random GUIDs).
    expect((await cart.getRowTitles()).sort()).toEqual([...titles].sort());
    expect(await cart.totalValue()).toBe(expectedTotal);
  });

  test('deleting an item recalculates the cart total', async ({
    page,
    api,
  }) => {
    test.setTimeout(120_000);
    const titles = await addProductsToCart(page, 2);

    const catalog = await api.getProducts();
    const products = catalog.Items.filter((p) => titles.includes(p.title));
    expect(products.length).toBe(2);

    const nav = new NavBar(page);
    await nav.goToCart();
    const cart = new CartPage(page);
    await expect(cart.cartRows).toHaveCount(2);
    expect((await cart.getRowTitles()).sort()).toEqual([...titles].sort());

    await cart.deleteFirstItem(1);

    const remainingTitle = (await cart.getRowTitles())[0];
    const remaining = products.find((p) => p.title === remainingTitle);
    expect(remaining, `remaining product "${remainingTitle}" should be one of the added products`).toBeTruthy();
    expect(await cart.totalValue()).toBe(remaining!.price);
  });

  test('place order happy path shows the purchase success popup', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await addProductsToCart(page, 1);

    const nav = new NavBar(page);
    await nav.goToCart();
    const cart = new CartPage(page);
    await expect(cart.cartRows).toHaveCount(1);

    const orderModal = await cart.clickPlaceOrder();
    await expect(orderModal.totalLabel).toContainText('Total:');

    await orderModal.placeOrder(ORDER_DETAILS);

    // The purchase confirmation is a bootstrap-sweetalert popup (not a native dialog).
    const sweetAlert = new PurchaseSuccessDialog(page);
    await sweetAlert.waitForVisible();
    await expect(sweetAlert.title).toHaveText('Thank you for your purchase!');
    await expect(sweetAlert.text).toContainText(`Amount:`);
    await expect(sweetAlert.text).toContainText(`Card Number: ${ORDER_DETAILS.card}`);
    await expect(sweetAlert.text).toContainText(`Name: ${ORDER_DETAILS.name}`);

    await sweetAlert.confirm();
    // The confirm callback sets location.href = 'index.html'.
    await expect(page).toHaveURL(/\/index\.html/, { timeout: 30_000 });
    await expect(page).toHaveTitle('STORE');
  });

  test('purchase with empty name or card shows the validation alert', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const dialogs = installDialogHandler(page);
    await addProductsToCart(page, 1);

    const nav = new NavBar(page);
    await nav.goToCart();
    const cart = new CartPage(page);
    await expect(cart.cartRows).toHaveCount(1);

    const orderModal = await cart.clickPlaceOrder();
    // Leave name and card empty and submit.
    await orderModal.purchaseButton.click();

    await dialogs.waitForMessage('Please fill out Name and Creditcard.');
    await expect(orderModal.modal).toBeVisible();
  });

  test('logged-in user can add products to the cart (token flow)', async ({
    authenticatedPage,
  }) => {
    const { page } = authenticatedPage;
    const dialogs = installDialogHandler(page);

    const nav = new NavBar(page);
    const home = new HomePage(page);
    await home.open();

    // The token cookie was injected by the fixture — the session should be active.
    await expect(nav.welcomeUser).toBeVisible();
    await expect(nav.welcomeUser).toHaveText(`Welcome ${authenticatedPage.username}`);

    const titles = await home.getProductTitles();
    const productPage = await home.openProductByTitle(titles[0]);
    await productPage.addToCart();
    await dialogs.waitForMessage('Product added.');

    await nav.goToCart();
    const cart = new CartPage(page);
    await expect(cart.cartRows).toHaveCount(1);
    expect(await cart.getRowTitles()).toEqual([titles[0]]);
  });
});
