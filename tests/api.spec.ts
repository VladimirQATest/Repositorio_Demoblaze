import { test, expect } from '../fixtures/testFixtures';
import { PASSWORD } from '../test-data/users';

/** API-level tests for the DemoBlaze REST contract (knowledge base §5). */
test.describe('API', () => {
  test('GET /entries returns the first catalog page with pagination info', async ({
    api,
  }) => {
    const data = await api.getProducts();
    expect(data.Items.length).toBe(9);
    expect(data.LastEvaluatedKey?.id).toBeTruthy();
    for (const product of data.Items) {
      expect(product.title).toBeTruthy();
      expect(product.price).toBeGreaterThan(0);
    }
  });

  test('POST /pagination returns a different page of products', async ({ api }) => {
    const firstPage = await api.getProducts();
    const secondPage = await api.getProductsPage(firstPage.LastEvaluatedKey!.id);
    expect(secondPage.Items.length).toBeGreaterThan(0);
    const firstIds = firstPage.Items.map((p) => p.id);
    for (const product of secondPage.Items) {
      expect(firstIds).not.toContain(product.id);
    }
  });

  test('POST /bycat returns products of the requested category', async ({ api }) => {
    for (const category of ['phone', 'notebook', 'monitor'] as const) {
      const products = await api.getProductsByCategory(category);
      expect(products.length).toBeGreaterThan(0);
    }
  });

  test('POST /view returns product details', async ({ api }) => {
    const catalog = await api.getProducts();
    const product = await api.getProduct(catalog.Items[0].id);
    expect(product.title).toBe(catalog.Items[0].title);
    expect(product.price).toBe(catalog.Items[0].price);
    expect(product.desc).toBeTruthy();
    expect(product.img).toBeTruthy();
  });

  test('signup + login round trip returns a valid auth token', async ({
    api,
    uniqueUsername,
  }) => {
    await api.signUp(uniqueUsername, PASSWORD);
    const token = await api.login(uniqueUsername, PASSWORD);
    expect(token.length).toBeGreaterThan(0);

    const check = await api.checkToken(token);
    expect(check.Item.username).toBe(uniqueUsername);
  });

  test('login with a wrong password is rejected by the API', async ({
    api,
    uniqueUsername,
  }) => {
    await api.signUp(uniqueUsername, PASSWORD);
    await expect(api.login(uniqueUsername, 'WrongPass1!')).rejects.toThrow(
      'Wrong password.',
    );
  });
});
