import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ProductPage } from './ProductPage';

export type CategoryLabel = 'Phones' | 'Laptops' | 'Monitors';

/** Home page (index.html) — hero carousel, category sidebar, product grid, pagination. */
export class HomePage extends BasePage {
  get heroCarousel() {
    return this.page.locator('#carouselExampleIndicators');
  }

  get carouselSlides() {
    return this.page.locator('#carouselExampleIndicators .carousel-item');
  }

  get carouselIndicators() {
    return this.page.locator('#carouselExampleIndicators .carousel-indicators li');
  }

  get carouselNext() {
    return this.page.locator('#carouselExampleIndicators .carousel-control-next');
  }

  get carouselPrevious() {
    return this.page.locator('#carouselExampleIndicators .carousel-control-prev');
  }

  get categoriesHeader() {
    return this.page.locator('#cat');
  }

  get phonesCategory() {
    return this.page.getByRole('link', { name: 'Phones', exact: true });
  }

  get laptopsCategory() {
    return this.page.getByRole('link', { name: 'Laptops', exact: true });
  }

  get monitorsCategory() {
    return this.page.getByRole('link', { name: 'Monitors', exact: true });
  }

  get productCards() {
    return this.page.locator('#tbodyid .card');
  }

  get nextPageButton() {
    return this.page.locator('#next2');
  }

  get previousPageButton() {
    return this.page.locator('#prev2');
  }

  get footer() {
    return this.page.locator('#footc');
  }

  get copyright() {
    return this.page.locator('footer.py-5');
  }

  async open(): Promise<void> {
    await this.page.goto('/index.html');
    await this.waitForProductGrid();
  }

  /** Product cards are injected by jQuery after page load — always wait for them. */
  async waitForProductGrid(): Promise<void> {
    await this.productCards.first().waitFor({ state: 'attached' });
  }

  /** Titles of the products currently rendered in the grid. */
  async getProductTitles(): Promise<string[]> {
    await this.waitForProductGrid();
    const titles = await this.page.locator('#tbodyid a.hrefch').allTextContents();
    return titles.map((title) => title.trim());
  }

  /** Opens a product detail page by its card title. */
  async openProductByTitle(title: string): Promise<ProductPage> {
    const productPage = new ProductPage(this.page);
    await this.page.locator('#tbodyid a.hrefch', { hasText: title }).first().click();
    await productPage.waitForLoaded();
    return productPage;
  }

  /** Returns the product id (idp_ query param) of the card with the given title. */
  async getProductIdByTitle(title: string): Promise<string> {
    const href = await this.page
      .locator('#tbodyid a.hrefch', { hasText: title })
      .first()
      .getAttribute('href');
    expect(href, `product link for "${title}" not found`).toBeTruthy();
    const params = new URLSearchParams(href!.split('?')[1]);
    const id = params.get('idp_');
    expect(id, `no idp_ param in href "${href}"`).toBeTruthy();
    return id!;
  }

  async goToNextPage(): Promise<void> {
    const responsePromise = this.page.waitForResponse((response) =>
      response.url().includes('/pagination'),
    );
    await this.nextPageButton.click();
    await responsePromise;
    await this.waitForProductGrid();
  }

  async goToPreviousPage(): Promise<void> {
    const responsePromise = this.page.waitForResponse((response) =>
      response.url().includes('/pagination'),
    );
    await this.previousPageButton.click();
    await responsePromise;
    await this.waitForProductGrid();
  }

  async filterByCategory(category: CategoryLabel): Promise<void> {
    const link =
      category === 'Phones'
        ? this.phonesCategory
        : category === 'Laptops'
          ? this.laptopsCategory
          : this.monitorsCategory;
    const responsePromise = this.page.waitForResponse((response) =>
      response.url().includes('/bycat'),
    );
    await link.click();
    await responsePromise;
    await this.waitForProductGrid();
  }

  /** Index of the currently active carousel slide (-1 if none). */
  async activeSlideIndex(): Promise<number> {
    return this.carouselSlides.evaluateAll((slides) =>
      slides.findIndex((slide) => slide.classList.contains('active')),
    );
  }
}
