import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** Product detail page (prod.html?idp_={id}). */
export class ProductPage extends BasePage {
  get title() {
    return this.page.locator('#tbodyid h2.name');
  }

  /** e.g. "$720 *includes tax" */
  get price() {
    return this.page.locator('#tbodyid h3.price-container');
  }

  get description() {
    return this.page.locator('#more-information p');
  }

  get imageCarousel() {
    return this.page.locator('#myCarousel-2');
  }

  get addToCartButton() {
    return this.page.locator('#tbodyid a.btn-success');
  }

  async open(productId: number | string): Promise<void> {
    await this.page.goto(`/prod.html?idp_=${productId}`);
    await this.waitForLoaded();
  }

  async waitForLoaded(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  /** Numeric part of the displayed price, e.g. "$720" -> 720. */
  async priceValue(): Promise<number> {
    const text = await this.price.textContent();
    const match = text?.match(/\$\s*(\d+)/);
    expect(match, `could not parse price from "${text}"`).toBeTruthy();
    return Number(match![1]);
  }

  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
  }
}
